import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { CookieOptions as QwikCookieOptions, RequestEventBase } from '@qwik.dev/router';
import { readEnv, supabaseConfigured } from './env';

const CLIENT_KEY = '@adam/supabase-server-client';
const USER_KEY = '@adam/supabase-user';

type ServerEvent = Pick<RequestEventBase, 'env' | 'cookie' | 'headers' | 'url' | 'sharedMap'>;

function toQwikCookieOptions(event: ServerEvent, o: CookieOptions): QwikCookieOptions {
	return {
		domain: o.domain,
		expires: o.expires,
		httpOnly: o.httpOnly,
		maxAge: o.maxAge,
		path: '/',
		sameSite: o.sameSite,
		// SvelteKit defaulted `secure` to true except on plain-http localhost; keep
		// the same cookie attributes so existing owner sessions stay valid.
		secure: o.secure ?? event.url.protocol === 'https:'
	};
}

/** Request-scoped client that reads/writes the auth session via the request
 *  cookies (same sb-* cookie names and format as the SvelteKit app). One client
 *  per request, cached on the request's sharedMap; never module state. */
export function createServerSupabase(event: ServerEvent): SupabaseClient | null {
	if (!supabaseConfigured(event)) return null;
	const cached = event.sharedMap.get(CLIENT_KEY) as SupabaseClient | undefined;
	if (cached) return cached;
	const client = createServerClient(
		readEnv(event, 'PUBLIC_SUPABASE_URL'),
		readEnv(event, 'PUBLIC_SUPABASE_ANON_KEY'),
		{
			cookies: {
				getAll: () =>
					Object.entries(event.cookie.getAll())
						.filter(([, c]) => c !== null)
						.map(([name, c]) => ({ name, value: c!.value })),
				setAll: (list, headers) => {
					for (const { name, value, options } of list) {
						event.cookie.set(name, value, toQwikCookieOptions(event, options));
					}
					// Responses that carry auth cookies must never be cached.
					for (const [k, v] of Object.entries(headers ?? {})) event.headers.set(k, v);
				}
			}
		}
	);
	event.sharedMap.set(CLIENT_KEY, client);
	return client;
}

/** The signed-in user, re-validated against Supabase with getUser() (the
 *  cookie session alone is not trustworthy on the server). Null in seed-only
 *  mode, for anonymous visitors, and for forged or expired cookies. Cached per
 *  request. */
export async function getVerifiedUser(event: ServerEvent): Promise<User | null> {
	if (event.sharedMap.has(USER_KEY)) return event.sharedMap.get(USER_KEY) as User | null;
	const supabase = createServerSupabase(event);
	let user: User | null = null;
	if (supabase) {
		try {
			const { data } = await supabase.auth.getUser();
			user = data.user ?? null;
		} catch {
			user = null;
		}
	}
	event.sharedMap.set(USER_KEY, user);
	return user;
}

/** Forget the cached user (after sign-in/out within the same request). */
export function forgetVerifiedUser(event: Pick<RequestEventBase, 'sharedMap'>) {
	event.sharedMap.delete(USER_KEY);
}

/** Anonymous client with no cookie or session handling, for public reads. */
export function createPublicSupabase(event: Pick<RequestEventBase, 'env'>): SupabaseClient | null {
	if (!supabaseConfigured(event)) return null;
	return createClient(readEnv(event, 'PUBLIC_SUPABASE_URL'), readEnv(event, 'PUBLIC_SUPABASE_ANON_KEY'), {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
	});
}

/** Service-role client for privileged writes (archive sync). Server only,
 *  bypasses RLS. Returns null unless the service key is configured. */
export function createAdminSupabase(event: Pick<RequestEventBase, 'env'>): SupabaseClient | null {
	const url = readEnv(event, 'PUBLIC_SUPABASE_URL');
	const key = readEnv(event, 'SUPABASE_SERVICE_ROLE_KEY');
	if (!url || !key) return null;
	return createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
	});
}
