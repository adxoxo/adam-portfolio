import { component$, useContextProvider, useStore, useStyles$, useVisibleTask$ } from '@qwik.dev/core';
import { routeLoader$, type DocumentHead } from '@qwik.dev/router';
import { loadPublicProjects } from '~/lib/server/projects';
import { present } from '~/lib/data/presentation';
import styles from '~/styles/site.css?inline';
import { ProjectsCtx, SITE_URL, SiteStateCtx, type SiteState } from '~/components/site/state';
import { Nav } from '~/components/site/Nav';
import { Hero } from '~/components/site/Hero';
import { Work } from '~/components/site/Work';
import { AllProjects } from '~/components/site/AllProjects';
import { About } from '~/components/site/About';
import { Footer } from '~/components/site/Footer';
import { CircuitMap } from '~/components/site/map/CircuitMap';
import { ProjectDialog } from '~/components/site/ProjectDialog';
import { ContactDialog } from '~/components/site/ContactDialog';

// Server only: reads the public CMS rows (or the 21-row snapshot) and applies
// the presentation policy. No client, key or cookie leaves this function.
export const usePortfolio = routeLoader$(async (event) => {
	const { projects, source } = await loadPublicProjects(event);
	const view = present(projects);
	return { all: view.all, highlightIds: view.highlights.map((p) => p.id), source };
});

export default component$(() => {
	useStyles$(styles);
	const data = usePortfolio();
	const state = useStore<SiteState>({ mode: 'site', detailId: '', returnFocus: '' });
	useContextProvider(SiteStateCtx, state);
	useContextProvider(ProjectsCtx, { list: data.value.all });

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
	const highlights = data.value.highlightIds.map((id) => all.find((p) => p.id === id)!).filter(Boolean);
	return (
		<div class="app" data-mode={state.mode} data-source={data.value.source}>
			<a class="skip" href="#work">
				skip to selected work
			</a>
			<Nav variant="home" />
			<div class="site-view">
				<main>
					<Hero />
					<Work highlights={highlights} />
					<AllProjects projects={all} />
					<About />
				</main>
				<Footer variant="home" />
			</div>
			<CircuitMap projects={all} />
			<ProjectDialog />
			<ContactDialog />
		</div>
	);
});

const DESCRIPTION =
	'adam, ai engineer and full-stack developer. i build systems that make things lighter: ai tools, web apps, automations and embedded devices, each shown with a short video.';

export const head: DocumentHead = {
	links: [{ rel: 'canonical', href: `${SITE_URL}/` }],
	title: 'adam, systems that make things lighter',
	meta: [
		{ name: 'description', content: DESCRIPTION },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:site_name', content: 'adam' },
		{ property: 'og:title', content: 'adam, systems that make things lighter' },
		{ property: 'og:description', content: DESCRIPTION },
		{ property: 'og:url', content: `${SITE_URL}/` },
		{ property: 'og:image', content: `${SITE_URL}/brand/og-1200x630.png` },
		{ property: 'og:image:width', content: '1200' },
		{ property: 'og:image:height', content: '630' },
		{ property: 'og:image:alt', content: 'the green dragon mark beside the words systems that make things lighter' },
		{ name: 'twitter:card', content: 'summary_large_image' }
	]
};
