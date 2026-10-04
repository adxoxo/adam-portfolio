import type { RequestEventBase } from '@qwik.dev/router';
import {
	CLUSTERS,
	PROJECTS,
	type Cluster,
	type Feature,
	type Project,
	type SystemDetail
} from '../data/projects';
import { createPublicSupabase } from './supabase';

// A CMS query that hangs must not hold the page; fall back to the snapshot.
const QUERY_TIMEOUT_MS = 3000;

const text = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const textList = (v: unknown) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : []);

function featureList(v: unknown): Feature[] {
	if (!Array.isArray(v)) return [];
	return v
		.filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
		.map((f) => ({ label: text(f.label), detail: text(f.detail) }))
		.filter((f) => f.label || f.detail);
}

// Public system_detail fields only. The CMS also stores a `diagram` image path
// that 404s on the site, so it is never passed on.
function systemDetail(v: unknown): SystemDetail | undefined {
	if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
	const sd = v as Record<string, unknown>;
	const out: SystemDetail = {};
	if (text(sd.summary)) out.summary = text(sd.summary);
	if (text(sd.deliveryStatus)) out.deliveryStatus = text(sd.deliveryStatus);
	const legend = featureList(sd.legend);
	if (legend.length) out.legend = legend;
	return Object.keys(out).length ? out : undefined;
}

/** Map a Supabase `projects` row to the shape the components consume. */
export function rowToProject(row: Record<string, unknown>): Project {
	const cluster = CLUSTERS.includes(row.cluster as Cluster) ? (row.cluster as Cluster) : 'fullstack';
	const p: Project = {
		id: text(row.id),
		title: text(row.title),
		cluster,
		status: row.status === 'featured' ? 'featured' : 'archive',
		year: text(row.year),
		summary: text(row.summary),
		outcomes: textList(row.outcome),
		stack: textList(row.stack),
		schematic: textList(row.schematic),
		github: text(row.github_url),
		live: text(row.live_url),
		loom: text(row.loom_id),
		x: Number.isFinite(Number(row.map_x ?? 50)) ? Number(row.map_x ?? 50) : 50,
		y: Number.isFinite(Number(row.map_y ?? 50)) ? Number(row.map_y ?? 50) : 50
	};
	if (text(row.loom_thumb)) p.loomThumb = text(row.loom_thumb);
	if (text(row.cover_image)) p.cover = text(row.cover_image);
	if (text(row.why)) p.why = text(row.why);
	if (Array.isArray(row.features)) p.features = featureList(row.features);
	const sd = systemDetail(row.system_detail);
	if (sd) p.systemDetail = sd;
	return p;
}

/**
 * Public project list for the home page, in CMS sort order. Reads only
 * non-hidden rows with the anonymous key (RLS also hides drafts), and never
 * touches request cookies, so no auth state reaches public pages. Falls back
 * to the 21-row public snapshot when Supabase is unset, errors, times out, or
 * returns no rows.
 */
export async function loadPublicProjects(
	event: Pick<RequestEventBase, 'env'>
): Promise<{ projects: Project[]; source: 'seed' | 'supabase' }> {
	const fallback = { projects: PROJECTS.slice(), source: 'seed' as const };
	const supabase = createPublicSupabase(event);
	if (!supabase) return fallback;
	try {
		const { data, error } = await supabase
			.from('projects')
			.select('*')
			.neq('status', 'hidden')
			.order('sort_order', { ascending: true })
			.abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
		if (error || !data || data.length === 0) return fallback;
		const rows = (data as Record<string, unknown>[]).filter((r) => r.status !== 'hidden');
		if (rows.length === 0) return fallback;
		return { projects: rows.map(rowToProject), source: 'supabase' };
	} catch {
		return fallback;
	}
}
