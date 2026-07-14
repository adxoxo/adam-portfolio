import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as pub } from '$env/dynamic/public';
import { env as priv } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

/** True when the public Supabase env is set. When false the app runs in
 *  seed-only mode: the site renders from static data, leads log to the console,
 *  and /api/sync-repos returns a dry run. */
export function supabaseConfigured(): boolean {
	return !!(pub.PUBLIC_SUPABASE_URL && pub.PUBLIC_SUPABASE_ANON_KEY);
}

/** Request-scoped client that reads/writes the auth session via cookies. */
export function createServerSupabase(cookies: Cookies): SupabaseClient | null {
	if (!supabaseConfigured()) return null;
	return createServerClient(pub.PUBLIC_SUPABASE_URL!, pub.PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (list) =>
				list.forEach(({ name, value, options }) =>
					cookies.set(name, value, { ...options, path: '/' })
				)
		}
	});
}

/** Service-role client for privileged writes (archive sync). Server only,
 *  bypasses RLS. Returns null unless the service key is configured. */
export function createAdminSupabase(): SupabaseClient | null {
	if (!pub.PUBLIC_SUPABASE_URL || !priv.SUPABASE_SERVICE_ROLE_KEY) return null;
	return createClient(pub.PUBLIC_SUPABASE_URL, priv.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}
