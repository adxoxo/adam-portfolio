import type { RequestHandler } from '@qwik.dev/router';
import { z } from 'zod';
import {
	BOOKING_URL,
	CONTACT_MAILTO,
	createRateLimiter,
	emailField,
	postWebhook
} from '~/lib/server/contact';
import { readEnv } from '~/lib/server/env';

const bookingSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: emailField,
	date: z.string().trim().min(1).max(20),
	time: z.string().trim().min(1).max(10),
	note: z.string().trim().max(2000).optional().default('')
});

const limited = createRateLimiter();

// POST {name, email, date, time, note?}. A booking request is forwarded to the
// n8n webhook (N8N_SCHEDULE_WEBHOOK), which creates the calendar event.
// 200 {ok:true} only on a 2xx webhook answer. No webhook configured: 503 with
// the Calendly and email fallbacks (nothing is logged or kept). Webhook error
// or non-2xx: 502.
export const onPost: RequestHandler = async ({ request, clientConn, json, env }) => {
	const ip = clientConn.ip ?? '';
	if (limited(ip)) throw json(429, { ok: false, error: 'rate_limited' });

	const body = await request.json().catch(() => null);
	const parsed = bookingSchema.safeParse(body);
	if (!parsed.success) throw json(400, { ok: false, error: 'invalid' });

	const hook = readEnv({ env }, 'N8N_SCHEDULE_WEBHOOK');
	if (!hook) {
		throw json(503, {
			ok: false,
			error: 'not_configured',
			message: 'call booking is not connected on this host. please book on calendly or email instead.',
			fallback: { calendly: BOOKING_URL, email: CONTACT_MAILTO }
		});
	}

	const sent = await postWebhook('schedule', hook, { ...parsed.data, source_ip: ip });
	if (!sent) {
		throw json(502, {
			ok: false,
			error: 'send_failed',
			fallback: { calendly: BOOKING_URL, email: CONTACT_MAILTO }
		});
	}
	throw json(200, { ok: true });
};
