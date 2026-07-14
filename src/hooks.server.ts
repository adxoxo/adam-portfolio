import type { Handle } from '@sveltejs/kit';
import { createServerSupabase } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = createServerSupabase(event.cookies);
	event.locals.supabase = supabase;

	// getUser() re-validates the JWT against Supabase (getSession alone is not
	// trustworthy on the server). Returns nulls in seed-only mode.
	event.locals.safeGetSession = async () => {
		if (!supabase) return { session: null, user: null };
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return { session: null, user: null };
		const {
			data: { session }
		} = await supabase.auth.getSession();
		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
