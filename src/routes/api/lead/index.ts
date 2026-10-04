import type { RequestHandler } from '@qwik.dev/router';
import { z } from 'zod';
import { CONTACT_MAILTO, emailField, postWebhook } from '~/lib/server/contact';
import { readEnv } from '~/lib/server/env';
import { checkRateLimit } from '~/lib/server/security';
import { createPublicSupabase } from '~/lib/server/supabase';

const leadSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: emailField,
	message: z.string().trim().min(1).max(4000)
});

// POST {name, email, message}. 200 {ok:true} only after a durable record
// (Supabase `leads` insert) or a 2xx webhook answer. Nothing configured: 503
// with an email fallback. Configured but every target failed: 502.
export const onPost: RequestHandler = async (event) => {
	const { request, clientConn, json, env } = event;
	const ip = clientConn.ip ?? '';
	const rate = await checkRateLimit(
		event,
		'PUBLIC_WRITE_RATE_LIMITER',
		`lead:${ip || "unknown-client"}`
	);
	if (rate === 'limited') throw json(429, { ok: false, error: 'rate_limited' });
	if (rate === 'unavailable') throw json(503, { ok: false, error: 'rate_limit_unavailable' });

	const body = await request.json().catch(() => null);
	const parsed = leadSchema.safeParse(body);
	if (!parsed.success) throw json(400, { ok: false, error: 'invalid' });
	const lead = parsed.data;

	// 1. durable record (Supabase is the source of truth if configured)
	const supabase = createPublicSupabase({ env });
	let stored = false;
	if (supabase) {
		const { error } = await supabase.from('leads').insert({ ...lead, source_ip: ip });
		if (error) console.error('[lead] supabase insert failed:', error.message);
		else stored = true;
	}

	// 2. notify: n8n owns email / auto-reply / telegram downstream.
	const hook = readEnv({ env }, 'N8N_LEAD_WEBHOOK');
	const notified = hook ? await postWebhook('lead', hook, lead) : false;

	if (stored || notified) throw json(200, { ok: true });
	if (!supabase && !hook) {
		throw json(503, {
			ok: false,
			error: 'not_configured',
			message: 'the contact form is not connected on this host. please email instead.',
			fallback: { email: CONTACT_MAILTO }
		});
	}
	throw json(502, { ok: false, error: 'send_failed', fallback: { email: CONTACT_MAILTO } });
};
