// Shared guards for the request APIs (/api/lead, /api/schedule). Neither API
// logs personal details, and neither reports success unless something durable
// actually received the request.
import { z } from 'zod';

export const CONTACT_EMAIL = 'adamgemenez@gmail.com';
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
export const BOOKING_URL = 'https://calendly.com/adamgemenez/30min';

const WEBHOOK_TIMEOUT_MS = 8000;

export const emailField = z
	.string()
	.trim()
	.regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'invalid email')
	.max(200);

/** Tiny per-isolate IP bucket: 5 requests / 10 min. Good enough as a first
 *  guard; a KV-backed limiter can replace it later without touching callers. */
export function createRateLimiter(windowMs = 10 * 60 * 1000, max = 5) {
	const hits = new Map<string, number[]>();
	return (ip: string): boolean => {
		const now = Date.now();
		const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
		recent.push(now);
		hits.set(ip, recent);
		return recent.length > max;
	};
}

/** POST JSON to a configured webhook. True only for a 2xx answer. Logs the
 *  failure kind (status or error class), never the payload. */
export async function postWebhook(tag: string, url: string, body: unknown): Promise<boolean> {
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS)
		});
		if (!res.ok) console.error(`[${tag}] webhook answered ${res.status}`);
		return res.ok;
	} catch (e) {
		console.error(`[${tag}] webhook failed:`, e instanceof Error ? e.name : 'error');
		return false;
	}
}
