// Approved content for the public site (design v2, 2026-09-14): five services,
// fifteen projects, the two sourced case studies, the hero chat sample and the
// contact links. This is the source of truth for copy. The Supabase `projects`
// table only overlays media and links on top of it (see merge.ts), so the
// admin keeps managing loom ids, covers, live and repo links without being able
// to rename or re-describe an approved project.

export type ServiceId = 'websites' | 'ai' | 'automation' | 'apps' | 'devices';

export interface Service {
	id: ServiceId;
	title: string;
	short: string;
	who: string;
	desc: string;
	long: string;
}

// One media item per project. Anything not supplied renders as an honest
// "demo coming soon" placeholder with the same aspect ratio. Image and video
// sources are plain urls: a file dropped into static/portfolio-media/ is
// referenced as '/portfolio-media/<file>'.
export type Media =
	| { kind: 'illustration'; variant: 'site' | 'invoice'; caption: string }
	| { kind: 'image'; src: string; alt: string; caption?: string }
	| { kind: 'video'; src: string; poster?: string; caption?: string }
	| { kind: 'embed'; provider: 'loom'; id: string; title: string; caption?: string };

export interface Project {
	id: string;
	service: ServiceId;
	title: string;
	tag?: string;
	kind: string;
	year: string;
	role: string;
	context: string;
	summary: string;
	problem: string;
	does: string;
	outcomes: string[];
	// the internal write-up and wiring path are not part of the public content
	// module; only the stack and the source links ship to the client
	stack: string[];
	github: string;
	live?: string; // hosted url, when there is one (overlaid from the database)
	media?: Media;
	// a code-native workflow diagram (WorkflowDiagram.svelte); separate from the
	// media slot so a screenshot or video can be added later without hiding it
	flow?: FlowVariant;
	// shown under a case study that was written from the project's source
	provenance?: string;
}
export type FlowVariant = 'enquiry' | 'booking';

export const SERVICES: Service[] = [
	{
		id: 'websites',
		title: 'websites & landing pages',
		short: 'websites',
		who: 'for a business that needs a page that works, not a brochure.',
		desc: 'pages that explain the offer in seconds and capture the lead into a list, on a phone, with the follow-up already wired.',
		long: 'a website is only useful if it brings in a conversation. these builds put one clear offer on the page, collect the lead into a real list, and start the follow-up automatically.'
	},
	{
		id: 'ai',
		title: 'ai tools & assistants',
		short: 'ai assistants',
		who: 'for a business that answers the same questions and sorts the same messages every day.',
		desc: 'assistants that answer from your own information, qualify an enquiry, and sort what comes in before a person reads it.',
		long: 'the useful kind of ai in a small business is narrow: answer from your documents, score an enquiry, tag a message. these projects show each of those patterns running.'
	},
	{
		id: 'automation',
		title: 'business automation',
		short: 'automation',
		who: 'for a business where the paperwork after a job takes longer than the job.',
		desc: 'the invoice, the offer, the reminder, the task for the team: done by the system the moment the trigger happens.',
		long: 'automations connect the tools you already use. a finished job becomes an invoice, a chat message becomes an offer, a booking becomes a signed and paid job. no new software to learn.'
	},
	{
		id: 'apps',
		title: 'custom apps & dashboards',
		short: 'custom apps',
		who: 'for a business whose process does not fit an off-the-shelf app.',
		desc: 'small, focused applications for the part of your operation that spreadsheets and generic tools cannot hold.',
		long: 'when the process is specific, a small custom app is cheaper to live with than a bent generic one. these are apps built for one job each, some of them for my own use.'
	},
	{
		id: 'devices',
		title: 'connected devices',
		short: 'devices',
		who: 'for a farm, a workshop or a grow room that needs numbers, not guesses.',
		desc: 'sensors and controllers that measure, act on their own, and report to a web dashboard.',
		long: 'the physical side: microcontrollers reading sensors, driving pumps and relays, and streaming the readings to a web api you can watch from anywhere.'
	}
];

export const PROJECTS: Project[] = [
	{
		id: 'video_landing', service: 'websites', title: 'video-first landing page', kind: 'web build', year: '2026', role: 'design and build', context: 'campaign traffic, two languages',
		summary: 'a bilingual landing page built around one video: watch, understand the offer, leave your details. it writes into the same lead table as the quiz funnel, so both funnels land in one place.',
		problem: 'the page had to explain an offer fast, on a phone, in two languages, and turn a viewer into a contact without a person in the loop.',
		does: 'one video sits above the fold and a short form below it. each lead goes into the shared lead table, the follow-up email starts automatically, and the chat channel picks up from there.',
		outcomes: ['leads from both funnels land in one table', 'follow-up starts the minute a form is sent', 'one page, two languages'],
		stack: ['javascript', 'cloudflare', 'supabase', 'brevo', 'manychat', 'playwright'], github: '',
		media: { kind: 'illustration', variant: 'site', caption: 'illustration of the page layout and the lead flow behind it, not a screenshot' }
	},
	{
		id: 'this_site', service: 'websites', title: 'this portfolio', kind: 'this site', year: '2026', role: 'design and build', context: 'personal site',
		summary: 'the site you are looking at. the case studies are typed content, and a small database adds the walkthrough videos, live links and repositories, so a new recording is one edit in the admin, not a redeploy.',
		problem: 'keep a portfolio current without touching code every time a recording, a live link or a repository changes.',
		does: 'the overview, the project index and the map render from one content module. an admin page edits the database rows that supply each project\'s media and links, and the contact form writes every lead to the same database.',
		outcomes: ['a new walkthrough or live link is one admin edit', 'hosted on cloudflare, no server to manage', 'the same content feeds the overview and the map'],
		stack: ['sveltekit', 'supabase', 'cloudflare', 'typescript'], github: 'https://github.com/adxoxo/adam-portfolio'
	},
	{
		id: 'quiz_funnel', service: 'websites', title: 'bilingual quiz funnel', kind: 'web build', year: '2026', role: 'design and build', context: 'two-language audience',
		summary: 'a twenty-question quiz in two languages that scores a visitor into a profile and mails back a personalised report. the model only breaks a tie, so the result stays explainable.',
		problem: 'turn a cold visitor into a warm lead by asking a few questions instead of showing a wall of text, and give them a result they can trust.',
		does: 'a step-by-step quiz in two languages. the answers are scored into a profile by fixed rules, the visitor receives a personalised report by email, and the follow-up starts from there.',
		outcomes: ['each visitor leaves with a personal profile and report', 'the scoring is rule-based and explainable; the model only breaks a tie', 'one funnel, two languages'],
		stack: ['javascript', 'netlify', 'supabase', 'aws bedrock', 'brevo', 'playwright'], github: ''
	},

	{
		id: 'aq_chatbot', service: 'ai', title: 'aq chatbot', tag: 'website assistant that books calls', kind: 'product prototype', year: '2026', role: 'design, build, everything', context: 'reusable for many clients',
		summary: 'a website chatbot that talks to a visitor, works out how serious they are, and moves the hot ones straight to a booked call. build it once, set it up per client.',
		problem: 'a contact form waits. a visitor with a real need lands on a site, reads, hesitates and leaves, and the business never learns how serious they were.',
		does: 'a chat window talks to the visitor and, on every message, scores how ready they are to buy. it moves from greeting to qualifying to closing on its own. hot leads get a booking card, warm leads leave an email, cold leads get a polite exit. the hot lead is sent to whatever tools the client already uses.',
		outcomes: ['books a call inside the chat, no form', 'three lead paths, none lost: hot, warm, cold', 'set up for a new client by changing one configuration record, no rebuild', 'can be demonstrated for free before any paid service is switched on'],
		stack: ['react', 'fastapi', 'supabase', 'groq', 'n8n', 'cloudflare'], github: 'https://github.com/adxoxo/chatbot-closer',
		media: { kind: 'embed', provider: 'loom', id: 'a3f34d52e411418a850961601e9de768', title: 'aq chatbot walkthrough on loom', caption: 'recorded walkthrough of the chatbot, loads from loom only when you ask for it' }
	},
	{
		id: 'grimoire', service: 'ai', title: 'grimoire', tag: 'private knowledge assistant', kind: 'personal tool, past project', year: '2026', role: 'design and build', context: 'own machine, offline',
		summary: "a private knowledge source for ai assistants. it collected documents and past work, and gave each assistant only the information relevant to the project at hand. everything ran on the owner's machine.",
		problem: 'ai assistants forget everything between sessions and repeat work. notes and documents were spread across files with no shared memory. for a business, the same pattern is a private assistant that answers from your own documents.',
		does: 'it collects documents and past sessions into one local store, knows which project each piece belongs to, and returns only the relevant parts when an assistant asks. nothing leaves the machine.',
		outcomes: ['one shared memory for every ai assistant, project by project', 'answers drawn from your own documents, not the open internet', "runs on the owner's machine, nothing is uploaded"],
		stack: ['python', 'sqlite-vec', 'fastmcp', 'ollama', 'opentelemetry'], github: 'https://github.com/adxoxo/grimoire',
		media: { kind: 'embed', provider: 'loom', id: '93556fc863834e21a2ae18e7fddf3235', title: 'grimoire walkthrough on loom', caption: 'recorded walkthrough of grimoire, loads from loom only when you ask for it' }
	},
	{
		id: 'dm_triage', service: 'ai', title: 'dm triage system', kind: 'discovery and architecture', year: '2026', role: 'discovery and design', context: 'social inbox',
		summary: 'a discovery and architecture pass on sorting inbound social messages before a person reads them. phase one can be built today; phase two waits on a platform plan that allows outbound requests.',
		problem: 'a busy inbox where sales questions, spam and small talk all look the same until someone reads every one.',
		does: 'the designed flow: each incoming message is received, tagged by intent, and logged in one table. real enquiries get a link to a short form to book or brief, the rest get a polite reply. phase one covers intake and tagging; phase two, the outbound replies, depends on the platform plan.',
		outcomes: ['a scoped, two-phase design with the platform limits named up front', 'phase one is buildable today on the tools the business already uses'],
		stack: ['manychat', 'claude api', 'supabase', 'tally'], github: ''
	},

	{
		id: 'booking_invoice', service: 'automation', title: 'automated booking sales flow', tag: 'from a booked workshop to signed, paid and invoiced', kind: 'client automation', year: '2026', role: 'design and build', context: 'workshop business, austria',
		summary: 'a customer-facing wizard for a workshop business. after the closing call the customer books a workshop date, enters the company details, signs the offer, pays, and receives the invoice and the booking confirmation, with the crm and the calendar updated on the way. the team only sends the first link.',
		problem: 'after every closing call the team sent the offer, chased the signature, sent a payment link, wrote the invoice and confirmed the date by hand, in the right order, for every customer.',
		does: 'one guided flow in german or english. the customer picks an online or in-person workshop date, enters the company details, signs the generated offer digitally and pays online. after the payment is confirmed the customer receives the invoice with its pdf and the booking confirmation by email, and the crm and the calendar are updated for the team. an unfinished step can be resumed later and gets reminders.',
		outcomes: ['the customer completes booking, signature and payment alone', 'the invoice exists only after the payment is confirmed, never before', 'invoice pdf and booking confirmation arrive by email without anyone sending them', 'crm stage and calendar follow the payment on their own', 'german and english, resumable, with reminders'],
		stack: ['cloudflare workers', 'supabase', 'yousign', 'mollie', 'everbill', 'hubspot', 'brevo', 'microsoft 365 calendar'], github: '',
		flow: 'booking', provenance: 'workflow based on the project implementation.'
	},
	{
		id: 'invoice_automation', service: 'automation', title: 'invoice automation', kind: 'client automation', year: '2026', role: 'build', context: 'car detailing business',
		summary: 'an automation for a car detailing client that turns finished jobs into invoices and follow-ups that send themselves, so the owner stops chasing paperwork after hours.',
		problem: 'finished jobs piled up as evening paperwork: write the invoice, send it, remember to chase it.',
		does: 'when a job is marked done, the invoice is built and emailed to the customer, and the follow-up is scheduled from the same workflow. nothing to open, nothing to remember.',
		outcomes: ['invoices and reminders sent automatically', 'the owner gets the evening back'],
		stack: ['n8n', 'webhooks', 'email'], github: '',
		media: { kind: 'illustration', variant: 'invoice', caption: 'illustration of the job-to-invoice steps, not a screenshot of the n8n workflow' }
	},
	{
		id: 'whatsapp_offer', service: 'automation', title: 'sales flow automation', tag: 'whatsapp enquiry to a proposal or a technician booking', kind: 'client automation', year: '2026', role: 'design and build', context: 'pv and battery installer, austria',
		summary: 'a whatsapp-first sales process for a solar and battery installer. an enquiry gets a whatsapp message and a form, the answers and photos are checked against the installer\'s rules, a person approves the photos, and eligible cases receive a branded proposal by whatsapp. cases that need a technician receive a booking link. the team\'s board follows every step.',
		problem: 'every enquiry was a manual conversation: chase the details, judge the photos, write the offer, remember to follow up, and keep the board current by hand.',
		does: 'a web enquiry gets a whatsapp intro with a link to the right form. the form collects the project details and photos. a person checks the photos, and eligible cases receive a branded proposal pdf as a whatsapp link and are then asked for preferred installation dates. a case that needs a technician receives a booking link instead, and the customer picks the slot. follow-ups, resume links and an escalation to a person happen without anyone remembering them.',
		outcomes: ['eligible enquiries receive a proposal without anyone writing it', 'photos are always approved by a person before a price goes out', 'a case that needs a technician receives a booking link instead of a wrong offer', 'follow-ups, resume links and an escalation to a person happen on their own', 'the team\'s board and the lead history stay in step with every stage'],
		stack: ['node', 'railway', 'supabase', 'timelinesai (whatsapp)', 'tally', 'asana', 'calendly', 'pdf-lib', 'claude api'], github: '',
		flow: 'enquiry', provenance: 'workflow based on the project implementation.'
	},

	{
		id: 'vault', service: 'apps', title: 'aquryu vault', tag: 'personal money app', kind: 'personal app', year: '2026', role: 'design and build', context: 'money across wallets and currencies',
		summary: 'a personal money app for the phone: log income, expenses and transfers across several wallets and see one clear picture of total money, in two currencies.',
		problem: 'every added tap is a logged expense that never happens. logging money had to take three taps or fewer, or a voice note.',
		does: 'the app opens on a quick-log screen with the total balance. you type or speak an entry and it becomes a transaction with a one-line confirm. income in usd is converted at the official daily rate and stored that way, so history never changes later. it works offline and syncs when the connection returns.',
		outcomes: ['three taps or a voice note to log money', 'balances that never drift, in two currencies', 'works offline on a mid-range phone'],
		stack: ['sveltekit', 'supabase', 'cloudflare', 'groq', 'typescript'], github: 'https://github.com/adxoxo/aquryu-vault'
	},
	{
		id: 'goat', service: 'apps', title: 'goatedtracking', tag: 'goat farm system', kind: 'farm management system', year: '2026', role: 'design and build', context: 'small goat farm, philippines',
		summary: 'a monitoring system for a small goat farm. every goat wears a qr ear tag. scan it on the farm wifi and its whole profile opens: health records, vaccinations, pen, lineage. the internet is optional.',
		problem: 'the farm is where the internet drops and the power cuts. a field worker needs to see a goat in one scan, the office needs a full dashboard.',
		does: 'one small server on the farm wifi. registering a goat prints a qr tag, scanning it opens the profile in any phone browser with no login. the office gets the dashboard: register, transfer pens, print tags, read alerts. transfers warn about close relatives, vaccinations surface when due, and nothing is ever deleted.',
		outcomes: ['one scan, whole goat profile, no app to install', 'works with the internet off', 'missed vaccinations get caught, not forgotten', 'inbreeding check on every pen transfer'],
		stack: ['django', 'postgres', 'react', 'docker'], github: 'https://github.com/adxoxo/GoatMonitoring'
	},
	{
		id: 'standup', service: 'apps', title: 'standup dashboard', kind: 'personal tool', year: '2026', role: 'design and build', context: 'github activity, one screen',
		summary: 'a single-screen dashboard that answers one question: what is on my plate today. open pull requests, assigned issues, an activity streak and per-project health, with day-over-day changes.',
		problem: 'start the day by opening six tabs, or open one screen that already knows.',
		does: 'it pulls your github activity every day and keeps a history, so the numbers show what changed since yesterday. each section loads on its own, so if one fails the rest still show.',
		outcomes: ['every section fails independently', 'changes are real history, not guesses'],
		stack: ['fastapi', 'react', 'recharts', 'sqlite'], github: 'https://github.com/adxoxo/GitDashboard'
	},

	{
		id: 'grece', service: 'devices', title: 'grece hydroponics', tag: 'automated grow system', kind: 'device build', year: '2026', role: 'hardware, firmware, api', context: 'nutrient film hydroponics',
		summary: 'an automated hydroponics setup that holds water flow, lighting and nutrient dosing steady on its own, and shows live readings on a web dashboard you can adjust from anywhere.',
		problem: 'a grow that holds the right conditions on its own, and can be checked and tuned without walking to the tank.',
		does: 'sensors read acidity, nutrient strength, water temperature and humidity continuously. the controller runs the pumps, lights and dosing to keep everything in range, logs every reading, and shows live numbers and adjustable targets on a web dashboard. anything outside a safe range is flagged.',
		outcomes: ['real-time monitoring and remote control', 'every reading logged, so targets come from history not guesswork', 'thresholds that alert before the plants suffer'],
		stack: ['raspberry pi', 'arduino', 'python', 'django', 'c++'], github: 'https://github.com/adxoxo/GRECE-Hydroponics-Monitoring-'
	},
	{
		id: 'moisture', service: 'devices', title: 'moisture sensor', tag: 'rice grain moisture meter', kind: 'thesis project', year: '2025', role: 'hardware and firmware', context: 'rice grain moisture',
		summary: 'a diy device that measures the moisture content of rough rice grains. built cheap and replaceable, on off-the-shelf parts, as the core of a thesis.',
		problem: 'farmers judge grain readiness for storage by feel. a cheap, repeatable reading changes that decision.',
		does: 'a handheld device reads the moisture of rough rice grains and shows the value on a readout. built from cheap, off-the-shelf parts so it can be rebuilt and adapted.',
		outcomes: ['helps farmers judge grain readiness for storage', 'built to be replicated and adapted'],
		stack: ['esp32', 'c++', 'serial'], github: 'https://github.com/adxoxo/MoistureSensor'
	},
	{
		id: 'smartpot', service: 'devices', title: 'smart pot', tag: 'plant health monitor', kind: 'personal device', year: '2023', role: 'hardware, firmware, api', context: 'houseplant monitoring',
		summary: "a pot that reads light, temperature, humidity and soil moisture, then reports the plant's health to a web and mobile view.",
		problem: 'four numbers a plant depends on, none of them visible.',
		does: 'the pot reads light, temperature, humidity and soil moisture, turns them into one plant health status, and shows it on a web and mobile view.',
		outcomes: ['four sensors, one health status', 'readings you can check from your phone'],
		stack: ['esp32', 'sensors', 'django'], github: 'https://github.com/adxoxo/SmartPot'
	}
];

// the two selected-work case studies on the overview, in this order. Copy is a
// shorter telling of the same project entries above.
export interface CaseStudy {
	id: string;
	kindLabel: string;
	kind: string;
	title: string;
	problem: string;
	solution: string;
	see: string;
	flow: FlowVariant;
}
export const CASES: CaseStudy[] = [
	{
		id: 'booking_invoice', kindLabel: 'business automation', kind: 'client automation, 2026', title: 'automated booking sales flow', flow: 'booking',
		problem: 'after every closing call the team sent the offer, chased the signature, sent a payment link, wrote the invoice and confirmed the date by hand.',
		solution: 'one guided wizard, in german or english: the customer books the workshop date, enters the company details, signs the offer and pays. the confirmed payment creates the invoice, emails it with the booking confirmation, and updates the crm and the calendar.',
		see: 'the customer finishes alone. the invoice appears only after the money is confirmed, and every step can be resumed, with reminders.'
	},
	{
		id: 'whatsapp_offer', kindLabel: 'business automation', kind: 'client automation, 2026', title: 'sales flow automation', flow: 'enquiry',
		problem: 'a solar and battery installer handled every enquiry by hand: chase the details, judge the photos, write the offer, remember to follow up.',
		solution: 'the enquiry gets a whatsapp message and a form. rules sort the case, a person approves the photos, and eligible cases receive a branded proposal by whatsapp, then a request for installation dates. a case that needs a technician receives a booking link instead.',
		see: 'proposals go out without anyone writing them, a person still checks every photo before a price is sent, and follow-ups, escalation and the board keep themselves current.'
	}
];

// Older ids (previous site, database rows) kept as aliases, so an old link
// still opens the right project and a database row still finds its project.
export const ALIASES: Record<string, string> = {
	tq_chatbot: 'aq_chatbot',
	carwash: 'invoice_automation',
	goatedtracking: 'goat',
	portfolio: 'this_site'
};
export function canonicalId(id: string): string {
	return ALIASES[id] ?? id;
}

// The helpers take the list to search, because the page works on the list
// returned by the server (approved content plus database media), not on the
// static PROJECTS constant. PROJECTS is the default so the layout self-check
// and the tests can call them without a server.
export function projectById(id: string, list: Project[] = PROJECTS): Project | undefined {
	const real = canonicalId(id);
	return list.find((p) => p.id === real);
}
export function serviceById(id: string): Service | undefined {
	return SERVICES.find((s) => s.id === id);
}
export function projectsOf(service: ServiceId, list: Project[] = PROJECTS): Project[] {
	return list.filter((p) => p.service === service);
}
export function isServiceId(id: string): id is ServiceId {
	return SERVICES.some((s) => s.id === id);
}

// hero chat sample: the conversation accumulates, so a later step keeps the
// earlier messages and the log scrolls inside a fixed frame
export interface ChatMessage {
	id: string;
	who: 'visitor' | 'assistant' | 'card';
	text?: string;
}
export interface ChatStep {
	label: string;
	state: string;
	score: number;
	stage: number;
	path: string;
	next: string;
	messages: number; // how many of CHAT_MESSAGES are visible at this step
}
export const CHAT_MESSAGES: ChatMessage[] = [
	{ id: 'm1', who: 'visitor', text: 'hi, do you build booking pages for a physio clinic?' },
	{ id: 'm2', who: 'assistant', text: 'yes. a booking page with reminders is a common build here. is this for a new site, or something you already run?' },
	{ id: 'm3', who: 'visitor', text: 'we have a site. about 120 bookings a month, all by phone right now.' },
	{ id: 'm4', who: 'assistant', text: 'that is a good fit. want to pick a 20 minute slot with adam to walk through it? no prep needed.' },
	{ id: 'm5', who: 'visitor', text: 'sure, thursday morning works.' },
	{ id: 'm6', who: 'card' },
	{ id: 'm7', who: 'assistant', text: 'booked. you will get a confirmation by email, and adam gets a summary of this chat.' }
];
export const CHAT_STEPS: ChatStep[] = [
	{ label: 'visitor asks', state: 'greeting', score: 2, stage: 0, path: 'not yet decided', next: 'keep the conversation going', messages: 2 },
	{ label: 'qualify', state: 'qualifying', score: 8, stage: 1, path: 'hot', next: 'offer a call slot', messages: 4 },
	{ label: 'call booked', state: 'closed', score: 9, stage: 2, path: 'hot, call booked', next: 'team notified through the n8n webhook', messages: 7 }
];

export const LINKS = {
	email: 'adamgemenez@gmail.com',
	mailto: 'mailto:adamgemenez@gmail.com?subject=project%20enquiry',
	github: 'https://github.com/adxoxo',
	linkedin: 'https://www.linkedin.com/in/adam-scott-gemenez/'
};
