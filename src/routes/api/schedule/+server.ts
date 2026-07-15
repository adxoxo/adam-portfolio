import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { env } from '$env/dynamic/private';

const bookingSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: z
		.string()
		.trim()
		.regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'invalid email')
		.max(200),
	date: z.string().trim().min(1).max(20),
	time: z.string().trim().min(1).max(10),
	note: z.string().trim().max(2000).optional().default('')
});

// per-isolate IP bucket: 5 requests / 10 min
const WINDOW = 10 * 60 * 1000;
const MAX = 5;
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
	const now = Date.now();
	const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
	recent.push(now);
	hits.set(ip, recent);
	return recent.length > MAX;
}

// A booking request is forwarded to the n8n webhook, which creates the Google
// Calendar event. Set N8N_SCHEDULE_WEBHOOK once the VPS n8n instance is up.
// Until then it logs (so nothing is lost) and still returns ok.
export const POST: RequestHandler = async ({ request, fetch, getClientAddress }) => {
	const ip = getClientAddress();
	if (limited(ip)) return json({ ok: false, error: 'rate_limited' }, { status: 429 });

	const body = await request.json().catch(() => null);
	const parsed = bookingSchema.safeParse(body);
	if (!parsed.success) return json({ ok: false, error: 'invalid' }, { status: 400 });
	const booking = { ...parsed.data, source_ip: ip };

	const hook = env.N8N_SCHEDULE_WEBHOOK;
	if (hook) {
		try {
			await fetch(hook, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(booking)
			});
		} catch (e) {
			console.error('[schedule] n8n webhook failed:', e);
			return json({ ok: false, error: 'send_failed' }, { status: 502 });
		}
	} else {
		console.log('[schedule:log-only]', booking);
	}

	return json({ ok: true });
};
