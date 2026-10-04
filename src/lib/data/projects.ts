// Project content model shared by the public site, the admin and the server.
// Shape mirrors the Supabase `projects` table (mapped by rowToProject in
// src/lib/server/projects.ts). PROJECTS is the public fallback: a verbatim
// snapshot of the 21 public CMS rows (status <> 'hidden', in sort_order) taken
// on 2026-10-04, so the site renders the same projects when Supabase is unset,
// fails, or returns no rows.

export type Cluster = 'ai' | 'fullstack' | 'automation' | 'embedded';
export type Status = 'featured' | 'archive' | 'hidden';

// A technical highlight shown in the detail modal under "how it works". Optional per
// project, so most projects render nothing extra and only the ones worth explaining do.
export interface Feature {
	label: string; // short lowercase title
	detail: string; // one sentence, lowercase, no em-dash
}

// Public part of the CMS `system_detail` column (agency/system projects). The
// stored diagram image path is not part of it: those files 404 on the site.
export interface SystemDetail {
	summary?: string;
	deliveryStatus?: string; // e.g. "live and verified"
	legend?: Feature[]; // one entry per system component
}

export interface Project {
	id: string;
	title: string;
	cluster: Cluster;
	status: Status;
	year: string;
	summary: string;
	outcomes: string[];
	stack: string[];
	schematic: string[];
	github: string;
	why?: string; // short motivation, optional (shown in the detail modal)
	features?: Feature[]; // technical highlights, optional (shown as "how it works")
	live?: string; // hosted/live site url, optional
	loom?: string; // loom share id -> walkthrough embed, optional
	loomThumb?: string; // cached loom oEmbed thumbnail (animated gif), set on save
	cover?: string; // card cover image url, optional (used when there is no loom)
	systemDetail?: SystemDetail; // system walkthrough legend, optional
	x: number; // CMS map position, % (admin-editable; the new map computes its own slots)
	y: number;
}

export interface Hub {
	id: string;
	label: string;
	type: 'hub' | 'center';
	cluster?: Cluster;
	x: number;
	y: number;
}

export const CLUSTERS: Cluster[] = ['ai', 'fullstack', 'automation', 'embedded'];

export const CLUSTER_LABEL: Record<Cluster, string> = {
	ai: 'ai',
	fullstack: 'full-stack',
	automation: 'automation',
	embedded: 'embedded'
};

export const HUBS: Hub[] = [
	{ id: 'center', label: 'adam', type: 'center', x: 50, y: 50 },
	{ id: 'hub_ai', label: 'ai', type: 'hub', cluster: 'ai', x: 28, y: 27 },
	{ id: 'hub_fullstack', label: 'full-stack', type: 'hub', cluster: 'fullstack', x: 70, y: 27 },
	{ id: 'hub_embedded', label: 'embedded', type: 'hub', cluster: 'embedded', x: 85, y: 82 },
	{ id: 'hub_automation', label: 'automation', type: 'hub', cluster: 'automation', x: 29, y: 73 }
];

export const PROJECTS: Project[] = [
	{
		id: 'quiz_funnel', title: 'bilingual quiz funnel', cluster: 'ai', status: 'archive', year: '2026', x: 17, y: 33,
		summary:
			'a bilingual twenty question quiz that scores a visitor into a profile and mails back a personalized report. the model only breaks a tie, so the result stays explainable.',
		features: [],
		outcomes: ['capture, double opt-in and report delivery run as one chain', 'the profile is deterministic, the model only breaks a tie'],
		stack: ['javascript', 'netlify', 'supabase', 'aws bedrock', 'brevo', 'playwright'],
		schematic: ['visitor', 'quiz funnel', 'serverless functions', 'supabase', 'report'],
		github: '',
		live: '',
		loom: '',
		systemDetail: {
			summary:
				'a bilingual quiz scores a visitor into one of five profiles and mails back the matching report. scoring is deterministic, so the model never decides the outcome on its own.',
			deliveryStatus: 'live and verified',
			legend: [
				{ label: 'visitor', detail: 'takes the twenty question quiz in either language' },
				{ label: 'quiz funnel', detail: 'vanilla javascript frontend with its own translation layer' },
				{ label: 'netlify functions', detail: 'serverless handlers, the only thing that holds a key' },
				{ label: 'supabase', detail: 'postgres store for the lead and every answer' },
				{ label: 'aws bedrock', detail: 'personalizes the report text, used only to break a tie' },
				{ label: 'brevo', detail: 'double opt-in email and delivery' },
				{ label: 'report', detail: 'the personalized result document and the captured lead' }
			]
		}
	},
	{
		id: 'video_landing', title: 'video-first landing page', cluster: 'fullstack', status: 'archive', year: '2026', x: 59, y: 22,
		summary:
			'a bilingual video-first landing page for campaign traffic. it writes into the same crm table as the quiz funnel, so both funnels land in one place.',
		features: [],
		outcomes: ['campaign traffic lands in the existing crm table, not a second one', 'one url carries both languages'],
		stack: ['javascript', 'cloudflare', 'supabase', 'brevo', 'manychat', 'playwright'],
		schematic: ['visitor', 'landing page', 'pages functions', 'supabase'],
		github: '',
		live: '',
		loom: '',
		systemDetail: {
			summary:
				'a second capture surface for the same audience, built on the crm that already existed. the page is bilingual on a single url and the submit path is serverless.',
			deliveryStatus: 'live and verified',
			legend: [
				{ label: 'campaign visitor', detail: 'arrives from a paid campaign' },
				{ label: 'landing page', detail: 'video-first page with a language toggle on one url' },
				{ label: 'pages functions', detail: 'cloudflare pages functions take the form submit' },
				{ label: 'supabase', detail: 'the same postgres crm table the quiz funnel writes to' },
				{ label: 'brevo', detail: 'opt-in email' },
				{ label: 'manychat webhook', detail: 'captures the campaign keyword into the chat channel' }
			]
		}
	},
	{
		id: 'video_product', title: 'self-serve video product', cluster: 'fullstack', status: 'archive', year: '2026', x: 73, y: 37,
		summary:
			'checkout to account to protected playback with nobody in the middle. a second product is a row in a join table, not new code.',
		features: [],
		outcomes: ['checkout, account creation, access email and playback run as one chain', 'a second product is a data row, not a new build'],
		stack: ['node', 'express', 'stripe', 'supabase', 'brevo', 'caddy'],
		schematic: ['checkout', 'paid webhook', 'account', 'signed url'],
		github: '',
		live: '',
		loom: '',
		systemDetail: {
			summary:
				'a self-serve product where payment, account creation, the access email and protected playback are one automated chain. a join table means a second product needs no new code.',
			deliveryStatus: 'live in test mode',
			legend: [
				{ label: 'customer', detail: 'buys the product, then logs back in to watch it' },
				{ label: 'node and express app', detail: 'runs on a vps behind a caddy reverse proxy under systemd' },
				{ label: 'stripe', detail: 'hosted checkout plus the paid webhook that starts fulfilment' },
				{ label: 'supabase', detail: 'auth, the account, and the purchase record' },
				{ label: 'brevo', detail: 'sends the access email' },
				{ label: 'protected playback', detail: 'video served over hmac signed urls, never a public file' }
			]
		}
	},
	{
		id: 'experience_engine', title: 'post-purchase experience engine', cluster: 'fullstack', status: 'archive', year: '2026', x: 47, y: 50,
		summary:
			'a post-purchase experience where every scene is a database row instead of code. access moves across devices through a signed magic link.',
		features: [],
		outcomes: ['a new experience is a set of rows, not a new codebase', 'one signing primitive covers sessions, assets and magic links'],
		stack: ['node', 'express', 'supabase', 'brevo', 'vitest', 'caddy'],
		schematic: ['purchase', 'magic link', 'scene player', 'supabase'],
		github: '',
		live: '',
		loom: '',
		systemDetail: {
			summary:
				'a config-driven engine where a product is defined in the database, not written. one shared signing primitive covers sessions, asset streaming and magic links.',
			deliveryStatus: 'built and live-verified. deployment pending',
			legend: [
				{ label: 'customer', detail: 'buys, then opens the experience on any device' },
				{ label: 'experience engine', detail: 'node and express service on a vps behind caddy' },
				{ label: 'ccbill', detail: 'payment, mocked until the merchant account lands' },
				{ label: 'brevo', detail: 'sends the magic link that carries access across devices' },
				{ label: 'supabase', detail: 'postgres with row level security holds scenes and answers' },
				{ label: 'scene player', detail: 'reads scenes as config rows rather than as code' }
			]
		}
	},
	{
		id: 'dm_triage', title: 'dm triage system', cluster: 'ai', status: 'archive', year: '2026', x: 41, y: 17,
		summary:
			'a discovery and architecture pass on triaging inbound social messages. phase one is buildable today, phase two waits on a platform plan that allows outbound requests.',
		features: [],
		outcomes: ['split into a buildable phase one and a blocked phase two', 'the platform limit that blocks phase two was found before any build started'],
		stack: ['manychat', 'claude api', 'supabase', 'tally'],
		schematic: ['inbound dm', 'form intake', 'classifier', 'supabase'],
		github: '',
		live: '',
		loom: '',
		systemDetail: {
			summary:
				'a five stage discovery that split one brief into a phase that could ship and a phase that could not. the blocker and the data-protection risk were both named before any code.',
			deliveryStatus: 'discovery complete. build not started',
			legend: [
				{ label: 'dm sender', detail: 'sends an inbound message on the social channel' },
				{ label: 'messenger and instagram', detail: 'the inbound channel, integration researched not wired' },
				{ label: 'phase one', detail: 'buildable now, a form that writes structured research data' },
				{ label: 'tally form', detail: 'turns a free-text wish into fixed fields' },
				{ label: 'supabase, phase one', detail: 'postgres store for the structured answers' },
				{ label: 'phase two', detail: 'blocked until the chat plan allows an outbound request' },
				{ label: 'manychat', detail: 'would carry the message text out to the classifier' },
				{ label: 'claude classifier', detail: 'labels intent before anything is written down' },
				{ label: 'supabase, phase two', detail: 'postgres store for the triaged intent' }
			]
		}
	},
	{
		id: 'whatsapp_offer', title: 'whatsapp-to-offer automation', cluster: 'automation', status: 'archive', year: '2026', x: 19, y: 61,
		summary:
			'a web lead gets an automated intro message, a form link and a task card. the qualified path ends in a branded offer document, the rest routes to a call.',
		features: [],
		outcomes: ['the standard case runs end to end without a rep touching it', 'offer documents come out on the existing letterhead'],
		stack: ['node', 'railway', 'supabase', 'claude api', 'asana', 'tally', 'pdf-lib'],
		schematic: ['web lead', 'whatsapp intro', 'form', 'offer document'],
		github: '',
		live: '',
		loom: '',
		systemDetail: {
			summary:
				'one chain from web lead to a branded offer document, with a routed call as the fallback when the case is not standard. every step is idempotent against a webhook redelivery.',
			deliveryStatus: 'live and verified',
			legend: [
				{ label: 'web lead', detail: 'submits the landing funnel' },
				{ label: 'funnel platform', detail: 'hosts the landing funnels and posts a webhook out' },
				{ label: 'automation service', detail: 'node service on railway, push to deploy' },
				{ label: 'supabase', detail: 'postgres store for the lead and where it sits in the flow' },
				{ label: 'whatsapp', detail: 'automated intro message carrying the form link' },
				{ label: 'tally form', detail: 'collects the photos and job details the offer needs' },
				{ label: 'asana card', detail: 'a task card so the team sees the lead in their own board' },
				{ label: 'claude api', detail: 'qualifies the lead from the collected answers' },
				{ label: 'offer document', detail: 'generated with pdf-lib on the existing quote layout' }
			]
		}
	},
	{
		id: 'booking_invoice', title: 'booking-to-invoice flow', cluster: 'automation', status: 'archive', year: '2026', x: 43, y: 79,
		summary:
			'one bilingual booking link that ends in a signed contract, a paid invoice and a crm stage move. reminders run on a schedule after that.',
		features: [],
		outcomes: ['booking to signed and invoiced runs with no manual admin step', 'data stays in the eu region'],
		stack: ['cloudflare workers', 'supabase', 'mollie', 'yousign', 'everbill', 'hubspot', 'brevo'],
		schematic: ['booking link', 'payment', 'signature', 'invoice'],
		github: '',
		live: '',
		loom: '',
		systemDetail: {
			summary:
				'a serverless booking wizard that chains payment, signature, invoicing, crm and email into one pass. a pre-existing double-booking hole was found and closed on the way.',
			deliveryStatus: 'live and verified',
			legend: [
				{ label: 'customer', detail: 'opens a personalized booking link' },
				{ label: 'booking wizard', detail: 'cloudflare workers with static assets, bilingual on one url' },
				{ label: 'supabase', detail: 'postgres in the eu region holds the booking' },
				{ label: 'mollie', detail: 'takes the payment by sepa or card' },
				{ label: 'yousign', detail: 'collects the e-signature on the contract' },
				{ label: 'everbill', detail: 'issues the invoice without anyone opening it' },
				{ label: 'hubspot', detail: 'moves the deal to its next stage' },
				{ label: 'brevo', detail: 'sends the confirmation email' },
				{ label: 'cron reminders', detail: 'a scheduled worker sends the follow-ups' }
			]
		}
	},
	{
		id: 'tq_chatbot', title: 'tq chatbot', cluster: 'ai', status: 'featured', year: '2026', x: 13, y: 15,
		summary:
			'a multi-tenant funnel chatbot that talks to a visitor, scores how serious they are in real time, and pushes the hot ones straight to a booked call. build it once, reconfigure it per client.',
		why:
			'i wanted one closer i could reuse for any client instead of rebuilding it each time, so a whole client setup, the personality, the qualifying logic, the scoring weights, is a single database row. and i built it as a closer, not a support bot. the only test that matters is whether it books a high-intent visitor faster than a contact form would.',
		features: [
			{ label: 'scores intent in real time', detail: 'on every message the model pulls five buying signals and weights them into one score. that score, not a keyword, decides what the bot does next.' },
			{ label: 'knows when to stop selling', detail: 'a state machine walks greeting to qualifying to closing. once a lead is hot it stops asking and drops the calendly card, so it never talks a booked call back out of the room.' },
			{ label: 'three lead paths', detail: 'hot leads book a call and notify the team, warm leads get their email captured for follow-up, and cold leads get a polite exit and are stored quietly. no lead is spammed or lost.' },
			{ label: 'one row per client', detail: 'the same engine runs every client bot. swapping a client means swapping one supabase row, so nothing is rebuilt and nothing is shared between them.' },
			{ label: 'runs for zero dollars until it earns', detail: 'with no api keys it runs on local storage, a mock closer, and log-only alerts, so i can build and demo it for free. each part promotes to production one key at a time.' },
			{ label: 'no crm lock-in', detail: 'hot-lead events fire to a single per-client n8n webhook, and n8n fans them out to email, slack, or wherever the client already works.' }
		],
		outcomes: ['runs for zero dollars with no api keys', 'promotes to production one key at a time'],
		stack: ['react', 'fastapi', 'supabase', 'groq', 'n8n', 'cloudflare'],
		schematic: ['widget', 'fastapi', 'supabase', 'groq', 'n8n', 'booked call'],
		github: 'https://github.com/adxoxo/chatbot-closer',
		live: '',
		loom: 'a3f34d52e411418a850961601e9de768',
		loomThumb: 'https://cdn.loom.com/sessions/thumbnails/a3f34d52e411418a850961601e9de768-0064797a046f9669.gif'
	},
	{
		id: 'grimoire', title: 'grimoire', cluster: 'ai', status: 'featured', year: '2026', x: 31, y: 44,
		summary:
			'a local knowledge base that every coding agent reaches through a single mcp gateway. it ingests documents, remembers past sessions, and hands back only what is relevant, project by project. everything runs offline on my own machine.',
		why:
			'i wanted a second brain. one store my coding agents and i both read from, so nothing gets repeated. it also runs my day, with a to-do list on the eisenhower matrix and a timetable that regenerates as the day shifts, since i never keep a fixed schedule.',
		features: [
			{ label: 'runs on my own machine', detail: 'chunking and embedding happen locally on my own gpu. nothing about my notes leaves the device.' },
			{ label: '500-token chunks, small overlap', detail: 'text is split into ~500-token chunks with a small carry-over overlap, so an idea that straddles a boundary is never lost.' },
			{ label: '768-dimension local embeddings', detail: 'a local nomic-embed model turns each chunk into a 768-dimension vector, stored in sqlite-vec.' },
			{ label: 'graph-tree, one to two hop retrieval', detail: 'a query starts at the project node and walks one to two hops out through the graph, so it pulls only related context, never the whole base.' },
			{ label: 'narrow vector search', detail: 'the vector search runs only over that graph-narrowed set of candidates, not across everything.' },
			{ label: 'time-weighted scoring', detail: 'results rank by similarity times a recency decay, so what i touched recently surfaces first.' }
		],
		outcomes: ['retrieval, memory and compaction all verified', 'embeddings running on a local gpu'],
		stack: ['python', 'sqlite-vec', 'fastmcp', 'ollama', 'opentelemetry'],
		schematic: ['agents', 'mcp gateway', 'sqlite-vec'],
		github: 'https://github.com/adxoxo/grimoire',
		live: '',
		loom: '93556fc863834e21a2ae18e7fddf3235',
		loomThumb: 'https://cdn.loom.com/sessions/thumbnails/93556fc863834e21a2ae18e7fddf3235-0938497fe076ed18.gif'
	},
	{
		id: 'vault', title: 'aquryu vault', cluster: 'fullstack', status: 'featured', year: '2026', x: 80, y: 42,
		summary:
			'a personal money operating system. a mobile-first pwa for logging income, expenses, and transfers across multiple wallets, with one glanceable picture of total money. it earns in both php and usd and converts usd at the official bsp rate captured at log time.',
		why:
			'i wanted logging money to be friction-free. every added tap is a logged expense that never happens, so the whole app is built around three taps or fewer, or by voice.',
		features: [
			{ label: 'three taps or fewer', detail: 'the app opens on the quick-log screen with a glanceable total balance, so recording money is the first thing you do, not something buried in menus.' },
			{ label: 'voice logging in taglish', detail: 'speak an entry and groq whisper transcribes it, then llama parses it into a structured transaction and maps spoken wallet names to your real accounts, with a one-line confirm before it commits.' },
			{ label: 'multi-currency at the bsp rate', detail: 'usd income converts to php at the official bsp rate for the day it landed, stored per transaction so history is never retroactively recomputed.' },
			{ label: 'balances that never drift', detail: 'every wallet balance is derived from a starting balance plus every transaction, stored as integer centavos so rounding never creeps in.' },
			{ label: 'offline-first pwa', detail: 'installable on a mid-range phone and tuned for high-glare outdoor use, it keeps logging offline then reconciles when the connection returns.' }
		],
		outcomes: ['secrets never reach the browser; every table locked by row-level security', 'runs on cloudflare pages with supabase, no server to manage'],
		stack: ['sveltekit', 'supabase', 'cloudflare', 'groq', 'typescript'],
		schematic: ['pwa', 'cloudflare functions', 'supabase', 'groq'],
		github: 'https://github.com/adxoxo/aquryu-vault',
		live: '',
		loom: ''
	},
	{
		id: 'goatedtracking', title: 'goatedtracking', cluster: 'fullstack', status: 'featured', year: '2026', x: 66, y: 13,
		summary:
			'a local-first monitoring system for a small goat farm here in the philippines. every goat wears a qr ear tag. scan it on the farm wifi and its whole profile opens: health records, vaccinations, pen, lineage. the internet is optional, not required.',
		why:
			'the farm is in a part of the philippines where the internet drops and the power cuts, so i built it local-first: one server on the farm wifi with no cloud in the path. and it has two doors on one system, because a worker out in the pens should just scan a tag and see the goat, while the office needs a full dashboard behind a login.',
		features: [
			{ label: 'qr ear tag to profile', detail: 'registering a goat generates a qr printed on its ear tag. scanning it opens that goat profile in any phone browser on the farm wifi, with no app to install and no login for the worker.' },
			{ label: 'runs with the internet off', detail: 'one on-premise server holds everything, reachable at goatfarm.local over the farm wifi. the cloud is never in the path, because rural power and internet are not something to depend on.' },
			{ label: 'two doors, one system', detail: 'admins log in for the full dashboard to register goats, transfer pens, print tags and read alerts. field workers just scan and log a quick health note, no account needed.' },
			{ label: 'inbreeding check on every transfer', detail: 'moving a goat walks its lineage and flags whether the pen already holds close relatives, then warns the admin and lets them decide. it advises, it never blocks.' },
			{ label: 'health that surfaces itself', detail: 'each vaccination records its next due date, and an alerts feed lists overdue and due-soon goats, so a missed shot gets caught instead of forgotten.' },
			{ label: 'nothing is ever deleted', detail: 'a goat is marked sold, deceased or quarantined, never removed, so its full history and lineage stay intact for the herd records.' }
		],
		outcomes: ['one on-premise server, zero cloud for the core', 'works on any phone on the farm wifi'],
		stack: ['django', 'postgres', 'react', 'docker'],
		schematic: ['qr tag', 'phone browser', 'django api', 'postgres'],
		github: 'https://github.com/adxoxo/GoatMonitoring',
		live: '',
		loom: ''
	},
	{
		id: 'grece', title: 'grece hydroponics', cluster: 'embedded', status: 'featured', year: '2026', x: 66, y: 66,
		summary:
			'an automated nutrient film hydroponics setup. a raspberry pi and an arduino hold water flow, lighting, and nutrient dosing steady, while ph, ec, temperature and humidity stream to a django api you can watch and adjust from anywhere.',
		why:
			'i wanted a hydroponics setup that holds the right conditions on its own and lets me watch and tune it from anywhere, instead of checking the water by hand every day. so i split it the way embedded work should: the arduino handles the real-time hardware, and a raspberry pi runs the logic, the history and the api.',
		features: [
			{ label: 'arduino runs the hardware, the pi runs the logic', detail: 'the arduino reads the sensors and drives the pumps, lights and dosing relays in real time, then streams readings to a raspberry pi over serial. the pi holds the control logic, the database and the api.' },
			{ label: 'holds ph, ec, temp and humidity in range', detail: 'ph, ec, water temperature and humidity are read continuously, and the system manages water flow, lighting and nutrient dosing to keep the nutrient film in the right band without someone standing over it.' },
			{ label: 'watch and tune it from anywhere', detail: 'a django rest api exposes live readings and settings, so you can check the setup and adjust targets remotely instead of walking to the tank.' },
			{ label: 'every reading logged', detail: 'sensor data is stored over time, so you can see how conditions moved across a grow and set the targets from real history instead of guesswork.' },
			{ label: 'thresholds that alert', detail: 'set a safe range per variable and anything outside it is flagged, so a bad ph or ec swing is caught early instead of after the plants suffer.' }
		],
		outcomes: ['real-time monitoring and remote control', 'every reading logged for later tuning'],
		stack: ['raspberry pi', 'arduino', 'python', 'django', 'c++'],
		schematic: ['sensors', 'arduino', 'raspberry pi', 'django api'],
		github: 'https://github.com/adxoxo/GRECE-Hydroponics-Monitoring-',
		live: '',
		loom: ''
	},
	{
		id: 'standup', title: 'standup dashboard', cluster: 'fullstack', status: 'archive', year: '2026', x: 87, y: 31,
		summary:
			'a single-screen github activity dashboard that answers one question: what is on my plate today. open prs, assigned issues, an activity streak and per-repo health, with day-over-day deltas.',
		features: [],
		outcomes: ['every section fails independently', 'deltas are real history, not in-memory guesses'],
		stack: ['fastapi', 'react', 'recharts', 'sqlite'],
		schematic: ['browser', 'fastapi', 'github api'],
		github: 'https://github.com/adxoxo/GitDashboard',
		live: '',
		loom: ''
	},
	{
		id: 'almanac', title: 'almanac', cluster: 'fullstack', status: 'archive', year: '2026', x: 78, y: 16,
		summary:
			'a daily-ops dashboard for one person. tasks, habits, goals and fasting in one place, and a timetable that regenerates as the day moves instead of a fixed plan you abandon by 10am.',
		why:
			'every planner i tried assumed my day runs on a fixed schedule. mine does not. so i built one where the plan reflows around what actually happened, and the only thing i have to do is tell it what changed.',
		features: [
			{ label: 'the schedule rebuilds itself', detail: 'tasks, habits and fixed anchors are laid into the day as one pass. when something slips, the rest of the day is regenerated around it rather than left stale.' },
			{ label: 'urgency is computed, not typed', detail: 'each task carries a deadline and an importance, and the order comes from those two on an eisenhower split. nothing has to be dragged into priority by hand.' },
			{ label: 'habits and goals in the same plan', detail: 'a habit is not a separate checklist, it competes for the same hours as everything else, so the day you see is the day you actually have.' },
			{ label: 'one user, no sharing surface', detail: 'built for a single account on purpose. no teams, no invites, no permission model, which keeps the whole thing small enough to change in an evening.' }
		],
		outcomes: ['the day replans itself instead of going stale', 'runs on cloudflare pages with supabase, no server to manage'],
		stack: ['sveltekit', 'supabase', 'cloudflare', 'typescript'],
		schematic: ['pwa', 'cloudflare', 'supabase'],
		github: 'https://github.com/adxoxo/almanac',
		live: 'https://almanac.aquryu.space',
		loom: ''
	},
	{
		id: 'asacafe', title: 'asa cafe', cluster: 'fullstack', status: 'archive', year: '2026', x: 57, y: 30,
		summary:
			'a cafe directory for davao city, rebuilt as a mobile-first pwa. browsing, search and the map are fully open with no account. saving, commenting and adding a cafe are the only things behind a login.',
		why:
			'the first version asked for an account before it showed you anything, which is backwards for a directory. the rewrite gives everything away on the first tap and only asks who you are when you want to leave something behind.',
		features: [
			{ label: 'no account to look around', detail: 'home, discover, cafe detail and the map all render for a guest. the login only appears at the moment you try to save, comment or add.' },
			{ label: 'gated in two places, not one', detail: 'the client redirects to login for the actions that need it, and row-level security enforces the same rule on the database, so the gate holds even if the ui is bypassed.' },
			{ label: 'only the anon key ships', detail: 'the service key stays server-side and out of git. the browser bundle carries the public anon key and nothing else.' }
		],
		outcomes: ['browsing works with no account at all', 'live on cloudflare pages with supabase behind it'],
		stack: ['sveltekit', 'supabase', 'cloudflare', 'typescript'],
		schematic: ['pwa', 'cloudflare', 'supabase'],
		github: 'https://github.com/adxoxo/asa-cafe-mobile',
		live: 'https://cafe.aquryu.space',
		loom: ''
	},
	{
		id: 'portfolio', title: 'this site', cluster: 'fullstack', status: 'archive', year: '2026', x: 88, y: 48,
		summary:
			'the site you are reading. one page in two keys: a light editorial read, and a dark node graph of every project wired cluster by cluster. the header control wipes between them, and a partial drag gives you a partial reveal.',
		features: [],
		outcomes: ['the browser never calls github, repos sync server-side and cache', 'content is editable without a deploy'],
		stack: ['sveltekit', 'supabase', 'cloudflare', 'typescript'],
		schematic: ['sveltekit', 'supabase', 'cloudflare'],
		github: 'https://github.com/adxoxo/adam-portfolio',
		live: '',
		loom: ''
	},
	{
		id: 'social', title: 'social publisher', cluster: 'automation', status: 'archive', year: '2026', x: 30, y: 90,
		summary:
			'a two-track publisher for threads and linkedin. it drafts in the right register for each account, checks the draft against a stored voice profile, and a cron job ships whatever is approved in the queue.',
		features: [],
		outcomes: ['two registers from one pipeline, no copy reused between them', 'nothing publishes until it passes the voice check'],
		stack: ['python', 'deepseek', 'cron'],
		schematic: ['plan', 'voice check', 'queue', 'cron'],
		github: '',
		live: '',
		loom: ''
	},
	{
		id: 'moajump', title: 'moa jump', cluster: 'fullstack', status: 'featured', year: '2026', x: 60, y: 42,
		summary:
			'a k-pop themed vertical platformer built with phaser 3. three worlds, one target score, and it runs fully offline with no cdn and no backend.',
		features: [],
		outcomes: ['plays on keyboard, touch and tilt', 'static files, hosts anywhere'],
		stack: ['phaser 3', 'javascript', 'gsap'],
		schematic: ['phaser', 'static files', 'github pages'],
		github: 'https://github.com/adxoxo/moa-jump',
		live: '',
		loom: ''
	},
	{
		id: 'moisture', title: 'moisture sensor', cluster: 'embedded', status: 'archive', year: '2025', x: 88, y: 66,
		summary:
			'a diy device that measures the moisture content of rough rice grains over an esp32 and a serial link. built cheap and replaceable, on off-the-shelf parts, as the core of a thesis.',
		features: [],
		outcomes: ['helps farmers judge grain readiness for storage', 'built to be replicated and adapted'],
		stack: ['esp32', 'c++', 'serial'],
		schematic: ['esp32', 'serial', 'readout'],
		github: 'https://github.com/adxoxo/MoistureSensor',
		live: '',
		loom: ''
	},
	{
		id: 'smartpot', title: 'smart pot', cluster: 'embedded', status: 'archive', year: '2023', x: 76, y: 87,
		summary:
			'a pot that reads light, temperature, humidity and soil moisture, then reports the plant\'s health to a web and mobile view.',
		features: [],
		outcomes: ['four sensors, one health status', 'readings served over a rest api'],
		stack: ['esp32', 'sensors', 'django'],
		schematic: ['sensors', 'esp32', 'django rest'],
		github: 'https://github.com/adxoxo/SmartPot',
		live: '',
		loom: ''
	},
	{
		id: 'carwash', title: 'invoice automation', cluster: 'automation', status: 'archive', year: '2026', x: 13, y: 85,
		summary:
			'an automation for a car detailing client that turns finished jobs into invoices and follow-ups that send themselves, so the owner stops chasing paperwork after hours.',
		features: [],
		outcomes: ['invoices and reminders sent automatically', 'the owner gets the evening back'],
		stack: ['n8n', 'webhooks', 'email'],
		schematic: ['job done', 'n8n', 'invoice + follow-up'],
		github: '',
		live: '',
		loom: ''
	}
];

// Every project wires to its own cluster hub; hubs wire to the center. So the map
// only ever connects a project to its own cluster: ai to ai, full-stack to full-stack.
export const CONNECTIONS: [string, string][] = [
	...PROJECTS.map((p) => [p.id, `hub_${p.cluster}`] as [string, string]),
	['hub_ai', 'center'],
	['hub_fullstack', 'center'],
	['hub_embedded', 'center'],
	['hub_automation', 'center']
];

// Build the map wiring for any project list: each project to its cluster hub,
// each hub to the center. Keeps the graph cluster-coherent (ai to ai, etc.).
export function buildConnections(list: Pick<Project, 'id' | 'cluster'>[]): [string, string][] {
	return [
		...list.map((p) => [p.id, `hub_${p.cluster}`] as [string, string]),
		['hub_ai', 'center'],
		['hub_fullstack', 'center'],
		['hub_embedded', 'center'],
		['hub_automation', 'center']
	];
}

export const featured = (list: Project[] = PROJECTS) => list.filter((p) => p.status === 'featured');
export const archived = (list: Project[] = PROJECTS) => list.filter((p) => p.status === 'archive');
