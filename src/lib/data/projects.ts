// Single source of truth for project content in the prototype/build.
// Shape mirrors the Supabase `projects` table (see BUILD-PLAN.md). When Supabase
// is wired, this static array is replaced by a query; the shape stays identical.

export type Cluster = 'ai' | 'fullstack' | 'automation' | 'embedded';
export type Status = 'featured' | 'archive' | 'hidden';

// A technical highlight shown in the detail modal under "how it works". Optional per
// project, so most projects render nothing extra and only the ones worth explaining do.
export interface Feature {
	label: string; // short lowercase title
	detail: string; // one sentence, lowercase, no em-dash
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
	x: number; // map position, %
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
		github: 'https://github.com/adxoxo/chatbot-closer'
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
		github: 'https://github.com/adxoxo/grimoire'
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
		github: 'https://github.com/adxoxo/aquryu-vault'
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
		stack: ['django', 'drf', 'postgres', 'react', 'docker'],
		schematic: ['qr tag', 'phone browser', 'django api', 'postgres'],
		github: 'https://github.com/adxoxo/GoatMonitoring'
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
		stack: ['raspberry pi', 'arduino', 'python', 'django rest', 'c++'],
		schematic: ['sensors', 'arduino', 'raspberry pi', 'django api'],
		github: 'https://github.com/adxoxo/GRECE-Hydroponics-Monitoring-'
	},
	{
		id: 'standup', title: 'standup dashboard', cluster: 'fullstack', status: 'featured', year: '2026', x: 87, y: 31,
		summary:
			'a single-screen github activity dashboard that answers one question: what is on my plate today. open prs, assigned issues, an activity streak and per-repo health, with day-over-day deltas.',
		outcomes: ['every section fails independently', 'deltas are real history, not in-memory guesses'],
		stack: ['fastapi', 'react', 'recharts', 'sqlite'],
		schematic: ['browser', 'fastapi', 'github api'],
		github: 'https://github.com/adxoxo/GitDashboard'
	},
	{
		id: 'moajump', title: 'moa jump', cluster: 'fullstack', status: 'archive', year: '2026', x: 60, y: 42,
		summary:
			'a k-pop themed vertical platformer built with phaser 3. three worlds, one target score, and it runs fully offline with no cdn and no backend.',
		outcomes: ['plays on keyboard, touch and tilt', 'static files, hosts anywhere'],
		stack: ['phaser 3', 'javascript', 'gsap'],
		schematic: ['phaser', 'static files', 'github pages'],
		github: 'https://github.com/adxoxo/moa-jump'
	},
	{
		id: 'moisture', title: 'moisture sensor', cluster: 'embedded', status: 'archive', year: '2025', x: 88, y: 66,
		summary:
			'a diy device that measures the moisture content of rough rice grains over an esp32 and a serial link. built cheap and replaceable, on off-the-shelf parts, as the core of a thesis.',
		outcomes: ['helps farmers judge grain readiness for storage', 'built to be replicated and adapted'],
		stack: ['esp32', 'c++', 'serial'],
		schematic: ['esp32', 'serial', 'readout'],
		github: 'https://github.com/adxoxo/MoistureSensor'
	},
	{
		id: 'smartpot', title: 'smart pot', cluster: 'embedded', status: 'archive', year: '2023', x: 76, y: 87,
		summary:
			"a pot that reads light, temperature, humidity and soil moisture, then reports the plant's health to a web and mobile view.",
		outcomes: ['four sensors, one health status', 'readings served over a rest api'],
		stack: ['esp32', 'sensors', 'django rest'],
		schematic: ['sensors', 'esp32', 'django rest'],
		github: 'https://github.com/adxoxo/SmartPot'
	},
	{
		id: 'carwash', title: 'invoice automation', cluster: 'automation', status: 'archive', year: '2026', x: 13, y: 85,
		summary:
			'an automation for a car detailing client that turns finished jobs into invoices and follow-ups that send themselves, so the owner stops chasing paperwork after hours.',
		outcomes: ['invoices and reminders sent automatically', 'the owner gets the evening back'],
		stack: ['n8n', 'webhooks', 'email'],
		schematic: ['job done', 'n8n', 'invoice + follow-up'],
		github: ''
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
