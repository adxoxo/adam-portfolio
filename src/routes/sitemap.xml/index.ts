import type { RequestHandler } from '@qwik.dev/router';
import { SITE_URL } from '~/components/site/state';
import { present } from '~/lib/data/presentation';
import { FEATURED_PROJECT_SLUGS, projectPath } from '~/lib/seo';
import { loadPublicProjects } from '~/lib/server/projects';

const escapeXml = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const serveSitemap: RequestHandler = async (event) => {
	const { projects } = await loadPublicProjects(event);
	const selected = new Set(present(projects).highlights.map((project) => project.id));
	const paths = [
		'/',
		'/privacy',
		'/accessibility',
		...FEATURED_PROJECT_SLUGS.filter((slug) => selected.has(slug)).map(projectPath)
	];
	const urls = paths
		.map((path) => `  <url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc><lastmod>2026-10-04</lastmod></url>`)
		.join('\n');
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	throw event.send(
		new Response(event.method === 'HEAD' ? null : body, {
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
				'Cache-Control': 'public, max-age=300'
			}
		})
	);
};

export const onGet = serveSitemap;
export const onHead = serveSitemap;
