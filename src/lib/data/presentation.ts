// Presentation policy for the public site: which projects lead, how each one is
// labelled, and the few public facts that the source repositories correct. The
// CMS (or the seed fallback) stays the source of every project; this module only
// orders, labels and attaches the local demo video by exact project id.
//
// Corrections are phrase replacements, not field overrides: when a CMS row no
// longer contains the stale phrase (because Adam edited it), the CMS text wins.

import type { Feature, Project } from './projects';
import { DEMOS, type Demo, type DemoKind } from './demos';

/** The selected work, in display order. Vault leads. */
export const HIGHLIGHT_ORDER = [
	'vault',
	'grimoire',
	'tq_chatbot',
	'goatedtracking',
	'whatsapp_offer',
	'booking_invoice'
] as const;

/** Never shown as selected work, on the CMS path or the seed path. These stay in
 *  the full collection and on the map. */
export const NEVER_HIGHLIGHT = new Set(['standup']);

/** Client work done through an agency. The agency and the client are never named. */
const AGENCY = new Set([
	'quiz_funnel',
	'video_landing',
	'video_product',
	'experience_engine',
	'dm_triage',
	'whatsapp_offer',
	'booking_invoice'
]);
const CLIENT = new Set(['carwash']);
const PAST = new Set(['grimoire']);

export const KIND_LABEL: Record<DemoKind, string> = {
	'app-demo': 'app demo',
	'system-walkthrough': 'system walkthrough',
	'design-concept': 'design concept'
};

interface Fix {
	field: 'summary' | 'why';
	from: string;
	to: string;
}
interface FeatureFix {
	label: string;
	to: Feature;
}
interface Correction {
	year?: { from: string; to: string };
	/** replaces one item in stack and schematic lists */
	item?: { from: string; to: string };
	text?: Fix[];
	features?: FeatureFix[];
	/** feature labels the source code does not support */
	dropFeatures?: string[];
	note?: string;
}

// Source-backed corrections (discovery report, 2026-10-04).
const CORRECTIONS: Record<string, Correction> = {
	tq_chatbot: {
		item: { from: 'booked call', to: 'call link' },
		text: [
			{ field: 'summary', from: 'pushes the hot ones straight to a booked call.', to: 'offers high-intent visitors a call link.' },
			{ field: 'why', from: 'whether it books a high-intent visitor faster than a contact form would.', to: 'whether it helps a high-intent visitor reach a call link faster than a contact form would.' }
		],
		features: [
			{ label: 'knows when to stop selling', to: { label: 'knows when to stop selling', detail: 'a state machine walks greeting to qualifying to closing. once a lead is hot it stops asking and offers the calendly card. the visitor completes the booking through calendly.' } },
			{ label: 'three lead paths', to: { label: 'three lead paths', detail: 'hot leads get a call link and notify the team, warm leads get their email captured for follow-up, and cold leads get a polite exit and are stored quietly. no lead is spammed or lost.' } }
		]
	},
	grimoire: {
		text: [
			{
				field: 'summary',
				from: 'everything runs offline on my own machine.',
				to: 'everything ran offline on my own machine.'
			},
			{ field: 'why', from: 'it also runs my day', to: 'it also ran my day' }
		],
		features: [
			{
				label: 'graph-tree, one to two hop retrieval',
				to: {
					label: 'graph-narrowed retrieval',
					detail:
						'a query starts at the project node, takes one hop through the graph and one hop into related notes, so it pulls only nearby context, never the whole base.'
				}
			}
		],
		note: 'grimoire was retired in september 2026 and is shown here as finished work.'
	},
	vault: {
		text: [
			{
				field: 'summary',
				from: 'converts usd at the official bsp rate captured at log time.',
				to: 'converts usd at the bsp rate captured at log time, with a hand-typed manual rate as the fallback.'
			},
			// MR-001: the shown flow is category, amount, confirm; typing an amount alone takes several taps
			{
				field: 'why',
				from: 'the whole app is built around three taps or fewer, or by voice.',
				to: 'the whole app is built around one short path, category, amount, confirm, or by voice.'
			}
		],
		features: [
			{
				label: 'three taps or fewer',
				to: {
					label: 'category, amount, confirm',
					detail:
						'the app opens on the quick-log screen with a glanceable total balance, so recording money is the first thing you do, not something buried in menus.'
				}
			},
			{
				label: 'multi-currency at the bsp rate',
				to: {
					label: 'multi-currency at the bsp rate',
					detail:
						'usd income converts to php at the bsp rate for the day it landed, or at a manual rate you type in, stored per transaction so history is never retroactively recomputed.'
				}
			}
		]
	},
	smartpot: {
		text: [
			{
				field: 'summary',
				from: "then reports the plant's health to a web and mobile view.",
				to: "then reports the plant's health through a django rest api."
			}
		]
	},
	// last commit 2024-11-18; the code has no threshold or alert logic (only the readme claims it)
	grece: { year: { from: '2026', to: '2024' }, dropFeatures: ['thresholds that alert'] },
	// this site moved from sveltekit to qwik in october 2026
	portfolio: {
		item: { from: 'sveltekit', to: 'qwik' },
		text: [{ field: 'summary', from: 'a dark node graph of every project', to: 'a dark circuit board of every project' }]
	}
};

export interface ViewProject extends Project {
	demo: Demo | null;
	/** Short honest labels, for example "past project", "agency project". */
	labels: string[];
	/** One plain sentence that qualifies the demo or the project state. */
	note: string;
	/** True when the project is in the selected work. */
	selected: boolean;
}

function correct(p: Project): Project {
	const c = CORRECTIONS[p.id];
	if (!c) return p;
	const out: Project = { ...p };
	if (c.year && out.year === c.year.from) out.year = c.year.to;
	if (c.item) {
		const swap = (list: string[]) => list.map((x) => (x === c.item!.from ? c.item!.to : x));
		out.stack = swap(out.stack);
		out.schematic = swap(out.schematic);
	}
	for (const f of c.text ?? []) {
		const v = out[f.field];
		if (typeof v === 'string' && v.includes(f.from)) out[f.field] = v.replace(f.from, f.to);
	}
	if (c.dropFeatures?.length && out.features?.length) {
		out.features = out.features.filter((f) => !c.dropFeatures!.includes(f.label));
	}
	if (c.features?.length && out.features?.length) {
		out.features = out.features.map((feat) => c.features!.find((x) => x.label === feat.label)?.to ?? feat);
	}
	return out;
}

function labelsFor(p: Project, demo: Demo | null): string[] {
	const labels: string[] = [];
	if (PAST.has(p.id)) labels.push('past project');
	if (AGENCY.has(p.id)) labels.push('agency project');
	else if (CLIENT.has(p.id)) labels.push('client project');
	const status = p.systemDetail?.deliveryStatus ?? '';
	if (demo?.kind === 'design-concept' || /build not started/.test(status)) labels.push('design concept');
	return labels;
}

const sentence = (t: string) => {
	const v = t.trim();
	return v && !/[.!?]$/.test(v) ? `${v}.` : v;
};

/** The catalog caption says what the video is; a correction note adds source facts. */
function noteFor(p: Project, demo: Demo | null): string {
	return [demo?.caption ?? '', CORRECTIONS[p.id]?.note ?? ''].map(sentence).filter(Boolean).join(' ');
}

/** Orders, labels and attaches demos. Never drops a project. */
export function present(projects: Project[]) {
	const highlightIds = new Set<string>(HIGHLIGHT_ORDER.filter((id) => !NEVER_HIGHLIGHT.has(id)));
	const all: ViewProject[] = projects.map((raw) => {
		const p = correct(raw);
		const demo = DEMOS[p.id] ?? null;
		return {
			...p,
			demo,
			labels: labelsFor(p, demo),
			note: noteFor(p, demo),
			selected: highlightIds.has(p.id)
		};
	});
	const byId = new Map(all.map((p) => [p.id, p]));
	const highlights = HIGHLIGHT_ORDER.map((id) => byId.get(id)).filter(
		(p): p is ViewProject => !!p && !NEVER_HIGHLIGHT.has(p.id)
	);
	return { all, highlights };
}
