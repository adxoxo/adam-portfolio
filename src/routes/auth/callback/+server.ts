import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Magic-link lands here with a code; exchange it for a session cookie, then
// send the owner into the admin.
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	if (code && locals.supabase) {
		await locals.supabase.auth.exchangeCodeForSession(code);
	}
	redirect(303, '/admin');
};
