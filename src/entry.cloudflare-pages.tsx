/*
 * Cloudflare Workers entry (Qwik Router's official Workers adapter, which
 * reuses the cloudflare-pages middleware). The adapter build wraps this in
 * dist/_worker.js as `export default { fetch }`.
 *
 * https://next.qwik.dev/docs/deployments/cloudflare-workers/
 */
import { createQwikRouter } from '@qwik.dev/router/middleware/cloudflare-pages';
import { applySecurityHeaders } from './lib/server/security';
import render from './entry.ssr';

declare const FixedLengthStream: {
	new (length: number): { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> };
};

const router = createQwikRouter({ render, checkOrigin: true });

/**
 * Plain HTTP to the production hostname gets a permanent 308 redirect to the
 * same path and query over HTTPS before the router runs; 308 keeps the method
 * and body. wrangler.jsonc sets assets.run_worker_first, so static files take
 * this path too. Other hostnames (localhost, 127.0.0.1) and HTTPS pass through.
 *
 * The adapter streams every route body through its own TransformStream, so
 * the runtime drops a Content-Length the route set and answers chunked. The
 * /demos media route declares exact lengths; its responses get them back
 * through a FixedLengthStream, which video seeking relies on.
 */
const fetch: typeof router = async (request, env, ctx) => {
	const url = new URL(request.url);
	if (url.protocol === 'http:' && url.hostname === 'portfolio.aquryu.space') {
		const location = new URL(url);
		location.protocol = 'https:';
		location.port = '';
		const redirect = new Response(null, { status: 308, headers: { Location: location.href } });
		applySecurityHeaders(redirect.headers, url);
		return redirect;
	}
	const response = await router(request, env, ctx);
	const secured = new Response(response.body, response);
	applySecurityHeaders(secured.headers, url);
	const length = Number(secured.headers.get('content-length') ?? NaN);
	if (
		request.method === 'HEAD' ||
		!url.pathname.startsWith('/demos/') ||
		!secured.body ||
		!Number.isSafeInteger(length) ||
		typeof FixedLengthStream !== 'function'
	) {
		return secured;
	}
	const { readable, writable } = new FixedLengthStream(length);
	ctx.waitUntil(secured.body.pipeTo(writable).catch(() => {}));
	return new Response(readable, secured);
};

export { fetch };
