import type { RequestHandler } from '@qwik.dev/router';
import { getOwnerEmail, getVerifiedOwner } from '~/lib/server/owner';
import { createServerSupabase, forgetVerifiedUser } from '~/lib/server/supabase';

const toAdmin = (msg?: string) => (msg ? '/admin?error=' + encodeURIComponent(msg) : '/admin');

// Magic-link lands here with a `code`; exchange it for a session cookie, then
// send the owner into the admin. Any failure redirects back to /admin with a
// human-readable ?error= so a broken login is never silent.
export const onGet: RequestHandler = async (event) => {
	event.headers.set('Cache-Control', 'no-store');
	const supabase = createServerSupabase(event);
	if (!supabase) throw event.redirect(303, toAdmin('supabase not configured on this host'));

	const code = event.url.searchParams.get('code');
	if (!code) {
		const msg =
			event.url.searchParams.get('error_description') ??
			event.url.searchParams.get('error') ??
			'no auth code in the callback url (check the supabase redirect url allowlist)';
		throw event.redirect(303, toAdmin(msg));
	}

	let failure: string | null = null;
	try {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) failure = error.message;
	} catch (e) {
		// a thrown fault (e.g. network) should surface too, not 500 silently
		failure = e instanceof Error ? e.message : 'auth exchange failed';
	}
	if (!failure) {
		if (!getOwnerEmail(event)) {
			failure = 'owner login is not configured';
		} else if (!(await getVerifiedOwner(event))) {
			failure = 'unauthorized';
		}
		if (failure) {
			await supabase.auth.signOut().catch(() => undefined);
			forgetVerifiedUser(event);
		}
	}
	// The session cookies set by the exchange ride on this redirect response.
	throw event.redirect(303, toAdmin(failure ?? undefined));
};
