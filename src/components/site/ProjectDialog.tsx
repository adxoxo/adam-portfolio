import { component$, useContext, useSignal } from '@qwik.dev/core';
import { CLUSTER_LABEL } from '~/lib/data/projects';
import { KIND_LABEL, type ViewProject } from '~/lib/data/presentation';
import { techIcon } from '~/lib/data/tech';
import { ProjectsCtx, SiteStateCtx } from './state';
import { afterProjectClose, closeOnBackdrop } from './runtime/dialogs';
import { VideoPlayer } from './VideoPlayer';
import { Icon } from './icons';

const fmtDur = (s: number) => `${Math.floor(s / 60)}:${Math.round(s % 60).toString().padStart(2, '0')}`;

/** Fallback for a future CMS project that has no local video yet: an older
 *  Loom walkthrough loads only after an explicit request, or a cover image. */
const LegacyMedia = component$<{ p: ViewProject }>(({ p }) => {
	const load = useSignal(false);
	if (p.loom) {
		return load.value ? (
			<div class="loom-frame">
				<iframe src={`https://www.loom.com/embed/${encodeURIComponent(p.loom)}`} title={`${p.title} walkthrough on loom`} allow="fullscreen" />
			</div>
		) : (
			<div class="loom-consent">
				<p>this project has an older walkthrough hosted on loom.com. loading it connects your browser to loom, which sets its own cookies.</p>
				<button type="button" class="btn" onClick$={() => (load.value = true)}>
					<Icon name="play" /> load the loom walkthrough
				</button>
			</div>
		);
	}
	if (p.cover) {
		return (
			<div class="frame">
				<img src={p.cover} alt="" loading="lazy" width={1280} height={720} />
			</div>
		);
	}
	return null;
});

const Body = component$<{ p: ViewProject }>(({ p }) => {
	const legend = p.systemDetail?.legend ?? [];
	return (
		<div class="pd-inner" data-project={p.id}>
			<header class="pd-head">
				<div>
					<h2 id="pd-title">{p.title}</h2>
					<div class="meta-row">
						<span>{CLUSTER_LABEL[p.cluster]}</span>
						<i class="sep" />
						<span>{p.year}</span>
						{p.demo && (
							<>
								<i class="sep" />
								<span>
									{KIND_LABEL[p.demo.kind]}, {fmtDur(p.demo.durationSeconds)}
								</span>
							</>
						)}
					</div>
				</div>
				<form method="dialog">
					<button type="submit" class="x-btn" aria-label="close" autofocus>
						<Icon name="close" />
					</button>
				</form>
			</header>
			<div class="pd-media">{p.demo ? <VideoPlayer demo={p.demo} title={p.title} /> : <LegacyMedia p={p} />}</div>
			<div class="pd-body">
				<div class="pd-main">
					{(p.labels.length > 0 || p.systemDetail?.deliveryStatus) && (
						<div class="meta-row">
							{p.labels.map((l) => (
								<span key={l} class={l === 'past project' || l === 'design concept' ? 'chip chip--warn' : 'chip'}>
									{l}
								</span>
							))}
							{p.systemDetail?.deliveryStatus && <span class="chip chip--accent">{p.systemDetail.deliveryStatus}</span>}
						</div>
					)}
					{p.note && <p class="pd-note">{p.note}</p>}
					<p class="pd-sum">{p.summary}</p>
					{p.systemDetail?.summary && p.systemDetail.summary !== p.summary && <p>{p.systemDetail.summary}</p>}
					{p.why && <p class="why">{p.why}</p>}
					{!!p.features?.length && (
						<div class="blk">
							<h3>how it works</h3>
							<ul class="feats">
								{p.features.map((f) => (
									<li class="feat" key={f.label}>
										<b>{f.label}</b>
										<span>{f.detail}</span>
									</li>
								))}
							</ul>
						</div>
					)}
					{legend.length > 0 && (
						<div class="blk">
							<h3>how the parts connect</h3>
							<ul class="feats">
								{legend.map((f) => (
									<li class="feat" key={f.label}>
										<b>{f.label}</b>
										<span>{f.detail}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
				<div class="pd-side">
					{p.schematic.length > 0 && (
						<div class="blk">
							<h3>system path</h3>
							<div class="schem">
								{p.schematic.flatMap((s, i) => [
									<span key={`s${i}`} class={i === p.schematic.length - 1 ? 's last' : 's'}>
										{s}
									</span>,
									i < p.schematic.length - 1 ? <i key={`a${i}`} class="a" aria-hidden="true" /> : null
								])}
							</div>
						</div>
					)}
					{p.outcomes.length > 0 && (
						<div class="blk">
							<h3>outcomes</h3>
							<ul class="points">
								{p.outcomes.map((o) => (
									<li key={o}>{o}</li>
								))}
							</ul>
						</div>
					)}
					{p.stack.length > 0 && (
						<div class="blk">
							<h3>stack</h3>
							<ul class="logos text">
								{p.stack.map((s) => {
									const src = techIcon(s);
									return (
										<li key={s}>
											{src ? <img src={src} alt="" width={18} height={18} loading="lazy" /> : null}
											<span style={src ? { marginLeft: '6px' } : undefined}>{s}</span>
										</li>
									);
								})}
							</ul>
						</div>
					)}
					{(p.live || p.github) && (
						<div class="links">
							{p.live && (
								<a class="text-link" href={p.live} target="_blank" rel="noopener">
									visit the live site <Icon name="ext" />
								</a>
							)}
							{p.github && (
								<a class="text-link" href={p.github} target="_blank" rel="noopener">
									view the repository <Icon name="ext" />
								</a>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

/** One shared dialog for every project, opened from cards, the list and the map. */
export const ProjectDialog = component$(() => {
	const state = useContext(SiteStateCtx);
	const projects = useContext(ProjectsCtx);
	const p = state.detailId ? projects.list.find((x) => x.id === state.detailId) : undefined;
	return (
		<dialog
			id="project-dialog"
			class="pd"
			aria-labelledby="pd-title"
			onClose$={(_, el) => afterProjectClose(state, el)}
			onClick$={(e, el) => closeOnBackdrop(e, el)}
		>
			{p && <Body key={p.id} p={p} />}
		</dialog>
	);
});
