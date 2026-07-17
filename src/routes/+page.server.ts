import type { PageServerLoad } from './$types';
import { PROJECTS, type Project, type Feature } from '$lib/data/projects';

// Map a Supabase `projects` row to the shape the components consume.
function rowToProject(row: Record<string, unknown>): Project {
	return {
		id: String(row.id),
		title: String(row.title ?? ''),
		cluster: (row.cluster as Project['cluster']) ?? 'fullstack',
		status: (row.status as Project['status']) ?? 'archive',
		year: String(row.year ?? ''),
		summary: String(row.summary ?? ''),
		outcomes: (row.outcome as string[]) ?? [],
		stack: (row.stack as string[]) ?? [],
		schematic: (row.schematic as string[]) ?? [],
		github: String(row.github_url ?? ''),
		live: row.live_url ? String(row.live_url) : '',
		loom: row.loom_id ? String(row.loom_id) : '',
		cover: row.cover_image ? String(row.cover_image) : undefined,
		why: row.why ? String(row.why) : undefined,
		features: Array.isArray(row.features) ? (row.features as Feature[]) : undefined,
		x: Number(row.map_x ?? 50),
		y: Number(row.map_y ?? 50)
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	// Seed-only fallback: no Supabase, or an empty/failed query, still renders.
	const fallback = { projects: PROJECTS, source: 'seed' as const };
	if (!locals.supabase) return fallback;
	try {
		const { data, error } = await locals.supabase
			.from('projects')
			.select('*')
			.neq('status', 'hidden')
			.order('sort_order', { ascending: true });
		if (error || !data || data.length === 0) return fallback;
		return { projects: data.map(rowToProject), source: 'supabase' as const };
	} catch {
		return fallback;
	}
};
