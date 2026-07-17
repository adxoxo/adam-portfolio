import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Magic-link lands here with a `code`; exchange it for a session cookie, then
// send the owner into the admin. Any failure redirects back to /admin with a
// human-readable ?error= so a broken login is never silent (the old version
// swallowed the exchange error and looked like nothing happened).
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.supabase) {
		redirect(303, '/admin?error=' + encodeURIComponent('supabase not configured on this host'));
	}

	const code = url.searchParams.get('code');
	if (!code) {
		const msg =
			url.searchParams.get('error_description') ??
			url.searchParams.get('error') ??
			'no auth code in the callback url (check the supabase redirect url allowlist)';
		redirect(303, '/admin?error=' + encodeURIComponent(msg));
	}

	let failure: string | null = null;
	try {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (error) failure = error.message;
	} catch (e) {
		// a thrown fault (e.g. network) should surface too, not 500 silently
		failure = e instanceof Error ? e.message : 'auth exchange failed';
	}
	if (failure) redirect(303, '/admin?error=' + encodeURIComponent(failure));

	redirect(303, '/admin');
};
