/*
 * Cloudflare Workers entry (Qwik Router's official Workers adapter, which
 * reuses the cloudflare-pages middleware). The adapter build wraps this in
 * dist/_worker.js as `export default { fetch }`.
 *
 * https://next.qwik.dev/docs/deployments/cloudflare-workers/
 */
import { createQwikRouter } from '@qwik.dev/router/middleware/cloudflare-pages';
import render from './entry.ssr';

declare const FixedLengthStream: {
	new (length: number): { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> };
};

const router = createQwikRouter({ render });

/**
 * The adapter streams every route body through its own TransformStream, so
 * the runtime drops a Content-Length the route set and answers chunked. The
 * /demos media route declares exact lengths; its responses get them back
 * through a FixedLengthStream, which video seeking relies on.
 */
const fetch: typeof router = async (request, env, ctx) => {
	const response = await router(request, env, ctx);
	const length = Number(response.headers.get('content-length') ?? NaN);
	if (
		request.method === 'HEAD' ||
		!new URL(request.url).pathname.startsWith('/demos/') ||
		!response.body ||
		!Number.isSafeInteger(length) ||
		typeof FixedLengthStream !== 'function'
	) {
		return response;
	}
	const { readable, writable } = new FixedLengthStream(length);
	ctx.waitUntil(response.body.pipeTo(writable).catch(() => {}));
	return new Response(readable, response);
};

export { fetch };
