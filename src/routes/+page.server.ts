import type { PageServerLoad } from './$types';
import { PROJECTS } from '$lib/portfolio/data';
import { withProjectMedia, type ProjectMediaRow } from '$lib/portfolio/merge';

// The public page renders the approved content from $lib/portfolio/data.ts.
// The Supabase `projects` table (managed in /admin) only overlays media and
// links: loom id, cover image, live url, repository url. No Supabase, or an
// empty / failed query, still renders the full approved content.
export const load: PageServerLoad = async ({ locals }) => {
	const fallback = { projects: PROJECTS, source: 'static' as const };
	if (!locals.supabase) return fallback;
	try {
		// `select('*')` on purpose: the optional cover_image column may not exist
		// on an un-migrated database, and naming it would fail the whole query.
		const { data, error } = await locals.supabase.from('projects').select('*').neq('status', 'hidden');
		if (error || !data || data.length === 0) return fallback;
		return { projects: withProjectMedia(data as ProjectMediaRow[]), source: 'supabase' as const };
	} catch {
		return fallback;
	}
};
