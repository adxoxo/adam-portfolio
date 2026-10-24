import type { RequestHandler } from '@qwik.dev/router';
import { CALENDLY_URL, EMAIL, SITE_URL } from '~/components/site/state';
import { JOBS } from '~/components/site/Experience';
import { CAPABILITIES, STACK_DISPLAY } from '~/components/site/About';
import { present } from '~/lib/data/presentation';
import { SOCIALS } from '~/lib/data/socials';
import { FEATURED_PROJECT_SLUGS, SITE_SUMMARY, SITE_UPDATED, getProjectSeo, projectPath } from '~/lib/seo';
import { loadPublicProjects } from '~/lib/server/projects';

// A plain-text guide to the site for AI assistants and answer engines (llmstxt.org).
// Built from the same public rows as the home page and the sitemap, so it never lists
// a hidden project or an owner field.
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

const serveLlms: RequestHandler = async (event) => {
	const { projects } = await loadPublicProjects(event);
	const all = present(projects).all;
	const cases = FEATURED_PROJECT_SLUGS.flatMap((slug) => {
		const project = all.find((p) => p.id === slug && p.selected && p.demo);
		const seo = project && getProjectSeo(project);
		return project && seo ? [{ project, seo }] : [];
	});
	const caseIds = new Set(cases.map((c) => c.project.id));
	const others = all.filter((p) => !caseIds.has(p.id) && p.summary);

	const lines = [
		'# Adam Scott Gemenez',
		'',
		`> ${SITE_SUMMARY}`,
		'',
		`Portfolio: ${SITE_URL}/`,
		`Updated: ${SITE_UPDATED}`,
		'',
		'## Experience',
		'',
		...JOBS.map((job) => `- ${job.name}: ${job.role} (${job.dates}${job.current ? ', current' : ''})${job.text ? `. ${job.text}` : ''}`),
		'',
		'## Case studies',
		'',
		...cases.map(({ project, seo }) => `- [${project.title}](${SITE_URL}${projectPath(seo.slug)}): ${oneLine(seo.metaDescription)}`),
		'',
		'## Other projects',
		'',
		...others.map((p) => `- ${p.title}${p.year ? ` (${p.year})` : ''}: ${oneLine(sentence(p.summary))}`),
		'',
		'## Capabilities',
		'',
		...CAPABILITIES.map((c) => `- ${c.title}: ${c.desc}`),
		'',
		'## Stack',
		'',
		...STACK_DISPLAY.map((g) => `- ${g.label}: ${g.items.join(', ')}`),
		'',
		'## Contact',
		'',
		`- Email: ${EMAIL}`,
		`- Book a call: ${CALENDLY_URL}`,
		...SOCIALS.filter((s) => !s.email).map((s) => `- ${sentence(s.name)}: ${s.url}`),
		'',
		'## Pages',
		'',
		`- [Privacy](${SITE_URL}/privacy)`,
		`- [Accessibility](${SITE_URL}/accessibility)`,
		`- [Sitemap](${SITE_URL}/sitemap.xml)`,
		''
	];
	throw event.send(
		new Response(event.method === 'HEAD' ? null : lines.join('\n'), {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'public, max-age=300'
			}
		})
	);
};

export const onGet = serveLlms;
export const onHead = serveLlms;
