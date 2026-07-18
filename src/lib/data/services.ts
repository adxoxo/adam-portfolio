// Static content for the "what i do" section: the services adam offers and the
// stack he builds with. Not a project, so it lives here rather than in Supabase.
// Voice: lowercase, dry, no em-dashes.

export interface Service {
	title: string;
	desc: string;
}

export const SERVICES: Service[] = [
	{
		title: 'full-stack development',
		desc: 'end-to-end app development, from the database to the interface.'
	},
	{
		title: 'ai engineering and automation',
		desc: 'rag systems, agents, and automations wired into real products.'
	},
	{
		title: 'crm, dashboards and cloud',
		desc: 'crm builds, dashboards, and workflows that run in the cloud.'
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
	{ label: 'frontend', items: ['react', 'svelte', 'next.js', 'angular'] },
	{ label: 'backend', items: ['django', 'fastapi', 'node.js', 'mcp servers'] },
	{ label: 'ai', items: ['claude', 'groq', 'ollama'] },
	{ label: 'automation and infra', items: ['n8n', 'supabase', 'cloudflare', 'docker'] },
	{ label: 'embedded', items: ['esp32', 'stm32', 'arduino', 'raspberry pi', 'c++'] },
	{ label: 'design', items: ['figma', 'google stitch'] }
];
