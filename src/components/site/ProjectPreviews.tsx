import { $, component$, sync$, useContext } from '@qwik.dev/core';
import { KIND_LABEL, projectPreviewCopy, type ViewProject } from '~/lib/data/presentation';
import { integrationsFor } from '~/lib/data/integrations';
import { projectPath, slugForId } from '~/lib/seo';
import { ProjectsCtx, SiteStateCtx } from './state';
import { openProject } from './runtime/dialogs';
import { animateTo } from './runtime/switch';

// Previewed from the live public rows, by id. A row that is missing or hidden is
// left out; nothing is restored from a second snapshot.
const PREVIEW_IDS = ['vault', 'leadflow_cockpit', 'grimoire', 'tq_chatbot', 'goatedtracking', 'leadflow_visenza_dashboard', 'whatsapp_offer'] as const;

const preventPlainProjectClick = sync$((event: MouseEvent) => {
	if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
});

/** Stationary project cards. Plain clicks open the shared dialog; modified clicks follow the case page. */
export const ProjectPreviews = component$(() => {
	const state = useContext(SiteStateCtx);
	const projects = useContext(ProjectsCtx);
	const cards = PREVIEW_IDS.map((id) => projects.list.find((p) => p.id === id)).filter(
		(p): p is ViewProject => !!p && !!(p.demo || p.cover)
	);

	if (!cards.length) return null;
	return (
		<section class="glimpse" id="glimpse" aria-labelledby="glimpse-h">
			<div class="glimpse-head">
				<h2 class="glimpse-label" id="glimpse-h">
					A glimpse of Adam's work
				</h2>
				<a class="text-link" href="#map" onClick$={[
					preventPlainProjectClick,
					$((event: MouseEvent) => {
						if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
						animateTo(state, 1);
					})
				]}>
					Explore the map
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
				</a>
			</div>
			<div class="glimpse-track">
				<div class="glimpse-lane">
					<ul class="glimpse-rail" aria-labelledby="glimpse-h">
						{cards.map((p) => {
							const image = p.demo?.thumb ?? p.cover!;
							const slug = slugForId(p.id);
							const id = `glimpse-${p.id}`;
							const kind = p.demo ? KIND_LABEL[p.demo.kind] : 'Interface capture';
							const copy = projectPreviewCopy(p);
							const integrations = integrationsFor(p.id).slice(0, 2);
							const body = (
								<>
									<img src={image} alt="" width={640} height={360} loading="lazy" decoding="async" />
									<span class="g-t">{p.title}</span>
									<span class="g-summary">{copy.summary}</span>
									{integrations.length > 0 && <span class="g-api">{integrations.map((item) => item.label).join(' · ')}</span>}
									<span class="g-m">{copy.category || kind}
									<svg class="g-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
										<path d="M3 8h10M9 4l4 4-4 4" />
									</svg>
									</span>
								</>
							);
							return (
								<li key={p.id}>
									{slug ? (
										<a
											id={id}
											class="gcard"
											href={projectPath(slug)}
											data-project={p.id}
											aria-haspopup="dialog"
											onClick$={[
												preventPlainProjectClick,
												$((event: MouseEvent) => {
													if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
													return openProject(state, p.id, id);
												})
											]}
										>
											{body}
										</a>
									) : (
										<button type="button" id={id} class="gcard" data-project={p.id} aria-haspopup="dialog" onClick$={() => openProject(state, p.id, id)}>
											{body}
										</button>
									)}
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</section>
	);
});
