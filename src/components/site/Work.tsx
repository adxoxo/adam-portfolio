import { $, component$, sync$, useContext } from '@qwik.dev/core';
import { CLUSTER_LABEL } from '~/lib/data/projects';
import { KIND_LABEL, type ViewProject } from '~/lib/data/presentation';
import { projectPath, slugForId } from '~/lib/seo';
import { SiteStateCtx } from './state';
import { openProject } from './runtime/dialogs';
import { LeadPreview, PosterFrame, hoverPreview } from './Preview';

const SALES = new Set(['whatsapp_offer', 'booking_invoice']);

const preventPlainProjectClick = sync$((event: MouseEvent) => {
	if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
});

const Meta = component$<{ p: ViewProject }>(({ p }) => (
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
		{p.labels.map((l) => (
			<span key={l} class={l === 'past project' || l === 'design concept' ? 'chip chip--warn' : 'chip'}>
				{l}
			</span>
		))}
	</div>
));

const WorkCard = component$<{ p: ViewProject; size: 'half' | 'wide' | 'small'; flip?: boolean }>(({ p, size, flip }) => {
	const state = useContext(SiteStateCtx);
	const id = `work-${p.id}`;
	const slug = slugForId(p.id);
	const cls = size === 'wide' ? `wcard wcard--wide${flip ? ' flip' : ''}` : size === 'small' ? 'wcard wcard--small' : 'wcard';
	return (
		<article class={cls} onPointerEnter$={(e, el) => hoverPreview(e, el, true)} onPointerLeave$={(e, el) => hoverPreview(e, el, false)}>
			{p.demo ? <PosterFrame demo={p.demo} /> : <div class="frame frame-empty">{p.title}</div>}
			<div class="wbody">
				<Meta p={p} />
				<h3>
					{slug ? (
						<a
							id={id}
							class="card-link"
							href={projectPath(slug)}
							onClick$={[
								preventPlainProjectClick,
								$((event: MouseEvent) => {
									if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
									return openProject(state, p.id, id);
								})
							]}
						>
							{p.title}
						</a>
					) : (
						<button type="button" id={id} class="card-link" onClick$={() => openProject(state, p.id, id)}>{p.title}</button>
					)}
				</h3>
				<p class="sum">{p.systemDetail?.summary && size === 'small' ? p.systemDetail.summary : p.summary}</p>
				<span class="go" aria-hidden="true">
					watch the demo
				</span>
			</div>
		</article>
	);
});

export const Work = component$<{ highlights: ViewProject[] }>(({ highlights }) => {
	const state = useContext(SiteStateCtx);
	const [lead, ...rest] = highlights;
	const main = rest.filter((p) => !SALES.has(p.id));
	const sales = rest.filter((p) => SALES.has(p.id));
	const points = (lead?.features ?? []).slice(0, 3);
	const leadSlug = lead ? slugForId(lead.id) : null;
	return (
		<section class="section work" id="work" aria-labelledby="work-h">
			<div class="wrap">
				<div class="sec-head">
					<h2 id="work-h">selected work</h2>
					<p>every project here has a short video. open one to watch it with sound and read how it works.</p>
				</div>
				{lead && (
					<article class="lead" aria-labelledby="lead-h">
						{lead.demo ? <LeadPreview demo={lead.demo} title={lead.title} /> : <div class="frame frame-empty">{lead.title}</div>}
						<div class="lead-copy">
							<Meta p={lead} />
							<h3 id="lead-h">{lead.title}</h3>
							<p class="lead-sum">{lead.summary}</p>
							{points.length > 0 && (
								<ul class="points">
									{points.map((f) => (
										<li key={f.label}>
											<span>
												<strong>{f.label}</strong>
											</span>
										</li>
									))}
								</ul>
							)}
							{lead.note && <p class="caption">{lead.note}</p>}
							<div class="cta-row">
								{leadSlug ? (
									<a
										id={`work-${lead.id}`}
										class="btn"
										href={projectPath(leadSlug)}
										onClick$={[
											preventPlainProjectClick,
											$((event: MouseEvent) => {
												if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
												return openProject(state, lead.id, `work-${lead.id}`);
											})
										]}
									>
										watch the {lead.title.replace(/^aquryu /, '')} demo
									</a>
								) : (
									<button type="button" id={`work-${lead.id}`} class="btn" onClick$={() => openProject(state, lead.id, `work-${lead.id}`)}>
										watch the {lead.title.replace(/^aquryu /, '')} demo
									</button>
								)}
							</div>
						</div>
					</article>
				)}
				<div class="work-grid">
					{main.map((p, i) => (
						<WorkCard key={p.id} p={p} size={i === 2 ? 'wide' : 'half'} flip={i === 2} />
					))}
					{sales.length > 0 && (
						<div class="group-head">
							<h3>sales automation</h3>
							<p>client work delivered through an agency. the client and the agency stay unnamed, and each video says whether it shows a real interface or a walkthrough of the system.</p>
						</div>
					)}
					{sales.map((p) => (
						<WorkCard key={p.id} p={p} size="small" />
					))}
				</div>
			</div>
		</section>
	);
});
