import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { env } from '$env/dynamic/private';

const leadSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: z
		.string()
		.trim()
		.regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'invalid email')
		.max(200),
	message: z.string().trim().min(1).max(4000)
});

// Tiny per-isolate IP bucket: 5 submissions / 10 min. Good enough as a first
// guard; a KV-backed limiter can replace it later without touching callers.
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

export const POST: RequestHandler = async ({ request, locals, fetch, getClientAddress }) => {
	const ip = getClientAddress();
	if (limited(ip)) return json({ ok: false, error: 'rate_limited' }, { status: 429 });

	const body = await request.json().catch(() => null);
	const parsed = leadSchema.safeParse(body);
	if (!parsed.success) return json({ ok: false, error: 'invalid' }, { status: 400 });
	const lead = parsed.data;

	// 1. durable record (Supabase is the source of truth if configured)
	if (locals.supabase) {
		const { error } = await locals.supabase.from('leads').insert({ ...lead, source_ip: ip });
		if (error) console.error('[lead] supabase insert failed:', error.message);
	}

	// 2. notify: n8n owns email / auto-reply / telegram downstream. Failure here
	//    is logged, never surfaced; nothing user-facing depends on it.
	const hook = env.N8N_LEAD_WEBHOOK;
	if (hook) {
		try {
			await fetch(hook, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(lead)
			});
		} catch (e) {
			console.error('[lead] n8n webhook failed:', e);
		}
	}

	// 3. seed-only mode: nothing configured, so at least log it
	if (!locals.supabase && !hook) console.log('[lead:log-only]', lead);

	return json({ ok: true });
};
