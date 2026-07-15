// Static content for the "what i do" section: the services adam offers and the
// stack he builds with. Not a project, so it lives here rather than in Supabase.
// Voice: lowercase, dry, no em-dashes.

export interface Service {
	title: string;
	desc: string;
}

export const SERVICES: Service[] = [
	{
		title: 'full-stack web development',
		desc: 'web apps built end to end, from the database to the interface.'
	},
	{
		title: 'ai engineering',
		desc: 'rag systems, agents, and llm features wired into real products.'
	},
	{
		title: 'ai automation',
		desc: 'systems that quietly handle the repetitive work for you.'
	},
	{
		title: 'crm management',
		desc: 'crm builds and the pipelines that keep them fed and clean.'
	},
	{
		title: 'dashboards',
		desc: 'one screen that answers the question you keep asking.'
	},
	{
		title: 'cloud workflows',
		desc: 'pipelines and services that run in the cloud, not on your machine.'
	},
	{
		title: 'embedded engineering',
		desc: 'firmware, sensors, and iot devices that talk to the web.'
	}
];

export interface StackGroup {
	label: string;
	items: string[];
}

export const STACK: StackGroup[] = [
	{ label: 'languages', items: ['python', 'javascript', 'typescript'] },
	{ label: 'frontend', items: ['react', 'svelte', 'next.js'] },
	{ label: 'backend', items: ['django', 'rest', 'fastapi', 'mcp servers'] },
	{ label: 'ai', items: ['claude', 'groq', 'ollama'] },
	{ label: 'automation and infra', items: ['n8n', 'supabase', 'cloudflare', 'docker'] },
	{ label: 'embedded', items: ['esp32', 'arduino', 'raspberry pi', 'c++'] },
	{ label: 'design', items: ['figma', 'google stitch'] }
];
