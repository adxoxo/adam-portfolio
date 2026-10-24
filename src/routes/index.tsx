import { component$, useContextProvider, useStore, useStyles$, useVisibleTask$ } from '@qwik.dev/core';
import { routeLoader$, type DocumentHead } from '@qwik.dev/router';
import { loadPublicProjects } from '~/lib/server/projects';
import { present } from '~/lib/data/presentation';
import styles from '~/styles/site.css?inline';
import { ProjectsCtx, SITE_URL, SiteStateCtx, type SiteState } from '~/components/site/state';
import { Nav } from '~/components/site/Nav';
import { Hero } from '~/components/site/Hero';
import { About } from '~/components/site/About';
import { Experience } from '~/components/site/Experience';
import { Footer } from '~/components/site/Footer';
import { CircuitMap } from '~/components/site/map/CircuitMap';
import { ProjectDialog } from '~/components/site/ProjectDialog';
import { ContactDialog } from '~/components/site/ContactDialog';
import { DragonIntro } from '~/components/site/DragonIntro';
import { FEATURED_PROJECT_SLUGS, SITE_SUMMARY, buildHomeJsonLd, projectPath, serializeJsonLd } from '~/lib/seo';
import { JOBS } from '~/components/site/Experience';

// Server only: reads the public CMS rows (or the 21-row snapshot) and applies
// the presentation policy. No client, key or cookie leaves this function.
export const usePortfolio = routeLoader$(async (event) => {
	const { projects, source } = await loadPublicProjects(event);
	const view = present(projects);
	return { all: view.all, source };
});

export default component$(() => {
	useStyles$(styles);
	const data = usePortfolio();
	const state = useStore<SiteState>({ mode: 'site', detailId: '', returnFocus: '' });
	useContextProvider(SiteStateCtx, state);
	useContextProvider(ProjectsCtx, { list: data.value.all });

	// Motion effects load once the page is idle; the server HTML is the static fallback.
	useVisibleTask$(
		async ({ cleanup }) => {
			const { attachHomeFx } = await import('~/components/site/runtime/fx');
			cleanup(attachHomeFx());
		},
		{ strategy: 'document-idle' }
	);

	// /#map opens the map directly (footer links from the policy pages use it)
	useVisibleTask$(
		async () => {
			if (location.hash !== '#map') return;
			const { openMapNow } = await import('~/components/site/runtime/switch');
			openMapNow(state);
		},
		{ strategy: 'document-ready' }
	);

	const all = data.value.all;
	return (
		<div class="app" data-mode={state.mode} data-source={data.value.source}>
			<a class="skip" href="#experience">
				Skip to experience
			</a>
			<Nav variant="home" />
			<div class="site-view">
				<main>
					<Hero />
					<Experience />
					<About />
				</main>
				<Footer variant="home" />
			</div>
			<CircuitMap projects={all} />
			<ProjectDialog />
			<ContactDialog />
			<DragonIntro />
		</div>
	);
});

const DESCRIPTION = SITE_SUMMARY;

export const head: DocumentHead = ({ resolveValue }) => {
	const { all } = resolveValue(usePortfolio);
	// the same case studies the sitemap lists: selected work with a case page and a video
	const caseStudies = FEATURED_PROJECT_SLUGS.flatMap((slug) => {
		const project = all.find((p) => p.id === slug && p.selected && p.demo);
		return project ? [{ name: project.title, url: `${SITE_URL}${projectPath(slug)}` }] : [];
	});
	const worksFor = JOBS.filter((job) => job.current).map((job) => job.name);
	return {
		links: [{ rel: 'canonical', href: `${SITE_URL}/` }],
		title: 'Adam Scott Gemenez | AI engineer and full-stack developer',
		meta: [
			{ name: 'description', content: DESCRIPTION },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:site_name', content: 'Adam Scott Gemenez portfolio' },
			{ property: 'og:title', content: 'Adam Scott Gemenez | AI engineer and full-stack developer' },
			{ property: 'og:description', content: DESCRIPTION },
			{ property: 'og:url', content: `${SITE_URL}/` },
			{ property: 'og:image', content: `${SITE_URL}/brand/og-1200x630.png` },
			{ property: 'og:image:width', content: '1200' },
			{ property: 'og:image:height', content: '630' },
			{ property: 'og:image:alt', content: 'the green dragon mark beside the words systems that make things lighter' },
			{ name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'twitter:title', content: 'Adam Scott Gemenez | AI engineer and full-stack developer' },
			{ name: 'twitter:description', content: DESCRIPTION },
			{ name: 'twitter:image', content: `${SITE_URL}/brand/og-1200x630.png` }
		],
		scripts: [{ type: 'application/ld+json', script: serializeJsonLd(buildHomeJsonLd({ worksFor, caseStudies })) }]
	};
};
