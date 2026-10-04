import type { RequestEventBase } from '@qwik.dev/router';

export type RateLimitBindingName =
	| 'LOGIN_RATE_LIMITER'
	| 'PUBLIC_WRITE_RATE_LIMITER'
	| 'ADMIN_WRITE_RATE_LIMITER';

export type RateLimitResult = 'allowed' | 'limited' | 'unavailable';

type SecurityEvent = Pick<RequestEventBase, 'env' | 'platform' | 'url'>;

function rateLimitBinding(event: SecurityEvent, name: RateLimitBindingName): unknown {
	const bindings = event.platform?.env;
	return bindings && typeof bindings === 'object' ? Reflect.get(bindings, name) : undefined;
}

/** Use the Cloudflare Rate Limiting binding. Missing bindings fail closed on
 * deployed hosts and stay open only on localhost for the Vite development server. */
export async function checkRateLimit(
	event: SecurityEvent,
	name: RateLimitBindingName,
	key: string
): Promise<RateLimitResult> {
	const binding = rateLimitBinding(event, name);
	const limit = binding && typeof binding === 'object' ? Reflect.get(binding, 'limit') : undefined;
	if (typeof limit !== 'function') {
		return event.url.hostname === 'localhost' || event.url.hostname === '127.0.0.1'
			? 'allowed'
			: 'unavailable';
	}

	try {
		const result: unknown = await Reflect.apply(limit, binding, [{ key }]);
		if (!result || typeof result !== 'object' || typeof Reflect.get(result, 'success') !== 'boolean') {
			return 'unavailable';
		}
		return Reflect.get(result, 'success') ? 'allowed' : 'limited';
	} catch {
		return 'unavailable';
	}
}

export function isSameOrigin(request: Request, url: URL): boolean {
	const origin = request.headers.get('origin');
	if (origin) {
		try {
			return new URL(origin).origin === url.origin;
		} catch {
			return false;
		}
	}
	return request.headers.get('sec-fetch-site') !== 'cross-site';
}

const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"form-action 'self'",
	"script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
	"style-src 'self' 'unsafe-inline'",
	"font-src 'self'",
	"img-src 'self' data: blob: https://cdn.loom.com",
	"media-src 'self' blob:",
	"frame-src https://www.loom.com",
	"connect-src 'self' https://cloudflareinsights.com https://*.cloudflareinsights.com"
].join('; ');

const CONTENT_SECURITY_POLICY_REPORT_ONLY = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"form-action 'self'",
	"script-src 'self' https://static.cloudflareinsights.com",
	"style-src 'self'",
	"font-src 'self'",
	"img-src 'self' data: blob: https://cdn.loom.com",
	"media-src 'self' blob:",
	"frame-src https://www.loom.com",
	"connect-src 'self' https://cloudflareinsights.com https://*.cloudflareinsights.com"
].join('; ');

/** Add browser security headers without changing cache, cookie, range, or
 * content-length headers. The stricter inline policy remains report-only. */
export function applySecurityHeaders(headers: Headers, requestUrl: URL): void {
	headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
	headers.set('Content-Security-Policy-Report-Only', CONTENT_SECURITY_POLICY_REPORT_ONLY);
	headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=(), payment=(), usb=(), fullscreen=(self "https://www.loom.com"), picture-in-picture=(self "https://www.loom.com")');
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('X-Frame-Options', 'DENY');
	if (requestUrl.protocol === 'https:' && requestUrl.hostname === 'portfolio.aquryu.space') {
		headers.set('Strict-Transport-Security', 'max-age=31536000');
	}
}
