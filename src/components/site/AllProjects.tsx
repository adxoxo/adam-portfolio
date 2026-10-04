import { component$, useContext, useSignal } from '@qwik.dev/core';
import { CLUSTER_LABEL, type Cluster } from '~/lib/data/projects';
import { KIND_LABEL, type ViewProject } from '~/lib/data/presentation';
import { SiteStateCtx } from './state';
import { openProject } from './runtime/dialogs';
import { animateTo } from './runtime/switch';
import { PosterFrame } from './Preview';

const ORDER: Cluster[] = ['ai', 'fullstack', 'automation', 'embedded'];

function matches(p: ViewProject, cluster: string, q: string) {
	if (cluster !== 'all' && p.cluster !== cluster) return false;
	if (!q) return true;
	const hay = [p.title, p.summary, p.year, CLUSTER_LABEL[p.cluster], ...p.stack, ...p.labels, p.demo ? KIND_LABEL[p.demo.kind] : ''].join(' ').toLowerCase();
	return q
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.every((w) => hay.includes(w));
}

/** Every public project, one card each, filterable by cluster and searchable.
 *  Each card opens the same project dialog with its video. */
export const AllProjects = component$<{ projects: ViewProject[] }>(({ projects }) => {
	const state = useContext(SiteStateCtx);
	const cluster = useSignal<string>('all');
	const query = useSignal('');
	const shown = projects.filter((p) => matches(p, cluster.value, query.value.trim()));
	const count = (c: Cluster) => projects.filter((p) => p.cluster === c).length;
	return (
		<section class="section" id="projects" aria-labelledby="projects-h">
			<div class="wrap">
				<div class="sec-head">
					<h2 id="projects-h">all projects</h2>
					<p>{projects.length} projects. each one opens with its video, the system behind it and links to the code where it is public.</p>
				</div>
				<div class="filters">
					<div class="chips" role="group" aria-label="filter by cluster">
						<button type="button" class="fchip" aria-pressed={cluster.value === 'all'} onClick$={() => (cluster.value = 'all')}>
							all <span>{projects.length}</span>
						</button>
						{ORDER.filter((c) => count(c) > 0).map((c) => (
							<button key={c} type="button" class="fchip" aria-pressed={cluster.value === c} onClick$={() => (cluster.value = c)}>
								{CLUSTER_LABEL[c]} <span>{count(c)}</span>
							</button>
						))}
					</div>
					<div class="search">
						<label for="project-search">search projects</label>
						<input id="project-search" type="search" autocomplete="off" placeholder="try supabase or esp32" bind:value={query} />
					</div>
				</div>
				<p class="result-note" role="status">
					showing {shown.length} of {projects.length} projects
				</p>
				{shown.length > 0 ? (
					<ul class="pgrid">
						{shown.map((p) => {
							const id = `all-${p.id}`;
							return (
								<li key={p.id}>
									<article class="pcard">
										{p.demo ? <PosterFrame demo={p.demo} thumb /> : <div class="frame frame-empty">{p.title}</div>}
										<div class="pc-body">
											<div class="meta-row">
												<span>{CLUSTER_LABEL[p.cluster]}</span>
												<i class="sep" />
												<span>{p.year}</span>
												{p.demo && (
													<>
														<i class="sep" />
														<span>{KIND_LABEL[p.demo.kind]}</span>
													</>
												)}
											</div>
											<h3>
												<button type="button" id={id} class="card-link" onClick$={() => openProject(state, p.id, id)}>
													{p.title}
												</button>
											</h3>
											<p>{p.summary}</p>
											{(p.selected || p.labels.length > 0) && (
												<div class="labels">
													{p.selected && <span class="chip chip--accent">selected work</span>}
													{p.labels.map((l) => (
														<span key={l} class={l === 'past project' || l === 'design concept' ? 'chip chip--warn' : 'chip'}>
															{l}
														</span>
													))}
												</div>
											)}
										</div>
									</article>
								</li>
							);
						})}
					</ul>
				) : (
					<div class="empty">
						<p>no project matches “{query.value}”.</p>
						<button
							type="button"
							class="text-link"
							onClick$={() => {
								query.value = '';
								cluster.value = 'all';
							}}
						>
							show all projects
						</button>
					</div>
				)}
				<div class="map-teaser">
					<p>the same {projects.length} projects, wired by cluster on one board. pan, zoom and open any node.</p>
					<button type="button" class="btn" onClick$={() => animateTo(state, 1)}>
						open the project map
					</button>
				</div>
			</div>
		</section>
	);
});
