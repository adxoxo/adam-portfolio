// Presentation policy for the public site: which projects lead, how each one is
// labelled, the few row facts that the source repositories correct, and the short
// public copy of the 21 known projects. The CMS (or the seed fallback) stays the
// source of every project row; this module orders, labels, attaches the local video
// video and swaps in the public copy by exact project id.
//
// The public copy applies field by field, and only while a field still holds its
// legacy value from the bundled PROJECTS snapshot: the summary and outcomes become
// the short copy, and the long why, feature, system summary and component legend
// text is dropped, as is the unverified status chip of six agency rows. A field that
// the owner has since edited in the CMS shows as edited. Title, year, stack, system
// path, links and media still come from the row.
// The raw CMS rows and the raw snapshot are never changed, so the owner editor keeps
// the full text. An id outside PUBLIC_COPY renders its row text unchanged.

import { PROJECTS, type Feature, type Project } from './projects';
import { DEMOS, type Demo, type DemoKind } from './demos';
import { LEADFLOW_COVERS, LEADFLOW_LABEL, LEADFLOW_MATCHES, LEADFLOW_PROJECTS } from './leadflow';

/** The selected work, in display order. Business CRM and dashboard work leads. */
export const HIGHLIGHT_ORDER = [
	'leadflow_cockpit',
	'leadflow_visenza_dashboard',
	'vault',
	'grimoire',
	'tq_chatbot',
	'goatedtracking',
	'whatsapp_offer',
	'booking_invoice'
] as const;

/** Removed from every public view (map, dialogs, previews, case routes) by exact id. Chosen by Adam,
 *  2026-10-11. The CMS rows, source records and media stay as they are. */
export const PUBLIC_EXCLUDED: ReadonlySet<string> = new Set([
	'video_product',
	'experience_engine',
	'dm_triage',
	'leadflow_proposal_extension',
	'leadflow_proposals_site'
]);

/** Never shown as selected work, on the CMS path or the seed path. These stay in
 *  the full collection and on the map. */
export const NEVER_HIGHLIGHT = new Set(['standup']);

/** Project videos with spoken narration (local voiceover build of 2026-10-05). Their player
 *  has no caption track and no cc button; the case-study transcript stays. The legacy
 *  2026-10-04 media integration tool copies the un-narrated MP4s back: do not rerun it. */
export const NARRATED_DEMOS: ReadonlySet<string> = new Set([
	'vault',
	'grimoire',
	'tq_chatbot',
	'goatedtracking',
	'whatsapp_offer',
	'booking_invoice',
	'leadflow_visenza_dashboard'
]);

/** Client work done through an agency. The agency and the client stay unnamed, except for the
 *  pieces with a source mapping, which carry the Lead Flow Consulting label and their client name. */
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
const PAST = new Set<string>();

/** Agency delivery statuses with no saved evidence (2026-10-07 numerical audit). The
 *  legacy status chip is omitted; a newer status that the owner sets still shows.
 *  dm_triage keeps its design status, which the video and the audit support. */
const UNVERIFIED_STATUS = new Set([
	'quiz_funnel',
	'video_landing',
	'video_product',
	'experience_engine',
	'whatsapp_offer',
	'booking_invoice'
]);

/** Pieces built with Lead Flow Consulting: the four matched ids and the ten code-owned
 *  catalog entries. The label replaces the agency label, which named the same work. */
const LEADFLOW_IDS: ReadonlySet<string> = new Set([...Object.keys(LEADFLOW_MATCHES), ...LEADFLOW_PROJECTS.map((p) => p.id)]);

export const KIND_LABEL: Record<DemoKind, string> = {
	'app-demo': 'application walkthrough',
	'system-walkthrough': 'workflow overview',
	'design-concept': 'design concept'
};

interface Correction {
	year?: { from: string; to: string };
	/** replaces one item in stack and schematic lists */
	item?: { from: string; to: string };
	note?: string;
}

// Source-backed corrections of row facts (discovery report, 2026-10-04).
const CORRECTIONS: Record<string, Correction> = {
	tq_chatbot: { item: { from: 'booked call', to: 'call link' } },
	// all three boards are nodemcuv2 (esp8266) in their platformio.ini
	smartpot: { item: { from: 'esp32', to: 'esp8266' } },
	// last commit 2024-11-18
	grece: { year: { from: '2026', to: '2024' } },
	// this site moved from sveltekit to qwik in october 2026
	portfolio: { item: { from: 'sveltekit', to: 'qwik' } }
};

interface Copy {
	/** one lowercase sentence: what the project is for */
	summary: string;
	/** at most two short value points. Future value stays a potential, never a client result. */
	impact: [string] | [string, string];
}

// Public copy (2026-10-09). Claims follow the 2026-10-07 numerical audit. The only
// metric is grimoire's own retrieval benchmark (BENCHMARKS.md, 2026-07-18).
const PUBLIC_COPY: Record<string, Copy> = {
	quiz_funnel: {
		summary: 'a bilingual quiz funnel that scores each visitor into a profile and emails back a matching report.',
		impact: ['lead capture, opt-in and report delivery run as one automated chain', 'rule-based scoring keeps each result explainable']
	},
	video_landing: {
		summary: 'a bilingual video landing page that captures campaign leads into the same crm table as the quiz funnel.',
		impact: ['leads from both funnels can be worked from one table', 'one url serves both languages']
	},
	video_product: {
		summary: 'a self-serve video product that sells access without manual steps: payment creates the account, access is emailed and the video plays behind signed links.',
		impact: ['payment to playback runs as one automated chain', 'a second product can be added as a data row, not a new build']
	},
	experience_engine: {
		summary: 'a post-purchase experience engine that turns a purchase into a guided experience: scenes are stored as data and a magic link carries access across devices.',
		impact: ['a new experience can be set up as data, without a new codebase', 'one signing method protects sessions, media and magic links']
	},
	dm_triage: {
		summary: 'a design for triaging inbound social messages so none are missed: a buildable first phase that captures and classifies intent, and a second phase held back by a platform limit.',
		impact: ['the blocking platform limit surfaced before any build started', 'the first phase can start without waiting on the blocked part']
	},
	whatsapp_offer: {
		summary: 'a whatsapp lead workflow that collects photos and job details, then routes each case to an offer document or a technician call.',
		impact: ['a person approves the photos before any offer goes out', 'qualified cases can end in a generated offer document']
	},
	booking_invoice: {
		summary: 'a bilingual booking wizard that takes a customer from a free date to a signed offer and payment, then to invoicing, crm and reminders.',
		impact: ['german and english customers use the same booking url', 'signature, payment, invoice and crm stage are linked in one documented chain']
	},
	tq_chatbot: {
		summary: 'a reusable sales chatbot for websites that lose visitors before a conversation starts: it qualifies them as they chat and offers high-intent leads a call link.',
		impact: ['hot, warm and cold leads each get a matching next step', 'a new client is one database row, not a rebuild']
	},
	grimoire: {
		summary: 'a local knowledge system that gives coding agents shared notes, memory and project context through one mcp gateway, so they do not start every task cold.',
		impact: [
			'hybrid retrieval reached 88% recall within five results, against 66% for text search, in a 50-question benchmark on a 379-node store',
			'agents could pull context for the current project instead of being briefed again'
		]
	},
	vault: {
		summary: 'a mobile-first money app for tracking spending across several wallets: log income, expenses and transfers in a few taps, and convert usd income to php at a stored rate.',
		impact: ['a log is one short path: category, amount, confirm, or a voice note', 'balances come from every entry in integer centavos, so totals do not drift']
	},
	goatedtracking: {
		summary: "a local-first record system for a small goat farm: scanning a goat's qr ear tag opens its health, vaccination, pen and lineage history, even without internet.",
		impact: ['one on-site server on the farm wifi keeps records usable without internet', 'overdue and due-soon vaccinations are listed automatically']
	},
	grece: {
		summary: 'a hydroponics monitoring prototype for growers who check the tank by hand: it collects water and environment readings and saves them with their time for review.',
		impact: ['water readings can be checked from saved data instead of by hand at the tank', 'each reading is saved with its time, so changes can be traced']
	},
	standup: {
		summary: 'a one-screen github dashboard for the start of a working day: open pull requests, assigned issues, an activity streak and repo health in one place.',
		impact: ['a failed github section is marked, and the rest of the page still loads', 'day-over-day changes come from stored snapshots, not guesses']
	},
	almanac: {
		summary: 'a single-user planner that keeps tasks, habits, goals and fasting in one place, with a timetable that rebuilds the rest of the day when the plan slips.',
		impact: ['one reflow rebuilds the rest of the day around what changed', "urgency follows each task's deadline unless flagged by hand"]
	},
	asacafe: {
		summary: 'a mobile-first cafe directory for davao city: guests browse, filter and view cafes on a map without an account.',
		impact: ['saving, commenting, adding or editing a cafe asks for a login', 'database rules enforce the same login gate as the app']
	},
	portfolio: {
		summary: 'the site you are reading: a white editorial page and a dark circuit board of every project, joined by one switch.',
		impact: ['projects load from the cms and fall back to a bundled snapshot if it fails', 'every video, caption and font is served from this site']
	},
	social: {
		summary: "a publisher for two social accounts that drafts in each account's voice and posts approved items on a schedule, so neither account sounds like the other.",
		impact: ['drafts must pass a stored voice check before they can publish', 'one pipeline serves two accounts without reusing copy between them']
	},
	moajump: {
		summary: 'a k-pop themed vertical platformer for the browser, built with phaser 3, with three worlds and one target score.',
		impact: ['plays on keyboard, touch and tilt', 'runs offline as static files, with no cdn or backend']
	},
	moisture: {
		summary: 'a hardware prototype for judging rice grain before storage: an esp32 measures the moisture of rough rice grains and a desktop app shows the readings.',
		impact: ['a chart and statistical summary show whether readings sit in the target band', 'readings are saved locally and export to csv or pdf']
	},
	smartpot: {
		summary: 'a smart pot prototype that records the temperature, humidity and soil moisture around a plant, so changes can be spotted between checks.',
		impact: ["stored readings can help someone spot changes in the plant's conditions between checks", 'averages of the stored readings can give a baseline to compare new readings against']
	},
	carwash: {
		summary: 'an n8n automation for a car detailing client that turns finished jobs into invoices and follow-up reminders, so the owner does not chase each invoice.',
		impact: ['a finished job triggers its invoice and a follow-up reminder', 'designed so the owner does not have to chase each invoice']
	}
};

export interface ViewProject extends Project {
	demo: Demo | null;
	/** Short honest labels, for example "past project", "agency project". */
	labels: string[];
	/** One plain sentence that qualifies the video or cover and the project state. */
	note: string;
	/** True when the project is in the selected work. */
	selected: boolean;
	/** Informative alt text for `cover`, set with a code-owned cover. */
	coverAlt?: string;
}

const PREVIEW_COPY: Record<string, { summary: string; category: string }> = {
	leadflow_cockpit: { summary: 'CRM, sales and business operations in one workspace.', category: 'CRM & business dashboard' },
	leadflow_visenza_dashboard: { summary: 'Contacts, lead stages and customer insights in one place.', category: 'CRM & lead pipeline' },
	whatsapp_offer: { summary: 'From a WhatsApp enquiry to a qualified lead and offer.', category: 'Sales automation' },
	vault: { summary: 'Money across wallets, in one place.', category: 'Personal finance' },
	grimoire: { summary: 'Shared memory for coding agents.', category: 'Agent tools' },
	goatedtracking: { summary: 'Farm records that work offline.', category: 'Farm operations' }
};

/** Short card copy only replaces the default public summary. Owner edits stay visible. */
export function projectPreviewCopy(project: ViewProject) {
	const preview = PREVIEW_COPY[project.id];
	const defaultSummary = PUBLIC_COPY[project.id]?.summary;
	const leadflowSummary = LEADFLOW_MATCHES[project.id]?.summary ?? LEADFLOW_PROJECTS.find((p) => p.id === project.id)?.summary;
	return {
		summary: preview && (project.summary === defaultSummary || project.summary === leadflowSummary) ? preview.summary : project.summary,
		category: preview?.category ?? ''
	};
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
	return out;
}

type FieldText = string | string[] | Feature[] | undefined;

/** A field's text in one comparable form. Empty text and empty lists count as
 *  absent, the same way rowToProject reads a CMS row. */
function textKey(v: FieldText): string {
	if (!v || v.length === 0) return '';
	if (typeof v === 'string') return v;
	return JSON.stringify(v.map((x) => (typeof x === 'string' ? x : [x.label, x.detail])));
}
const isLegacy = (v: FieldText, legacy: FieldText) => textKey(v) === textKey(legacy);

/** Swaps in the public copy of a known id, one field at a time: a field that still
 *  holds its legacy snapshot value gets the copy, an edited field keeps the edit.
 *  An unknown id keeps its row text. */
function publicCopy(p: Project): Project {
	const copy = PUBLIC_COPY[p.id];
	const legacy = PROJECTS.find((r) => r.id === p.id);
	if (!copy || !legacy) return p;
	const out: Project = { ...p };
	// Lead Flow matches: each field is replaced only while it still holds the legacy row
	// value or the earlier public copy, so a newer owner edit is never overwritten.
	const lf = LEADFLOW_MATCHES[p.id];
	if (lf) {
		if (p.title === legacy.title) out.title = lf.title;
		if (isLegacy(p.summary, legacy.summary) || p.summary === copy.summary) out.summary = lf.summary;
		if (isLegacy(p.outcomes, legacy.outcomes) || textKey(p.outcomes) === textKey(copy.impact)) out.outcomes = [...lf.impact];
		if (isLegacy(p.stack, legacy.stack)) out.stack = [...lf.stack];
		if (isLegacy(p.schematic, legacy.schematic)) out.schematic = [...lf.schematic];
		if (lf.live && (!p.live || p.live === legacy.live)) out.live = lf.live;
	} else {
		if (isLegacy(p.summary, legacy.summary)) out.summary = copy.summary;
		if (isLegacy(p.outcomes, legacy.outcomes)) out.outcomes = [...copy.impact];
	}
	if (isLegacy(p.why, legacy.why)) delete out.why;
	if (isLegacy(p.features, legacy.features)) delete out.features;
	const detail = { ...p.systemDetail };
	const old = legacy.systemDetail;
	if (isLegacy(detail.summary, old?.summary)) delete detail.summary;
	if (isLegacy(detail.legend, old?.legend)) delete detail.legend;
	if (UNVERIFIED_STATUS.has(p.id) && isLegacy(detail.deliveryStatus, old?.deliveryStatus)) delete detail.deliveryStatus;
	if (Object.keys(detail).length) out.systemDetail = detail;
	else delete out.systemDetail;
	return out;
}

function labelsFor(p: Project, demo: Demo | null): string[] {
	const labels: string[] = [];
	if (PAST.has(p.id)) labels.push('past project');
	if (LEADFLOW_IDS.has(p.id)) labels.push(LEADFLOW_LABEL);
	else if (AGENCY.has(p.id)) labels.push('agency project');
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
	const cover = demo ? undefined : LEADFLOW_COVERS[p.id];
	return [demo?.caption ?? cover?.note ?? '', CORRECTIONS[p.id]?.note ?? ''].map(sentence).filter(Boolean).join(' ');
}

/** Orders, labels, attaches demos and applies the public copy. Never drops a project;
 *  appends the source-managed Lead Flow catalog entries. */
export function present(rows: Project[]) {
	// The code-owned Lead Flow catalog joins the visible rows. A visible row with the
	// same id wins; nothing is written to the CMS and no absent row is restored.
	const have = new Set(rows.map((r) => r.id));
	// Public exclusions run after the join, so neither the CMS rows nor the source catalog can
	// bring an excluded id back. Raw rows, media and the admin are not touched.
	const projects = [...rows, ...LEADFLOW_PROJECTS.filter((p) => !have.has(p.id))].filter((p) => !PUBLIC_EXCLUDED.has(p.id));
	const highlightIds = new Set<string>(HIGHLIGHT_ORDER.filter((id) => !NEVER_HIGHLIGHT.has(id)));
	const all: ViewProject[] = projects.map((raw) => {
		const p = publicCopy(correct(raw));
		const demo = DEMOS[p.id] ?? null;
		// a code-owned cover fills in only where the row has no video, loom or cover of its own
		const cover = !demo && !p.loom && !p.cover ? LEADFLOW_COVERS[p.id] : undefined;
		return {
			...p,
			...(cover ? { cover: cover.src, coverAlt: cover.alt } : {}),
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
