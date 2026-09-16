<script lang="ts">
	import { tick } from 'svelte';
	import ProjectMedia from './ProjectMedia.svelte';
	import WorkflowDiagram from './WorkflowDiagram.svelte';
	import { serviceById, type Project, type ServiceId } from './data';

	// The parent mounts this component only while a project is open. Previous /
	// next swap the project prop while it stays mounted.
	let {
		project,
		list,
		onclose,
		onnav,
		onservice,
		onsimilar
	}: {
		project: Project;
		list: Project[]; // the list the previous / next buttons walk through
		onclose: () => void;
		onnav: (id: string) => void;
		onservice: (svc: ServiceId) => void;
		onsimilar: (p: Project) => void;
	} = $props();

	let dlg = $state<HTMLDialogElement>();
	let heading = $state<HTMLHeadingElement>();

	const service = $derived(serviceById(project.service)!);
	const idx = $derived(list.findIndex((q) => q.id === project.id));
	const prev = $derived(idx > 0 ? list[idx - 1] : null);
	const next = $derived(idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null);

	// open the native modal once mounted; whenever the project changes, scroll
	// back to the top and move focus to the new title
	$effect(() => {
		project.id;
		if (!dlg) return;
		if (!dlg.open) dlg.showModal();
		dlg.scrollTop = 0;
		tick().then(() => heading?.focus());
	});

	function onBackdrop(e: MouseEvent) {
		if (e.target === dlg) dlg?.close();
	}
</script>

<dialog bind:this={dlg} aria-labelledby="pd-title" {onclose} onclick={onBackdrop}>
	{#key project.id}
		<div class="dlg">
			<div class="dlg-head">
				<p class="eyebrow">{service.title} <span class="muted sep">/ {project.kind} / {project.year}</span></p>
				<button type="button" class="close" aria-label="close" onclick={() => dlg?.close()}>
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l12 12M16 4L4 16" /></svg>
				</button>
			</div>
			<h2 id="pd-title" tabindex="-1" bind:this={heading}>
				{project.title}
				{#if project.tag}<span class="tag">{project.tag}</span>{/if}
			</h2>
			<p class="summary">{project.summary}</p>

			{#if project.flow}
				<!-- the same customer-visible stages as on the overview card; the client builds carry no internal step notes -->
				<div class="flow-box">
					<WorkflowDiagram variant={project.flow} />
				</div>
			{/if}
			<!-- the media slot stays available next to a diagram; an empty slot is only shown when there is no diagram either -->
			{#if project.media || !project.flow}
				<ProjectMedia media={project.media} title={project.title} />
			{/if}

			<dl class="meta">
				<div><dt>role</dt><dd>{project.role}</dd></div>
				<div><dt>context</dt><dd>{project.context}</dd></div>
				<div><dt>service</dt><dd><button type="button" class="textlink svc" onclick={() => onservice(project.service)}>{service.short}</button></dd></div>
			</dl>
			<section><h3>the problem</h3><p>{project.problem}</p></section>
			<section><h3>what it does</h3><p>{project.does}</p></section>
			<section>
				<h3>what you can see</h3>
				<ul class="outcomes">{#each project.outcomes as o (o)}<li>{o}</li>{/each}</ul>
			</section>
			<details>
				<summary>technical details</summary>
				<div>
					<!-- stack and source only; the content module carries no internal write-up or wiring path -->
					<div><h3>stack</h3><div class="stack">{#each project.stack as t (t)}<span class="chip">{t}</span>{/each}</div></div>
					<div>
						<h3>source</h3>
						<div class="links">
							{#if project.live}<a href={project.live} target="_blank" rel="noopener">live site</a>{/if}
							{#if project.github}<a href={project.github} target="_blank" rel="noopener">source on github</a>{:else}<span>no public repository (client or private build)</span>{/if}
						</div>
					</div>
				</div>
			</details>
			<div class="dlg-foot">
				<button type="button" class="btn" onclick={() => onsimilar(project)}>build something similar</button>
				<div class="nav">
					<button type="button" disabled={!prev} aria-label="previous project{prev ? ', ' + prev.title : ''}" onclick={() => prev && onnav(prev.id)}>&larr; previous</button>
					<button type="button" disabled={!next} aria-label="next project{next ? ', ' + next.title : ''}" onclick={() => next && onnav(next.id)}>next &rarr;</button>
				</div>
			</div>
			{#if project.provenance}
				<p class="provenance">{project.provenance}</p>
			{/if}
		</div>
	{/key}
</dialog>

<style>
	.sep { letter-spacing: 0.06em; }
	.flow-box { border: 1px solid var(--border); background: var(--surface); padding: 18px; }
	@media (max-width: 480px) { .flow-box { padding: 12px; } }
	.summary { font-size: 17px; line-height: 1.6; }
	.svc { min-height: auto; font-size: 15px; }
	.meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 14px 0; }
	.meta dt { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; color: var(--muted); }
	.meta dd { margin: 2px 0 0; font-size: 15px; font-weight: 500; }
	h3 { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; font-family: var(--font-body); font-weight: 500; color: var(--accent); margin-bottom: 6px; }
	section p, section li { font-size: 16px; }
	.outcomes li { display: grid; grid-template-columns: 14px 1fr; gap: 10px; padding: 6px 0; }
	.outcomes li::before { content: ""; width: 8px; height: 8px; background: var(--accent); margin-top: 9px; }
	details { border: 1px solid var(--border); background: var(--surface); }
	summary { cursor: pointer; padding: 14px 18px; font-weight: 500; font-size: 15px; list-style: none; display: flex; align-items: center; justify-content: space-between; min-height: 48px; }
	summary::-webkit-details-marker { display: none; }
	summary::after { content: "+"; font-family: var(--font-head); font-size: 20px; color: var(--accent-deep); }
	details[open] summary::after { content: "\2212"; }
	details > div { padding: 4px 18px 18px; display: grid; gap: 16px; border-top: 1px solid var(--border); }
	.stack { display: flex; flex-wrap: wrap; gap: 6px; }
	.links { display: flex; flex-wrap: wrap; gap: 6px 20px; font-size: 14px; }
	.links a { font-weight: 500; min-height: 44px; display: inline-flex; align-items: center; }
	.links span { color: var(--muted); min-height: 44px; display: inline-flex; align-items: center; }
	.dlg-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding-top: 6px; }
	.nav { margin-left: auto; display: flex; gap: 4px; }
	.nav button { min-height: 44px; padding: 0 14px; border: 1px solid var(--border); font-size: 13px; font-weight: 500; color: var(--accent-deep); }
	.nav button:hover { background: var(--surface); }
	.nav button:disabled { color: var(--muted); opacity: 0.5; cursor: default; }
	.provenance { font-size: 13px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 12px; }
	@media (max-width: 640px) {
		.meta { grid-template-columns: 1fr; gap: 10px; }
		/* the primary button spans the row and may wrap: as a no-wrap flex item it
		   was wider than the dialog at 320px (the shared .btn keeps nowrap for the
		   inline buttons on the page) */
		.dlg-foot .btn { width: 100%; min-width: 0; white-space: normal; text-align: center; padding-left: 16px; padding-right: 16px; }
		.nav { margin-left: 0; width: 100%; }
		.nav button { flex: 1; }
	}
</style>
