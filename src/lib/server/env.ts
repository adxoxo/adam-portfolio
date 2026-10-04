// Runtime config, read per request from the Worker env through the Qwik
// RequestEvent (wrangler.jsonc vars + dashboard secrets). Never use
// import.meta.env here: Vite inlines PUBLIC_* values into bundles, and nothing
// from this module may reach the client.
import type { RequestEventBase } from '@qwik.dev/router';

type EnvKey =
	| 'PUBLIC_SUPABASE_URL'
	| 'PUBLIC_SUPABASE_ANON_KEY'
	| 'PUBLIC_GITHUB_USER'
	| 'SUPABASE_SERVICE_ROLE_KEY'
	| 'GITHUB_TOKEN'
	| 'N8N_LEAD_WEBHOOK'
	| 'N8N_SCHEDULE_WEBHOOK';

/** Trimmed env value, or '' when unset. */
export function readEnv(event: Pick<RequestEventBase, 'env'>, key: EnvKey): string {
	return (event.env.get(key) ?? '').trim();
}

/** True when the public Supabase env is set. When false the app runs in
 *  seed-only mode: the site renders from static data, the admin explains the
 *  missing config, and /api/sync-repos returns a dry run. */
export function supabaseConfigured(event: Pick<RequestEventBase, 'env'>): boolean {
	return !!(readEnv(event, 'PUBLIC_SUPABASE_URL') && readEnv(event, 'PUBLIC_SUPABASE_ANON_KEY'));
}
