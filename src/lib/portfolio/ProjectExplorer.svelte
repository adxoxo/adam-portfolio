<script lang="ts">
	import ProjectMap from './ProjectMap.svelte';
	import { SERVICES, projectsOf, serviceById, type Project, type ServiceId } from './data';

	// the project index is the map: service navigation on the left (chips on
	// narrow screens), the dark map on the right
	let {
		projects,
		service,
		onservice,
		onopen,
		oncontact
	}: {
		projects: Project[];
		service: ServiceId | 'all';
		onservice: (svc: ServiceId | 'all') => void;
		onopen: (id: string, opener: HTMLElement | SVGElement) => void;
		oncontact: (opener: HTMLElement) => void;
	} = $props();

	const items = $derived([
		{ id: 'all' as const, title: 'all services', short: 'all', n: projects.length, desc: 'every project, in service clusters around adam.' },
		...SERVICES.map((s) => ({ id: s.id, title: s.title, short: s.short, n: projectsOf(s.id, projects).length, desc: s.desc }))
	]);
	const current = $derived(service === 'all' ? null : serviceById(service));
	const count = $derived(service === 'all' ? projects.length : projectsOf(service, projects).length);
	let title = $state<HTMLHeadingElement>();
	export function focusTitle() {
		title?.focus({ preventScroll: true });
	}
</script>

<section class="index" aria-labelledby="index-title">
	<div class="container">
		<div class="index-top">
			<div>
				<p class="eyebrow">project index</p>
				<h1 id="index-title" tabindex="-1" bind:this={title}>find the right kind of work.</h1>
				<p class="lede">choose a service. the map shows the projects behind it.</p>
			</div>
			<button type="button" class="btn btn--secondary" onclick={(e) => oncontact(e.currentTarget)}>work with me</button>
		</div>

		<div class="index-layout">
			<aside class="svc-nav" aria-label="services">
				<h2>services</h2>
				<div class="svc-list">
					{#each items as it (it.id)}
						<button type="button" aria-current={service === it.id} onclick={() => onservice(it.id)}>
							<span class="t">{it.title}</span><span class="c">{it.n}</span>
							{#if service === it.id}<span class="d">{it.desc}</span>{/if}
						</button>
					{/each}
				</div>
				<div class="svc-chips" role="group" aria-label="choose a service">
					{#each items as it (it.id)}
						<button type="button" aria-current={service === it.id} onclick={() => onservice(it.id)}>{it.short} <span class="c">{it.n}</span></button>
					{/each}
				</div>
				<p class="hint">open a project on the map to see the problem, what it does, and what you can see.</p>
			</aside>

			<div class="index-main">
				<div class="index-head">
					<div>
						<h2>{current ? current.title : 'all services'}</h2>
						<p>{current ? current.long : 'fifteen projects across five services. choose one service to focus its part of the map.'}</p>
					</div>
					<span class="n">{count} {count === 1 ? 'project' : 'projects'}</span>
				</div>

				<ProjectMap {projects} {service} onselect={onservice} {onopen} />
			</div>
		</div>
	</div>
</section>

<style>
	.index { padding: 40px 0 var(--section-gap); }
	.index-top { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: end; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
	.index-top h1 { font-size: clamp(2rem, 3.4vw, 2.8rem); letter-spacing: -0.02em; margin-top: 12px; }
	.index-top h1:focus { outline: none; }
	.index-top .lede { margin-top: 10px; }
	.index-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 56px; padding-top: 40px; }
	.svc-nav { position: sticky; top: var(--top-offset); align-self: start; }
	.svc-nav h2 { font-family: var(--font-body); font-weight: 500; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
	.svc-list { border-top: 1px solid var(--border); }
	.svc-list button { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; width: 100%; text-align: left; padding: 14px 14px 14px 16px; border-bottom: 1px solid var(--border); border-left: 3px solid transparent; min-height: 52px; align-items: center; transition: background-color 0.15s ease; }
	.svc-list button:hover { background: var(--surface); }
	.svc-list button[aria-current="true"] { border-left-color: var(--accent-deep); background: var(--surface); }
	.svc-list .t { font-family: var(--font-head); font-weight: 600; font-size: 15px; letter-spacing: -0.005em; }
	.svc-list .c { font-size: 12px; color: var(--muted); font-weight: 500; }
	.svc-list .d { grid-column: 1 / -1; font-size: 13px; color: var(--muted); line-height: 1.5; }
	.hint { font-size: 13px; color: var(--muted); margin-top: 18px; line-height: 1.55; }
	.svc-chips { display: none; flex-wrap: wrap; gap: 8px; }
	.svc-chips button { min-height: 44px; padding: 0 14px; border: 1px solid var(--border); font-size: 14px; font-weight: 500; color: var(--text); display: inline-flex; align-items: center; gap: 8px; }
	.svc-chips button .c { color: var(--muted); font-size: 12px; }
	.svc-chips button[aria-current="true"] { background: var(--accent-deep); border-color: var(--accent-deep); color: var(--on-accent); }
	.svc-chips button[aria-current="true"] .c { color: var(--on-accent); opacity: 0.8; }
	.index-main { min-width: 0; }
	.index-head { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px 24px; margin-bottom: 24px; }
	.index-head h2 { font-size: clamp(1.5rem, 2.4vw, 2rem); }
	.index-head p { font-size: 16px; color: var(--muted); max-width: 60ch; margin-top: 6px; }
	/* the count sits on the baseline of the heading block, right-aligned, where the toggle used to be */
	.index-head .n { margin-left: auto; font-size: 13px; color: var(--muted); font-weight: 500; white-space: nowrap; border: 1px solid var(--border); padding: 8px 12px; }
	@media (max-width: 960px) {
		.index-layout { grid-template-columns: 1fr; gap: 28px; padding-top: 28px; }
		.svc-nav { position: static; }
		.svc-list, .hint { display: none; }
		.svc-chips { display: flex; }
		.index-head .n { margin-left: 0; }
	}
	@media (max-width: 760px) { .index-top { grid-template-columns: 1fr; } .index { padding-top: 28px; } }
</style>
