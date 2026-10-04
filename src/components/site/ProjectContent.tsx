import { component$, useSignal } from '@qwik.dev/core';
import { CLUSTER_LABEL } from '~/lib/data/projects';
import { KIND_LABEL, type ViewProject } from '~/lib/data/presentation';
import { techIcon } from '~/lib/data/tech';
import { Icon } from './icons';
import { VideoPlayer } from './VideoPlayer';

const fmtDur = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.round(seconds % 60).toString().padStart(2, '0')}`;

/** Fallback for a future CMS project that has no local video yet. Loom loads
 * only after explicit consent. A cover image stays local to the page. */
const LegacyMedia = component$<{ project: ViewProject }>(({ project }) => {
	const load = useSignal(false);
	if (project.loom) {
		return load.value ? (
			<div class="loom-frame">
				<iframe src={`https://www.loom.com/embed/${encodeURIComponent(project.loom)}`} title={`${project.title} walkthrough on loom`} allow="fullscreen" />
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
	if (project.cover) {
		return (
			<div class="frame">
				<img src={project.cover} alt="" loading="lazy" width={1280} height={720} />
			</div>
		);
	}
	return null;
});

/** The project detail shared by the modal and the public case-study page. */
export const ProjectContent = component$<{ project: ViewProject; standalone?: boolean }>(({ project, standalone = false }) => {
	const legend = project.systemDetail?.legend ?? [];
	return (
		<div class="pd-inner" data-project={project.id}>
			<header class="pd-head">
				<div>
					{standalone ? <h1 id="pd-title">{project.title}</h1> : <h2 id="pd-title">{project.title}</h2>}
					<div class="meta-row">
						<span>{CLUSTER_LABEL[project.cluster]}</span>
						<i class="sep" />
						<span>{project.year}</span>
						{project.demo && (
							<>
								<i class="sep" />
								<span>{KIND_LABEL[project.demo.kind]}, {fmtDur(project.demo.durationSeconds)}</span>
							</>
						)}
					</div>
				</div>
				{!standalone && (
					<form method="dialog">
						<button type="submit" class="x-btn" aria-label="close" autofocus><Icon name="close" /></button>
					</form>
				)}
			</header>
			<div class="pd-media">{project.demo ? <VideoPlayer demo={project.demo} title={project.title} /> : <LegacyMedia project={project} />}</div>
			<div class="pd-body">
				<div class="pd-main">
					{(project.labels.length > 0 || project.systemDetail?.deliveryStatus) && (
						<div class="meta-row">
							{project.labels.map((label) => <span key={label} class={label === 'past project' || label === 'design concept' ? 'chip chip--warn' : 'chip'}>{label}</span>)}
							{project.systemDetail?.deliveryStatus && <span class="chip chip--accent">{project.systemDetail.deliveryStatus}</span>}
						</div>
					)}
					{project.note && <p class="pd-note">{project.note}</p>}
					<p class="pd-sum">{project.summary}</p>
					{project.systemDetail?.summary && project.systemDetail.summary !== project.summary && <p>{project.systemDetail.summary}</p>}
					{project.why && <p class="why">{project.why}</p>}
					{!!project.features?.length && (
						<div class="blk"><h3>how it works</h3><ul class="feats">{project.features.map((feature) => (
							<li class="feat" key={feature.label}><b>{feature.label}</b><span>{feature.detail}</span></li>
						))}</ul></div>
					)}
					{legend.length > 0 && (
						<div class="blk"><h3>how the parts connect</h3><ul class="feats">{legend.map((feature) => (
							<li class="feat" key={feature.label}><b>{feature.label}</b><span>{feature.detail}</span></li>
						))}</ul></div>
					)}
				</div>
				<div class="pd-side">
					{project.schematic.length > 0 && (
						<div class="blk"><h3>system path</h3><div class="schem">{project.schematic.flatMap((step, index) => [
							<span key={`s${index}`} class={index === project.schematic.length - 1 ? 's last' : 's'}>{step}</span>,
							index < project.schematic.length - 1 ? <i key={`a${index}`} class="a" aria-hidden="true" /> : null
						])}</div></div>
					)}
					{project.outcomes.length > 0 && <div class="blk"><h3>outcomes</h3><ul class="points">{project.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></div>}
					{project.stack.length > 0 && (
						<div class="blk"><h3>stack</h3><ul class="logos text">{project.stack.map((technology) => {
							const src = techIcon(technology);
							return <li key={technology}>{src ? <img src={src} alt="" width={18} height={18} loading="lazy" /> : null}<span style={src ? { marginLeft: '6px' } : undefined}>{technology}</span></li>;
						})}</ul></div>
					)}
					{(project.live || project.github) && <div class="links">
						{project.live && <a class="text-link" href={project.live} target="_blank" rel="noopener">visit the live site <Icon name="ext" /></a>}
						{project.github && <a class="text-link" href={project.github} target="_blank" rel="noopener">view the repository <Icon name="ext" /></a>}
					</div>}
				</div>
			</div>
		</div>
	);
});
