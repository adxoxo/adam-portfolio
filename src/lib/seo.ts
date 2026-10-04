import { SITE_URL } from '~/components/site/state';
import { SOCIALS } from '~/lib/data/socials';
import type { ViewProject } from '~/lib/data/presentation';

export const FEATURED_PROJECT_SLUGS = [
	'vault',
	'grimoire',
	'tq_chatbot',
	'goatedtracking',
	'whatsapp_offer',
	'booking_invoice'
] as const;

export type FeaturedProjectSlug = (typeof FEATURED_PROJECT_SLUGS)[number];
export type ProjectSchemaType = 'SoftwareApplication' | 'CreativeWork';

interface ProjectSeoRecord {
	canonicalTitle: string;
	metaDescription: string;
	schemaType: ProjectSchemaType;
	transcript: readonly string[];
}

export interface ProjectSeo extends ProjectSeoRecord {
	slug: FeaturedProjectSlug;
	path: `/projects/${FeaturedProjectSlug}`;
	url: string;
	video: {
		name: string;
		description: string;
		uploadDate: '2026-10-04';
		duration: string;
		thumbnailUrl: string;
		contentUrl: string;
		transcriptUrl: string;
	};
	breadcrumbs: readonly [
		{ name: 'home'; url: string },
		{ name: string; url: string }
	];
}

const PROJECT_SEO: Record<FeaturedProjectSlug, ProjectSeoRecord> = {
	vault: {
		canonicalTitle: 'aquryu vault case study | Adam Gemenez',
		metaDescription:
			'A mobile-first personal finance PWA for quick transaction logging, multi-wallet balances, offline use and PHP/USD records.',
		schemaType: 'SoftwareApplication',
		transcript: [
			'aquryu vault. App demo with synthetic data. Synthetic wallets. The USD rate in this demo is a manual sample value.',
			'Vault opens on quick log, total balance first.',
			'Tap Food: the log sheet opens with the wallet already set.',
			'Type the amount on the keypad: 2, 8, 5.',
			'Confirm: logged ₱285, Food, GCash.',
			'The total and the GCash wallet update from that one log.',
			'Dashboard: income, spending and net position for the week.',
			'Plan: the weekly budget that income and costs allow.',
			'Goals show how many weeks they take at this rate.',
			'aquryu vault. Real Vault UI running locally. Synthetic data, fixed clock, voice and AI routes blocked.'
		]
	},
	grimoire: {
		canonicalTitle: 'grimoire case study | Adam Gemenez',
		metaDescription:
			'A retired local knowledge system that connected notes, projects, daily planning and coding agents through one MCP gateway.',
		schemaType: 'SoftwareApplication',
		transcript: [
			'grimoire. App demo with synthetic data. Retired in September 2026. Shown from its last commit with synthetic notes and a stand-in embedding provider.',
			'One local graph of notes, sessions and projects.',
			'All nodes: documents, memories and projects in one constellation.',
			'Pick a project: only its one-hop neighbourhood stays in focus.',
			'The project hub keeps living context and open tasks together.',
			'Chronicles and linked tomes come from the same graph.',
			'Today: tasks sit on an Eisenhower board.',
			'Drag a task into Do now, tick a ritual, the streak updates.',
			'Flow: generate today from tasks, rituals and anchors.',
			'Plans change at 11:10: pin a 2 pm client call.',
			'Reflow from now: started blocks lock, the rest moves.',
			'Coding agents reach the same store through one MCP gateway.',
			'Each tool call writes an OpenTelemetry span to the console.',
			'grimoire. Real Grimoire UI running locally. Synthetic data; Ollama replaced by the built-in fake provider.'
		]
	},
	tq_chatbot: {
		canonicalTitle: 'tq chatbot case study | Adam Gemenez',
		metaDescription:
			'A configurable funnel chatbot that scores visitor intent, follows three lead paths and offers high-intent visitors a call link.',
		schemaType: 'SoftwareApplication',
		transcript: [
			'tq chatbot. App demo with synthetic data. No AI keys in this demo: built-in mock replies and rule scoring. Synthetic tenants and leads.',
			'A visitor opens the chat widget on a client site.',
			'Turn 1: “hey, i run a digital marketing agency”.',
			'Turn 2: stated ad spend and a clear pain.',
			'Hot lead: the bot stops asking and offers a call.',
			'Behind the scenes: the same chat in the admin test console.',
			'Turn 1 scores 1.5, the state moves to qualifying.',
			'Turn 2 scores 10.5, past the hot threshold of 10: closing.',
			'No AI key here: built-in mock replies and rule scoring.',
			'Hot, warm and cold leads land in one table.',
			'Each client is one row in the tenants table.',
			'Its own personality, signal weights and thresholds.',
			'tq chatbot. Real app running locally from a sandbox copy. No AI calls, no webhooks, the call link is never opened.'
		]
	},
	goatedtracking: {
		canonicalTitle: 'goatedtracking case study | Adam Gemenez',
		metaDescription:
			'A local-first goat farm system with QR records, health history, pen transfers and vaccination alerts on the farm network.',
		schemaType: 'SoftwareApplication',
		transcript: [
			'goatedtracking. App demo with synthetic data. A synthetic herd on a local server. The internet is optional, not required.',
			'Every goat gets a QR ear tag from its profile.',
			'Print it, tag the goat, and the tag opens this record.',
			'Scan a tag on any phone: the goat profile opens, no login.',
			'Another tag: this goat is overdue for a vaccination.',
			'The worker logs a quick health note.',
			'Saved: the note joins the goat history.',
			'Admins move goats between pens from the dashboard.',
			'Move Hazel, G-015, into the Nursery.',
			'Add a reason and transfer.',
			'Lineage check on every move: it warns, it never blocks.',
			'The dashboard counts the herd and what is due.',
			'Overdue and due-soon goats surface on their own.',
			'goatedtracking. Real app running locally with a synthetic herd. No cloud services in the path.'
		]
	},
	whatsapp_offer: {
		canonicalTitle: 'WhatsApp-to-offer automation case study | Adam Gemenez',
		metaDescription:
			'A documented lead workflow from WhatsApp intake and human photo review to an offer document or a technician call.',
		schemaType: 'CreativeWork',
		transcript: [
			'whatsapp-to-offer automation. Animated system walkthrough of the documented flow. Animated from the documented flow, plus the real photo-review screen on synthetic photos. Messages and documents are simulated.',
			'A web lead lands in the automation service.',
			'An automated WhatsApp intro carries the form link, and the team gets a task card.',
			'The customer sends photos and job details, the model qualifies them.',
			'Then a person reviews the photos.',
			'The reviewer swipes right to approve each photo.',
			'Or taps yes: four photos, four decisions.',
			'All approved: the offer path. In this demo nothing is sent.',
			'Otherwise the case routes to a technician call.',
			'Approved: an offer document goes out by WhatsApp.',
			'Otherwise the customer gets a link to book a technician call.',
			'whatsapp-to-offer automation. Walkthrough of the documented flow. Review screen on a local stub; no message, form, task, offer or link was sent.'
		]
	},
	booking_invoice: {
		canonicalTitle: 'booking-to-invoice automation case study | Adam Gemenez',
		metaDescription:
			'A bilingual booking workflow that connects availability, contract signature, payment, invoicing, CRM and scheduled reminders.',
		schemaType: 'CreativeWork',
		transcript: [
			'booking-to-invoice flow. App demo with simulated integrations. Real wizard code, de-branded, with synthetic data. Calendar, signature, payment, invoice and email are simulated.',
			'One booking link: German or English on the same URL.',
			'The customer picks the workshop format.',
			'Pick a free day: availability here is a simulated fixture.',
			'Then a start time and an email address.',
			'Company details feed the offer and the invoice.',
			'The offer arrives pre-filled: net, VAT and total.',
			'Sign the offer: the signing window is a local stub here.',
			'Pay by SEPA or card: no payment provider is called.',
			'Done: in this demo no invoice, email or calendar event exists.',
			'The documented production chain: signature, payment, invoice, CRM.',
			'Then the confirmation email and scheduled reminders.',
			'booking-to-invoice flow. Wizard UI on fixtures. No calendar, payment, signature, invoice, CRM or email service was called.'
		]
	}
};

const PUBLIC_PROFILES = SOCIALS.filter((social) => !social.email).map((social) => social.url);

const personJsonLd = () => ({
	'@type': 'Person',
	'@id': `${SITE_URL}/#adam-gemenez`,
	name: 'Adam Gemenez',
	url: `${SITE_URL}/`,
	image: `${SITE_URL}/adam.jpg`,
	jobTitle: 'AI and software engineer',
	sameAs: PUBLIC_PROFILES
});

export function isFeaturedProjectSlug(value: string): value is FeaturedProjectSlug {
	return FEATURED_PROJECT_SLUGS.includes(value as FeaturedProjectSlug);
}

export function projectPath(slug: FeaturedProjectSlug): `/projects/${FeaturedProjectSlug}` {
	return `/projects/${slug}`;
}

/** The public slug and project id are equal today. Keep route code behind this
 * mapping so a future readable slug cannot select a different CMS row. */
export function idForSlug(slug: FeaturedProjectSlug): FeaturedProjectSlug {
	return slug;
}

export function slugForId(id: string): FeaturedProjectSlug | null {
	return isFeaturedProjectSlug(id) ? id : null;
}

function isoDuration(seconds: number): string {
	return `PT${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}S`;
}

export function getProjectSeo(project: ViewProject): ProjectSeo | null {
	if (!isFeaturedProjectSlug(project.id) || !project.demo) return null;
	const slug = project.id;
	const record = PROJECT_SEO[slug];
	const path = projectPath(slug);
	const url = `${SITE_URL}${path}`;
	return {
		...record,
		slug,
		path,
		url,
		video: {
			name: `${project.title} demo`,
			description: project.note || project.demo.caption,
			uploadDate: '2026-10-04',
			duration: isoDuration(project.demo.durationSeconds),
			thumbnailUrl: `${SITE_URL}${project.demo.poster}`,
			contentUrl: `${SITE_URL}${project.demo.url}`,
			transcriptUrl: `${SITE_URL}${project.demo.captions}`
		},
		breadcrumbs: [
			{ name: 'home', url: `${SITE_URL}/` },
			{ name: project.title, url }
		]
	};
}

export function buildHomeJsonLd(): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			personJsonLd(),
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				url: `${SITE_URL}/`,
				name: 'Adam Gemenez portfolio',
				description: 'AI engineering, full-stack software, automation and embedded systems by Adam Gemenez.',
				author: { '@id': `${SITE_URL}/#adam-gemenez` },
				inLanguage: 'en'
			}
		]
	};
}

export function buildProjectJsonLd(project: ViewProject, seo = getProjectSeo(project)): Record<string, unknown> | null {
	if (!seo) return null;
	const work = {
		'@type': seo.schemaType,
		'@id': `${seo.url}#project`,
		url: seo.url,
		name: project.title,
		description: seo.metaDescription,
		dateCreated: project.year,
		creator: { '@id': `${SITE_URL}/#adam-gemenez` },
		keywords: project.stack,
		...([project.github, project.live].filter(Boolean).length
			? { sameAs: [project.github, project.live].filter(Boolean) }
			: {}),
		...(seo.schemaType === 'SoftwareApplication'
			? { applicationCategory: 'BusinessApplication', operatingSystem: 'Web' }
			: {})
	};
	return {
		'@context': 'https://schema.org',
		'@graph': [
			personJsonLd(),
			work,
			{
				'@type': 'VideoObject',
				'@id': `${seo.url}#demo`,
				name: seo.video.name,
				description: seo.video.description,
				uploadDate: seo.video.uploadDate,
				duration: seo.video.duration,
				thumbnailUrl: seo.video.thumbnailUrl,
				contentUrl: seo.video.contentUrl,
				transcript: seo.transcript.join(' '),
				about: { '@id': `${seo.url}#project` }
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: seo.breadcrumbs.map((item, index) => ({
					'@type': 'ListItem',
					position: index + 1,
					name: item.name,
					item: item.url
				}))
			}
		]
	};
}

/** Escape characters that can end an inline script or change its parsing. */
export function serializeJsonLd(value: unknown): string {
	return JSON.stringify(value)
		.replace(/&/g, '\\u0026')
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}
