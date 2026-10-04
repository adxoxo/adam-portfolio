// Owner admin helpers: the partial-save patch builder and the Loom thumbnail
// lookup. Field names, defaults and parsing match the SvelteKit admin exactly.

/** Submitted admin form fields (Qwik parses the form into a plain object). */
export type AdminForm = Record<string, unknown>;

const has = (f: AdminForm, k: string) => Object.prototype.hasOwnProperty.call(f, k);
const raw = (f: AdminForm, k: string) => (f[k] == null ? '' : String(f[k]));

/** "label :: detail" lines -> [{label, detail}] (blank lines dropped). */
export function parseFeatureLines(value: string) {
	return value
		.split('\n')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((line) => {
			const i = line.indexOf('::');
			return i === -1
				? { label: line, detail: '' }
				: { label: line.slice(0, i).trim(), detail: line.slice(i + 2).trim() };
		});
}

/**
 * Build the update patch for one project. Only fields the form actually
 * submitted are written, so a partial or malformed form can never blank a
 * column it did not include. (A field present but empty = an intentional
 * clear; a field absent entirely = left untouched.)
 *
 * `existing` is the current row (select *). It decides whether optional
 * columns exist on this database: `system_detail` is only written when the
 * row has that column, and it is merged so the stored diagram metadata and
 * other keys survive.
 */
export function buildProjectPatch(f: AdminForm, existing: Record<string, unknown>) {
	const patch: Record<string, unknown> = {};
	const str = (k: string) => {
		if (has(f, k)) patch[k] = raw(f, k).trim();
	};
	const num = (k: string, d: number) => {
		if (!has(f, k)) return;
		const n = Number(f[k]);
		patch[k] = Number.isFinite(n) ? n : d;
	};
	const list = (k: string, sep: string) => {
		if (!has(f, k)) return;
		patch[k] = raw(f, k)
			.split(sep)
			.map((s) => s.trim())
			.filter(Boolean);
	};

	str('title');
	str('summary');
	str('why');
	str('cluster');
	str('status');
	str('year');
	str('source');
	str('github_url');
	str('live_url');
	str('loom_id');
	// cover_image column may not exist on an un-migrated DB; only write it when
	// set, so a missing column can never break an ordinary save (run the alter
	// in supabase-schema.sql to enable it).
	if (has(f, 'cover_image')) {
		const v = raw(f, 'cover_image').trim();
		if (v) patch.cover_image = v;
	}
	num('sort_order', 100);
	num('map_x', 50);
	num('map_y', 50);
	list('outcome', '\n');
	list('schematic', ',');
	list('stack', ',');
	if (has(f, 'features')) patch.features = parseFeatureLines(raw(f, 'features'));

	const sdKeys = ['sd_summary', 'sd_delivery_status', 'sd_legend'];
	if (has(existing, 'system_detail') && sdKeys.some((k) => has(f, k))) {
		const cur = existing.system_detail;
		const sd: Record<string, unknown> =
			cur && typeof cur === 'object' && !Array.isArray(cur) ? { ...(cur as object) } : {};
		const setOrDrop = (key: string, value: unknown, keep: boolean) => {
			if (keep) sd[key] = value;
			else delete sd[key];
		};
		if (has(f, 'sd_summary')) {
			const v = raw(f, 'sd_summary').trim();
			setOrDrop('summary', v, !!v);
		}
		if (has(f, 'sd_delivery_status')) {
			const v = raw(f, 'sd_delivery_status').trim();
			setOrDrop('deliveryStatus', v, !!v);
		}
		if (has(f, 'sd_legend')) {
			const legend = parseFeatureLines(raw(f, 'sd_legend'));
			setOrDrop('legend', legend, legend.length > 0);
		}
		patch.system_detail = Object.keys(sd).length ? sd : null;
	}

	return patch;
}

/** Fetch loom's oEmbed thumbnail_url (an animated gif) for a share id, so the
 *  card can show a preview without the browser ever calling loom. Best-effort:
 *  returns null on any failure. */
export async function loomThumb(loomId: string): Promise<string | null> {
	try {
		const res = await fetch(
			`https://www.loom.com/v1/oembed?url=https://www.loom.com/share/${encodeURIComponent(loomId)}`,
			{ signal: AbortSignal.timeout(5000) }
		);
		if (!res.ok) return null;
		const j = (await res.json()) as { thumbnail_url?: string };
		return j.thumbnail_url ?? null;
	} catch {
		return null;
	}
}
