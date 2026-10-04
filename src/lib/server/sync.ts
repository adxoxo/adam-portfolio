// Pull the GitHub user's public repos once and cache them in Supabase as
// hidden drafts. The public site reads Supabase, never GitHub, so visitors
// trigger no GitHub calls. Shared by POST /api/sync-repos and the admin
// "sync from github" action (the admin calls this directly; no self-fetch).
// Both paths require the explicit owner before any GitHub or database call.
import type { RequestEventBase } from '@qwik.dev/router';
import { fetchRepos, normalizeRepo, type RepoDraft } from './github';
import { readEnv } from './env';
import { getVerifiedOwner } from './owner';
import { checkRateLimit } from './security';
import { createAdminSupabase } from './supabase';

export type SyncResult =
	| { ok: true; mode: 'dry-run'; count: number; drafts: RepoDraft[] }
	| { ok: true; mode: 'supabase'; added: number; total: number }
	| { ok: false; status: 401 | 429 | 502 | 503; error: string };

type SyncEvent = Pick<
	RequestEventBase,
	'env' | 'cookie' | 'headers' | 'platform' | 'url' | 'sharedMap'
>;

export async function runRepoSync(event: SyncEvent): Promise<SyncResult> {
	const user = readEnv(event, 'PUBLIC_GITHUB_USER') || 'adxoxo';
	const owner = await getVerifiedOwner(event);
	if (!owner) return { ok: false, status: 401, error: 'unauthorized' };
	const rate = await checkRateLimit(event, 'ADMIN_WRITE_RATE_LIMITER', owner.id);
	if (rate === 'limited') return { ok: false, status: 429, error: 'rate_limited' };
	if (rate === 'unavailable') return { ok: false, status: 503, error: 'rate_limit_unavailable' };
	const admin = createAdminSupabase(event);

	let drafts: RepoDraft[];
	try {
		const repos = (await fetchRepos(user, readEnv(event, 'GITHUB_TOKEN') || undefined)).filter(
			(r) => !r.fork
		);
		const now = new Date().toISOString();
		drafts = repos.map((r) => normalizeRepo(r, now));
	} catch (e) {
		return { ok: false, status: 502, error: e instanceof Error ? e.message : 'github fetch failed' };
	}

	// Seed-only mode: no store, so return what a sync would insert (dry run).
	if (!admin) return { ok: true, mode: 'dry-run', count: drafts.length, drafts };

	// Never clobber curated rows: insert only ids we do not already have.
	const { data: existing, error: readErr } = await admin.from('projects').select('id, source');
	if (readErr) return { ok: false, status: 502, error: readErr.message };
	const have = new Set((existing ?? []).map((r) => r.id as string));
	const githubIds = new Set((existing ?? []).filter((r) => r.source === 'github').map((r) => r.id as string));
	const fresh = drafts.filter((d) => !have.has(d.id));
	if (fresh.length) {
		const { error } = await admin.from('projects').insert(fresh);
		if (error) return { ok: false, status: 502, error: error.message };
	}

	// Refresh derived fields on rows that came from a previous github sync.
	for (const d of drafts) {
		if (githubIds.has(d.id)) {
			const { error } = await admin
				.from('projects')
				.update({ year: d.year, synced_at: d.synced_at })
				.eq('id', d.id)
				.eq('source', 'github');
			if (error) return { ok: false, status: 502, error: error.message };
		}
	}

	return { ok: true, mode: 'supabase', added: fresh.length, total: drafts.length };
}
