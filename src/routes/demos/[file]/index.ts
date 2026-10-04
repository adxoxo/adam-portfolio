import { isDev } from '@qwik.dev/core/build';
import type { RequestHandler } from '@qwik.dev/router';
import { demoMime, parseRange, sliceStream } from '~/lib/server/media';

// Browser cache only. The Workers adapter puts any public-cacheable anonymous
// GET response into the Cache API: Cloudflare rejects cache.put for a 206, and
// a cached full body would answer later Range requests with the Cache API's
// own rules (If-Range ignored, multipart ranges) and could outlive a deploy.
// `private` keeps every media response out of that shared cache; the ETag
// lets the browser revalidate with If-None-Match.
const MEDIA_CACHE = 'private, max-age=3600';

const plain = (status: number, text: string, extra: Record<string, string> = {}) =>
	new Response(text, {
		status,
		headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...extra }
	});

/**
 * GET/HEAD /demos/<id>.<mp4|webp|jpg|vtt>: serves public/_demos/<file> from
 * the ASSETS binding with byte ranges (200, 206, 304, 416). Unknown or
 * disallowed names answer 404, never the HTML page.
 */
const serveDemo: RequestHandler = async (event) => {
	const file = event.params.file ?? '';
	const mime = demoMime(file);
	if (!mime) throw event.send(plain(404, 'Not Found'));

	const assets = event.platform.env?.ASSETS;
	if (!assets) {
		// `vite dev` has no ASSETS binding; Vite serves public/ (with ranges) itself.
		if (isDev) throw event.redirect(307, `/_demos/${file}`);
		throw event.send(plain(503, 'media store unavailable'));
	}

	const asset = await assets.fetch(new Request(new URL(`/_demos/${file}`, event.url.origin)));
	const assetType = asset.headers.get('content-type') ?? '';
	if (asset.status !== 200 || !asset.body || assetType.startsWith('text/html')) {
		await asset.body?.cancel();
		throw event.send(plain(404, 'Not Found'));
	}

	let body: ReadableStream<Uint8Array> = asset.body;
	let size = Number(asset.headers.get('content-length') ?? NaN);
	// An encoded body's Content-Length counts compressed bytes; measure the
	// decoded body instead (only small text files could ever arrive encoded).
	const encoded = (asset.headers.get('content-encoding') ?? 'identity') !== 'identity';
	if (!Number.isSafeInteger(size) || encoded) {
		const bytes = new Uint8Array(await asset.arrayBuffer());
		size = bytes.byteLength;
		body = new Response(bytes).body!;
	}

	const etag = asset.headers.get('etag');
	const headers = new Headers({
		'Content-Type': mime,
		'Accept-Ranges': 'bytes',
		'X-Content-Type-Options': 'nosniff'
	});
	if (etag) headers.set('ETag', etag);
	const isHead = event.method === 'HEAD';
	const respond = (status: number, stream: (() => ReadableStream<Uint8Array>) | null) => {
		// HEAD and bodiless statuses release the asset stream instead of reading it.
		if (isHead || !stream) {
			body.cancel().catch(() => {});
			return event.send(new Response(null, { status, headers }));
		}
		// Pipe the body ourselves: a player that seeks aborts the running range
		// request, and the adapter's own pipe would leave that rejection unhandled.
		event.status(status);
		headers.forEach((value, key) => event.headers.set(key, value));
		stream()
			.pipeTo(event.getWritableStream())
			.catch(() => {});
		return event.exit();
	};

	// If-Range: honour the range only while the validator still matches.
	const ifRange = event.request.headers.get('if-range');
	const rangeHeader = ifRange && ifRange !== etag ? null : event.request.headers.get('range');
	const range = parseRange(rangeHeader, size);

	if (range === 'unsatisfiable') {
		headers.set('Content-Range', `bytes */${size}`);
		headers.set('Cache-Control', 'no-store');
		return respond(416, null);
	}

	if (range === null) {
		if (etag && event.request.headers.get('if-none-match') === etag) {
			headers.set('Cache-Control', MEDIA_CACHE);
			return respond(304, null);
		}
		headers.set('Content-Length', String(size));
		headers.set('Cache-Control', MEDIA_CACHE);
		return respond(200, () => body);
	} else {
		const { start, end } = range;
		headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
		headers.set('Content-Length', String(end - start + 1));
		headers.set('Cache-Control', MEDIA_CACHE);
		return respond(206, () => sliceStream(body, start, end));
	}
};

export const onGet = serveDemo;
export const onHead = serveDemo;
