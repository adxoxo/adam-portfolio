// Byte-range delivery for the local project demos (MP4, poster, captions).
// Workers static assets answer a Range request with the full 200 body, and
// iOS Safari will not play or seek an MP4 without 206 responses, so the
// /demos/[file] route serves public/_demos/<file> through the ASSETS binding
// and slices ranges itself.

/** Published demo file names: one flat name, lowercase id, known extension.
 *  No dots before the extension, no slashes, so no traversal is possible. */
const DEMO_FILE = /^[a-z0-9][a-z0-9_-]{0,63}\.(mp4|webp|jpg|vtt)$/;

const MIME: Record<string, string> = {
	mp4: 'video/mp4',
	webp: 'image/webp',
	jpg: 'image/jpeg',
	vtt: 'text/vtt; charset=utf-8'
};

/** MIME type for an allowed demo file name, or null when the name is not allowed. */
export function demoMime(file: string): string | null {
	const m = DEMO_FILE.exec(file);
	return m ? MIME[m[1]] : null;
}

export type ByteRange = { start: number; end: number };

/**
 * Parse a single `Range: bytes=` header against a body of `size` bytes.
 * - null: no usable range (absent, other unit, multiple ranges, bad syntax);
 *   serve the full body with 200.
 * - 'unsatisfiable': answer 416 with `Content-Range: bytes * /size`.
 * - otherwise the inclusive byte range to send with 206.
 */
export function parseRange(header: string | null, size: number): ByteRange | 'unsatisfiable' | null {
	if (!header) return null;
	const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
	if (!m || (m[1] === '' && m[2] === '')) return null;
	if (m[1] === '') {
		// suffix range: the last N bytes
		const n = Number(m[2]);
		if (n === 0 || size === 0) return 'unsatisfiable';
		return { start: Math.max(0, size - n), end: size - 1 };
	}
	const start = Number(m[1]);
	if (start >= size) return 'unsatisfiable';
	const end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
	if (end < start) return null;
	return { start, end };
}

/** Pass through bytes [start, end] of a stream, then cancel the source. */
export function sliceStream(
	body: ReadableStream<Uint8Array>,
	start: number,
	end: number
): ReadableStream<Uint8Array> {
	const reader = body.getReader();
	let pos = 0;
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			for (;;) {
				const { done, value } = await reader.read();
				if (done) {
					controller.close();
					return;
				}
				const chunkStart = pos;
				pos += value.byteLength;
				if (pos <= start) continue;
				const from = Math.max(0, start - chunkStart);
				const to = Math.min(value.byteLength, end + 1 - chunkStart);
				if (to > from) controller.enqueue(value.subarray(from, to));
				if (pos > end) {
					controller.close();
					reader.cancel().catch(() => {});
				}
				return;
			}
		},
		cancel(reason) {
			return reader.cancel(reason);
		}
	});
}
