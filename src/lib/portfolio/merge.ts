// Overlay the media and links managed in the Supabase `projects` table onto
// the approved content. Titles, copy, service and order always come from
// data.ts; a database row may only contribute a loom id, a cover image, a
// live url and a repository url. Rows with no approved counterpart are
// ignored, and an approved project with no row keeps its static media and
// links. Values that are not a safe http(s) url or a plain loom id are
// dropped, so a bad row can never inject a link the page would render.
import { PROJECTS, canonicalId, type Media, type Project } from './data';

// The subset of a `projects` row this overlay reads. Columns that do not
// exist on an older database (cover_image) simply arrive as undefined.
export interface ProjectMediaRow {
	id: string;
	github_url?: string | null;
	live_url?: string | null;
	loom_id?: string | null;
	cover_image?: string | null;
}

// only http(s) links are rendered; anything else (javascript:, data:, a bare word) is ignored
export function safeUrl(value: string | null | undefined): string {
	const v = (value ?? '').trim();
	if (!v || v.length > 2000) return '';
	try {
		const u = new URL(v);
		return u.protocol === 'https:' || u.protocol === 'http:' ? v : '';
	} catch {
		return '';
	}
}
// a loom share id is a plain hex-like token; it is interpolated into the embed url
const LOOM_ID = /^[a-zA-Z0-9_-]{6,64}$/;

function mediaFor(p: Project, row: ProjectMediaRow): Media | undefined {
	const loom = (row.loom_id ?? '').trim();
	if (loom && LOOM_ID.test(loom)) {
		return {
			kind: 'embed',
			provider: 'loom',
			id: loom,
			title: `${p.title} walkthrough on loom`,
			caption: `recorded walkthrough of ${p.title}, loads from loom only when you ask for it`
		};
	}
	const cover = safeUrl(row.cover_image);
	if (cover) return { kind: 'image', src: cover, alt: `${p.title}, screenshot` };
	return p.media;
}

export function withProjectMedia(rows: ProjectMediaRow[], base: Project[] = PROJECTS): Project[] {
	const byId = new Map<string, ProjectMediaRow>();
	for (const row of rows) {
		const id = canonicalId(String(row.id ?? ''));
		// first row wins when an old and a new id both point at one project
		if (id && !byId.has(id)) byId.set(id, row);
	}
	return base.map((p) => {
		const row = byId.get(p.id);
		if (!row) return p;
		// the admin manages these links: a non-empty row value wins, an empty one
		// falls back to the approved content (a client build stays "no public repository")
		const github = safeUrl(row.github_url) || p.github;
		const live = safeUrl(row.live_url) || p.live;
		const out: Project = { ...p, github, media: mediaFor(p, row) };
		if (live) out.live = live;
		return out;
	});
}
