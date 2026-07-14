import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { env as pub } from '$env/dynamic/public';
import { env as priv } from '$env/dynamic/private';
import { createAdminSupabase } from '$lib/server/supabase';
import { fetchRepos, normalizeRepo } from '$lib/server/github';

// Pull adxoxo's public repos once, cache them in Supabase as hidden drafts.
// The public site reads Supabase, never GitHub, so visitors trigger no fetches.
export const POST: RequestHandler = async ({ locals }) => {
	const user = pub.PUBLIC_GITHUB_USER || 'adxoxo';
	const admin = createAdminSupabase();

	// When a store is configured, only the signed-in owner may sync.
	if (admin) {
		const { user: authed } = await locals.safeGetSession();
		if (!authed) throw error(401, 'unauthorized');
	}

	const repos = (await fetchRepos(user, priv.GITHUB_TOKEN)).filter((r) => !r.fork);
	const now = new Date().toISOString();
	const drafts = repos.map((r) => normalizeRepo(r, now));

	// Seed-only mode: no store, so return what a sync would insert (dry run).
	if (!admin) {
		return json({ ok: true, mode: 'dry-run', count: drafts.length, drafts });
	}

	// Never clobber curated rows: insert only ids we do not already have.
	const { data: existing } = await admin.from('projects').select('id');
	const have = new Set((existing ?? []).map((r) => r.id as string));
	const fresh = drafts.filter((d) => !have.has(d.id));
	if (fresh.length) await admin.from('projects').insert(fresh);

	// Refresh derived fields on rows that came from a previous github sync.
	for (const d of drafts) {
		if (have.has(d.id)) {
			await admin
				.from('projects')
				.update({ year: d.year, synced_at: d.synced_at })
				.eq('id', d.id)
				.eq('source', 'github');
		}
	}

	return json({ ok: true, mode: 'supabase', added: fresh.length, total: drafts.length });
};
