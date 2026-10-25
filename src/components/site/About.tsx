import { component$, useContext } from '@qwik.dev/core';
import { STACK } from '~/lib/data/services';
import { techIcon } from '~/lib/data/tech';
import { INTEGRATION_GROUPS } from '~/lib/data/integrations';
import type { ViewProject } from '~/lib/data/presentation';
import { ProjectsCtx, SiteStateCtx } from './state';
import { openProject } from './runtime/dialogs';

// Display copy for the capabilities and stack names; the stack keys stay the data keys.
export const CAPABILITIES = [
	{ title: 'Full-stack development', desc: 'End-to-end app development, from the database to the interface.' },
	{ title: 'AI engineering and automation', desc: 'LLM APIs, RAG systems, MCP tools, and agents wired into real products.' },
	{ title: 'CRM, dashboards and cloud', desc: 'CRM builds, payment workflows, dashboards, and APIs that connect business systems.' },
	{ title: 'Embedded engineering', desc: 'Firmware, sensors, and IoT devices that talk to the web.' }
] as const;

const GROUP: Record<string, string> = { 'automation and infra': 'Automation & cloud', 'ai and mcp': 'AI & MCP', 'business apis': 'Business APIs' };
const NAME: Record<string, string> = {
	python: 'Python',
	javascript: 'JavaScript',
	typescript: 'TypeScript',
	react: 'React',
	svelte: 'Svelte',
	'next.js': 'Next.js',
	angular: 'Angular',
	django: 'Django',
	fastapi: 'FastAPI',
	'node.js': 'Node.js',
	'mcp servers': 'MCP servers',
	claude: 'Claude',
	groq: 'Groq',
	deepseek: 'DeepSeek',
	ollama: 'Ollama',
	'aws bedrock': 'AWS Bedrock',
	mollie: 'Mollie',
	stripe: 'Stripe',
	hubspot: 'HubSpot',
	yousign: 'Yousign',
	everbill: 'everbill',
	'zoho books': 'Zoho Books',
	brevo: 'Brevo',
	n8n: 'n8n',
	supabase: 'Supabase',
	cloudflare: 'Cloudflare',
	docker: 'Docker',
	esp32: 'ESP32',
	stm32: 'STM32',
	arduino: 'Arduino',
	'raspberry pi': 'Raspberry Pi',
	'c++': 'C++',
	figma: 'Figma',
	'google stitch': 'Google Stitch'
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The stack with the group and tool names the page shows. */
export const STACK_DISPLAY = STACK.map((g) => ({ label: GROUP[g.label] ?? cap(g.label), items: g.items.map((item) => NAME[item] ?? cap(item)) }));

const IntegrationOverview = component$(() => {
	const state = useContext(SiteStateCtx);
	const projects = useContext(ProjectsCtx);
	const groups = INTEGRATION_GROUPS.map((group) => ({
		...group,
		projects: group.projectIds.map((id) => projects.list.find((project) => project.id === id)).filter((project): project is ViewProject => !!project)
	})).filter((group) => group.projects.length > 0);

	if (!groups.length) return null;
	return (
		<section class="integration-proof" id="integrations" aria-labelledby="integration-h">
			<h3 class="eyebrow" id="integration-h">APIs, LLMs &amp; MCP in the work</h3>
			<ul class="integration-list">
				{groups.map((group) => (
					<li class="integration-item" key={group.id}>
						<h4>{group.title}</h4>
						<p>{group.description}</p>
						<div class="integration-projects">
							{group.projects.map((project) => {
								const openerId = `integration-${group.id}-${project.id}`;
								return <button class="text-link" type="button" key={project.id} id={openerId} data-integration-project={project.id} aria-haspopup="dialog" onClick$={() => openProject(state, project.id, openerId)}>{project.title}<span aria-hidden="true">↗</span></button>;
							})}
						</div>
					</li>
					))}
			</ul>
		</section>
	);
});

/** What Adam does and the stack he builds with. */
export const About = component$(() => (
	<section class="section about home-sec" id="about" aria-labelledby="about-h">
		<div class="wrap wrap--narrow">
			<p class="eyebrow">02 / Capabilities</p>
			<h2 id="about-h">From the database to the device.</h2>
			<ol class="rows">
				{CAPABILITIES.map((s, i) => (
					<li class="row" key={s.title}>
						<span class="n" aria-hidden="true">
							{String(i + 1).padStart(2, '0')}
						</span>
						<div>
							<h3>{s.title}</h3>
							<p>{s.desc}</p>
						</div>
					</li>
				))}
			</ol>
			<IntegrationOverview />
			<div class="stack">
				<p class="eyebrow">The stack</p>
				<div class="groups" role="group" aria-label="Tools Adam builds with">
					{STACK.map((g) => (
						<div class="group" key={g.label}>
							<h3 class="eyebrow">{GROUP[g.label] ?? cap(g.label)}</h3>
							<ul>
								{g.items.map((item) => {
									const src = techIcon(item);
									return (
										<li key={item}>
											{src ? <img src={src} alt="" width={24} height={24} loading="lazy" /> : <span class="ic-fb" aria-hidden="true" />}
											<span>{NAME[item] ?? cap(item)}</span>
										</li>
									);
								})}
							</ul>
						</div>
					))}
				</div>
			</div>
		</div>
	</section>
));
