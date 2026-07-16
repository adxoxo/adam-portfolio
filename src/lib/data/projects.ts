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
		id: 'goatedtracking', title: 'goatedtracking', cluster: 'fullstack', status: 'featured', year: '2026', x: 66, y: 13,
		summary:
			'a local-first monitoring system for a small goat farm here in the philippines. every goat wears a qr ear tag. scan it on the farm wifi and its whole profile opens: health records, vaccinations, pen, lineage. the internet is optional, not required.',
		outcomes: ['one on-premise server, zero cloud for the core', 'works on any phone on the farm wifi'],
		stack: ['django', 'drf', 'postgres', 'react', 'docker'],
		schematic: ['qr tag', 'phone browser', 'django api', 'postgres'],
		github: 'https://github.com/adxoxo/GoatMonitoring'
	},
	{
		id: 'grece', title: 'grece hydroponics', cluster: 'embedded', status: 'featured', year: '2026', x: 66, y: 66,
		summary:
			'an automated nutrient film hydroponics setup. a raspberry pi and an arduino hold water flow, lighting, and nutrient dosing steady, while ph, ec, temperature and humidity stream to a django api you can watch and adjust from anywhere.',
		outcomes: ['real-time monitoring and remote control', 'every reading logged for later tuning'],
		stack: ['raspberry pi', 'arduino', 'python', 'django rest', 'c++'],
		schematic: ['sensors', 'arduino', 'raspberry pi', 'django api'],
		github: 'https://github.com/adxoxo/GRECE-Hydroponics-Monitoring-'
	},
	{
		id: 'standup', title: 'standup dashboard', cluster: 'fullstack', status: 'archive', year: '2026', x: 87, y: 31,
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
