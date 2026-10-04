import { component$, useContextProvider, useStore, useStyles$ } from '@qwik.dev/core';
import { routeLoader$, type DocumentHead } from '@qwik.dev/router';
import { ContactDialog } from '~/components/site/ContactDialog';
import { Footer } from '~/components/site/Footer';
import { Nav } from '~/components/site/Nav';
import { ProjectContent } from '~/components/site/ProjectContent';
import { SiteStateCtx, type SiteState } from '~/components/site/state';
import { present } from '~/lib/data/presentation';
import {
	buildProjectJsonLd,
	getProjectSeo,
	idForSlug,
	isFeaturedProjectSlug,
	serializeJsonLd
} from '~/lib/seo';
import { loadPublicProjects } from '~/lib/server/projects';
import styles from '~/styles/site.css?inline';

const notFound = () => new Response('Not Found', {
	status: 404,
	headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
});

export const useProject = routeLoader$(async (event) => {
	const slug = event.params.slug ?? '';
	if (!isFeaturedProjectSlug(slug)) throw event.send(notFound());
	const { projects, source } = await loadPublicProjects(event);
	const project = present(projects).highlights.find((item) => item.id === idForSlug(slug));
	if (!project) throw event.send(notFound());
	const seo = getProjectSeo(project);
	if (!seo) throw event.send(notFound());
	return { project, seo, source };
});

export default component$(() => {
	useStyles$(styles);
	const data = useProject();
	const state = useStore<SiteState>({ mode: 'site', detailId: '', returnFocus: '' });
	useContextProvider(SiteStateCtx, state);
	const { project, seo, source } = data.value;
	return (
		<div class="app" data-mode="site" data-source={source}>
			<a class="skip" href="#content">skip to content</a>
			<Nav variant="page" />
			<main class="case-preview" id="content" tabIndex={-1}>
				<nav class="case-crumb" aria-label="breadcrumb">
					<a href="/">portfolio</a><span aria-hidden="true">/</span><span>{seo.slug.replaceAll('_', ' ')}</span>
				</nav>
				<ProjectContent project={project} standalone />
				<details class="case-transcript">
					<summary>read the demo transcript</summary>
					<ol>{seo.transcript.map((cue, index) => <li key={`${index}-${cue}`}>{cue}</li>)}</ol>
				</details>
			</main>
			<Footer variant="page" />
			<ContactDialog />
		</div>
	);
});

export const head: DocumentHead = ({ resolveValue }) => {
	const { project, seo } = resolveValue(useProject);
	const jsonLd = buildProjectJsonLd(project, seo);
	return {
		title: seo.canonicalTitle,
		links: [{ rel: 'canonical', href: seo.url }],
		meta: [
			{ name: 'description', content: seo.metaDescription },
			{ name: 'robots', content: 'index, follow' },
			{ property: 'og:type', content: 'article' },
			{ property: 'og:site_name', content: 'Adam Gemenez portfolio' },
			{ property: 'og:title', content: seo.canonicalTitle },
			{ property: 'og:description', content: seo.metaDescription },
			{ property: 'og:url', content: seo.url },
			{ property: 'og:image', content: seo.video.thumbnailUrl },
			{ property: 'og:image:width', content: String(project.demo?.width ?? 1280) },
			{ property: 'og:image:height', content: String(project.demo?.height ?? 720) },
			{ property: 'og:image:alt', content: `${project.title} demo poster` },
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:title', content: seo.canonicalTitle },
			{ name: 'twitter:description', content: seo.metaDescription },
			{ name: 'twitter:image', content: seo.video.thumbnailUrl }
		],
		scripts: jsonLd ? [{ type: 'application/ld+json', script: serializeJsonLd(jsonLd) }] : []
	};
};
