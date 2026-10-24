// Source-managed public catalog of work done with Lead Flow Consulting (user-confirmed
// attribution; not a claim of sole authorship). These entries are authored public
// content in code, not CMS rows: they create no Supabase records and the CMS stays the
// source of every existing editable row. A visible CMS row with the same id wins.
//
// Public links: only the four destinations Adam approved. No link for Chargewell, internal
// tools, staging, proposal paths or the lead-magnet engine.
//
// Two parts:
// - LEADFLOW_MATCHES: four existing project ids that match a source app. Their title,
//   summary, impact, stack and system path are swapped in by presentation.ts only while
//   the stored field still holds its legacy value, so owner edits survive.
// - LEADFLOW_PROJECTS: ten distinct pieces with no existing id. Qualitative purpose,
//   value, stack and system path only: no years, metrics, production claims, media or
//   private links. Internal tools are shown as an architecture overview.

import type { Project } from './projects';

export const LEADFLOW_LABEL = 'Lead Flow Consulting';

export interface LeadflowMatch {
	title: string;
	summary: string;
	impact: [string, string];
	stack: string[];
	schematic: string[];
	/** public destination; applied only while the row's live field is empty or the legacy value */
	live?: string;
}

export const LEADFLOW_MATCHES: Record<string, LeadflowMatch> = {
	// chargewell sales automation (source README, package.json, webhook routes)
	whatsapp_offer: {
		title: 'Chargewell sales automation',
		summary:
			'turns a whatsapp enquiry into a qualified lead for a photovoltaic and battery installer: a tally form is checked, the lead is classified, and each case goes to an offer pdf or a technician booking.',
		impact: ['a person approves the photos in asana before any offer goes out', 'routine cases can end in a generated offer pdf, special cases go to a technician'],
		stack: ['node', 'express', 'supabase', 'tally', 'asana', 'whatsapp', 'pdf-lib'],
		schematic: ['whatsapp outreach', 'tally form', 'lead classification', 'photo review', 'offer pdf or booking']
		// no live link: the service root returns 404 and the health route is not a demo
	},
	// honest workshop wizard (source README, booking, sign, pay and invoice routes)
	booking_invoice: {
		title: 'honest workshop sales flow',
		summary:
			'takes a workshop customer from booking to payment in one bilingual flow: choose a slot, enter company data, sign with yousign and pay with mollie, then an everbill draft invoice and a hubspot deal update follow.',
		impact: ['german and english customers use the same booking flow', 'signature and payment status carry into the invoice and crm steps'],
		stack: ['cloudflare workers', 'supabase', 'yousign', 'mollie', 'everbill', 'hubspot', 'brevo', 'microsoft calendar'],
		schematic: ['workshop slot', 'company data', 'yousign signature', 'mollie payment', 'everbill draft invoice', 'hubspot'],
		live: 'https://werte-start.honestplaces.at'
	},
	// visenza quelle (source README, submit-quiz, confirm and get-report functions)
	quiz_funnel: {
		title: 'Visenza Quelle',
		summary:
			'guides visitors through a bilingual self-reflection quiz: the server validates and scores the answers into a profile, and a tailored report is released after double opt-in.',
		impact: ['the visitor gets a tailored profile report after confirming by email', 'the quiz result is saved to the crm for follow-up'],
		stack: ['html', 'css', 'javascript', 'netlify functions', 'supabase', 'brevo', 'aws bedrock'],
		schematic: ['quiz', 'server scoring', 'profile', 'report', 'double opt-in', 'crm'],
		live: 'https://quelle.visenza.co'
	},
	// visenza feel (source README, index.html, submit-feel function)
	video_landing: {
		title: 'Visenza FEEL',
		summary:
			'turns instagram visitors into contacts: a bilingual video landing page writes each contact into the crm, and the thank-you page offers a whatsapp next step.',
		impact: ['a social visit becomes a named contact in the crm', 'the visitor gets a direct whatsapp follow-up path'],
		stack: ['html', 'css', 'javascript', 'cloudflare pages functions', 'supabase', 'manychat'],
		schematic: ['instagram visitor', 'video page', 'contact form', 'supabase crm', 'whatsapp'],
		live: 'https://feel.visenza.co'
	}
};

type NewProject = Omit<Project, 'status' | 'year' | 'github' | 'x' | 'y' | 'features'>;

const piece = (p: NewProject): Project => ({ ...p, status: 'archive', year: '', github: '', x: 50, y: 50 });
const internal = (summary: string) => ({ summary });

export const LEADFLOW_PROJECTS: Project[] = [
	piece({
		id: 'leadflow_visenza_dashboard',
		title: 'Visenza owner dashboard',
		cluster: 'fullstack',
		summary: 'gives visenza staff one place to review quelle quiz results, work crm contacts through a lead pipeline and manage who has access.',
		outcomes: ['contacts, quiz results and lead-source insights are reviewed in one dashboard', 'the pipeline groups contacts by lead stage for follow-up'],
		stack: ['next.js', 'react', 'typescript', 'tailwind css', 'supabase', 'recharts'],
		schematic: ['staff login', 'role check', 'quiz results', 'crm contacts', 'lead pipeline'],
		systemDetail: internal('an internal tool behind a login. the interface capture uses example records and keeps the real contact data private.')
	}),
	piece({
		id: 'leadflow_visenza_site',
		title: 'Visenza information site',
		cluster: 'fullstack',
		summary: 'gives visenza a german and english website for product information and the pages a payment provider asks for during onboarding.',
		outcomes: ['one static build serves both languages', 'pages come from shared layout files, so they stay consistent'],
		stack: ['node', 'html', 'css', 'cloudflare pages'],
		schematic: ['content files', 'static generator', 'html pages', 'cloudflare pages']
	}),
	piece({
		id: 'leadflow_cockpit',
		title: 'Lead Flow cockpit',
		cluster: 'fullstack',
		summary: 'a shared crm and business dashboard for the lead flow team: companies, contacts, deals, sales pipelines, projects and finance in one workspace.',
		outcomes: ['companies, contacts and deals connect to a shared sales pipeline', 'role-based access controls which business areas each team member can open'],
		stack: ['next.js', 'react', 'typescript', 'tailwind css', 'supabase'],
		schematic: ['team login', 'access rights', 'crm contacts and companies', 'deals and pipeline', 'business operations'],
		systemDetail: internal('an internal team workspace with crm, project and finance modules. the interface capture uses example deals and contacts.')
	}),
	piece({
		id: 'leadflow_board',
		title: 'Lead Flow board',
		cluster: 'fullstack',
		summary: "keeps a team's tasks, timeline and project briefs in one internal board, with an agent terminal beside the work, all in shared supabase records.",
		outcomes: ['project briefs sit next to the tasks they explain', 'the timeline and card details keep dates, owners and notes in one place'],
		stack: ['node', 'express', 'supabase', 'zod', 'anthropic agent sdk'],
		schematic: ['team sign in', 'task cards', 'timeline and briefs', 'agent terminal', 'supabase'],
		systemDetail: internal('an internal tool. the hosted mirror and the local source are one product, described here by its architecture.')
	}),
	piece({
		id: 'leadflow_leadmagnet',
		title: 'Lead-magnet engine',
		cluster: 'automation',
		summary: 'delivers a campaign freebie only to confirmed subscribers: a visitor submits an email, confirms by double opt-in, then receives the freebie.',
		outcomes: ['the freebie goes out only after the inbox is confirmed', 'newsletter consent is handled separately from the download'],
		stack: ['cloudflare pages functions', 'supabase', 'brevo'],
		schematic: ['email form', 'double opt-in', 'confirmation', 'freebie delivery']
	}),
	piece({
		id: 'leadflow_coaching_guides',
		title: 'Coaching guides',
		cluster: 'fullstack',
		summary: 'helps coaching clients work on their own: a german and english guide site with a workflow guide and a guide to building an agent skill.',
		outcomes: ['clients can follow the guides on their own', 'one static site with no build step'],
		stack: ['html', 'css', 'javascript', 'netlify'],
		schematic: ['guide index', 'workflow guide', 'skill guide'],
		live: 'https://cheatsheet.lukaslanx.com'
	}),
	piece({
		id: 'leadflow_proposal_extension',
		title: 'Proposal assistant extension',
		cluster: 'ai',
		summary: 'helps draft proposals: an internal chrome extension and cloudflare worker write a proposal and screening answers from a knowledge base, and a person reviews and sends it.',
		outcomes: ['drafts start from an existing knowledge base and voice', 'the final send stays with a person'],
		stack: ['chrome manifest v3', 'cloudflare workers', 'workers kv'],
		schematic: ['job post', 'extension', 'worker and knowledge base', 'draft', 'human review and send'],
		systemDetail: internal('an internal lead flow tool built on an existing proposal knowledge base and voice.')
	}),
	piece({
		id: 'leadflow_invoice_webhook',
		title: 'Invoice webhook',
		cluster: 'automation',
		summary: 'takes manual entry out of invoicing: a successful stripe payment creates a draft invoice in zoho books and sends a telegram notice, while a failed payment sends an alert only.',
		outcomes: ['draft invoices follow successful payments without manual entry', 'failed payments raise an alert instead of an invoice'],
		stack: ['python', 'fastapi', 'stripe', 'zoho books', 'telegram', 'apscheduler'],
		schematic: ['stripe event', 'webhook service', 'zoho draft invoice', 'telegram alert'],
		systemDetail: internal('an internal service, separate from the workshop booking flow.')
	}),
	piece({
		id: 'leadflow_slack_mirror',
		title: 'Slack client mirror',
		cluster: 'automation',
		summary: 'lets a team read client slack messages in english: events are verified and deduplicated, text is translated and posted to a mirror channel with the sender label, and images are mirrored with captions.',
		outcomes: ['team members can read translated messages in the mirror channel', 'the sender and supported image content are preserved'],
		stack: ['python', 'flask', 'slack sdk', 'anthropic sdk', 'sqlite'],
		schematic: ['slack event', 'verify and deduplicate', 'translate', 'mirror channel'],
		systemDetail: internal('an internal service. the messages and channel details stay private.')
	}),
	piece({
		id: 'leadflow_proposals_site',
		title: 'Proposal publishing site',
		cluster: 'fullstack',
		summary: 'gives each client a separate static proposal page on cloudflare pages. only the hosting setup is described here.',
		outcomes: ['one folder per client keeps each proposal separate', 'static files with no build step'],
		stack: ['html', 'cloudflare pages'],
		schematic: ['proposal folder', 'static files', 'cloudflare pages'],
		systemDetail: internal('a private document host. the proposal pages and client details stay private.')
	})
];

/** Cover images for the pieces that have no video. `screenshot` is a real capture of a public
 *  page; `overview` is a diagram drawn from the piece's own system path and stack, never an
 *  app screenshot. Files are WebP, 1280 x 720, in public/project-covers. */
export interface LeadflowCover {
	src: string;
	alt: string;
	note: string;
}

const overview = (id: string, title: string): LeadflowCover => ({
	src: `/project-covers/${id}.webp`,
	alt: `Workflow overview of ${title}: its system path from first step to last, with the technologies it uses.`,
	note: 'workflow overview.'
});

export const LEADFLOW_COVERS: Record<string, LeadflowCover> = {
	leadflow_visenza_dashboard: {
		src: '/project-covers/leadflow_visenza_crm.webp',
		alt: 'Visenza CRM contact table with search, lead-source and consent filters, rendered from the project components with example records.',
		note: 'interface capture from project components with example records.'
	},
	leadflow_visenza_site: overview('leadflow_visenza_site', 'the Visenza information site'),
	leadflow_cockpit: {
		src: '/project-covers/leadflow_cockpit_crm.webp',
		alt: 'Lead Flow Cockpit sales pipeline with deals grouped by stage, rendered from the project components with example records.',
		note: 'interface capture from project components with example records.'
	},
	leadflow_board: overview('leadflow_board', 'the Lead Flow board'),
	leadflow_leadmagnet: overview('leadflow_leadmagnet', 'the lead-magnet engine'),
	leadflow_proposal_extension: overview('leadflow_proposal_extension', 'the proposal assistant extension'),
	leadflow_invoice_webhook: overview('leadflow_invoice_webhook', 'the invoice webhook'),
	leadflow_slack_mirror: overview('leadflow_slack_mirror', 'the Slack client mirror'),
	leadflow_proposals_site: overview('leadflow_proposals_site', 'the proposal publishing site'),
	leadflow_coaching_guides: {
		src: '/project-covers/leadflow_coaching_guides.webp',
		alt: 'The public coaching guide site in German: the overview page with the headline Deine Arbeitsweise, a navigation bar and a vision panel.',
		note: 'screenshot of the public page, captured on 11 october 2026.'
	}
};
