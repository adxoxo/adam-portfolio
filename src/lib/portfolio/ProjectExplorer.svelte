<script lang="ts">
	import ProjectMap from './ProjectMap.svelte';
	import { SERVICES, projectsOf, serviceById, type Project, type ServiceId } from './data';

	// the project index: service navigation on the left (a labelled select on
	// narrow screens), the projects on the right as readable rows or as the
	// dark map. The page decides which presentation shows (rows on phones and
	// tablets by default, the map above 960px, or the visitor's explicit
	// choice); only the shown one is rendered, so a hidden map never animates
	// or takes focus.
	let {
		projects,
		service,
		presentation,
		onservice,
		onpresentation,
		onopen,
		oncontact
	}: {
		projects: Project[];
		service: ServiceId | 'all';
		presentation: 'list' | 'map';
		onservice: (svc: ServiceId | 'all') => void;
		onpresentation: (p: 'list' | 'map') => void;
		onopen: (id: string, opener: HTMLElement | SVGElement) => void;
		oncontact: (opener: HTMLElement) => void;
	} = $props();

	const items = $derived([
		{ id: 'all' as const, title: 'all services', short: 'all', n: projects.length, desc: 'every project, in service clusters around adam.' },
		...SERVICES.map((s) => ({ id: s.id, title: s.title, short: s.short, n: projectsOf(s.id, projects).length, desc: s.desc }))
	]);
	const current = $derived(service === 'all' ? null : serviceById(service));
	// the same list the dialog's previous / next walk through (see +page.svelte)
	const list = $derived(service === 'all' ? projects : projectsOf(service, projects));
	const count = $derived(list.length);
	let title = $state<HTMLHeadingElement>();
	export function focusTitle() {
		title?.focus({ preventScroll: true });
	}
	function pickService(e: Event) {
		const v = (e.currentTarget as HTMLSelectElement).value;
		onservice(v === 'all' ? 'all' : (v as ServiceId));
	}
</script>

<section class="index" aria-labelledby="index-title">
	<div class="container">
		<div class="index-top">
			<div>
				<p class="eyebrow">project index</p>
				<h1 id="index-title" tabindex="-1" bind:this={title}>find the right kind of work.</h1>
				<p class="lede">choose a service. the {presentation} shows the projects behind it.</p>
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
				<!-- narrow screens: one native select instead of the list, so the projects start right below -->
				<div class="svc-select">
					<label for="svc-select">service</label>
					<select id="svc-select" value={service} onchange={pickService}>
						{#each items as it (it.id)}
							<option value={it.id}>{it.title} ({it.n})</option>
						{/each}
					</select>
				</div>
				<p class="hint">{presentation === 'map' ? 'open a project on the map to see the problem, what it does, and what you can see.' : 'open a project to see the problem, what it does, and what you can see.'}</p>
			</aside>

			<div class="index-main">
				<div class="index-head">
					<div class="head-text">
						<h2>{current ? current.title : 'all services'}</h2>
						<p>{current ? current.long : `fifteen projects across five services. choose one service to ${presentation === 'map' ? 'focus its part of the map' : 'see only its projects'}.`}</p>
					</div>
					<div class="head-tools">
						<span class="n">{count} {count === 1 ? 'project' : 'projects'}</span>
						<div class="pres" role="group" aria-label="show the projects as">
							<button type="button" aria-pressed={presentation === 'list'} onclick={() => onpresentation('list')}>list</button>
							<button type="button" aria-pressed={presentation === 'map'} onclick={() => onpresentation('map')}>map</button>
						</div>
					</div>
				</div>

				{#if presentation === 'map'}
					<ProjectMap {projects} {service} onselect={onservice} {onopen} />
				{:else}
					<!-- one button per project: title, tag, the approved summary and the service, all unclipped -->
					<ol class="rows" aria-label="projects">
						{#each list as p (p.id)}
							{@const svc = serviceById(p.service)!}
							<li>
								<button type="button" class="row" data-project={p.id} aria-labelledby="row-{p.id}-title" aria-describedby="row-{p.id}-summary" onclick={(e) => onopen(p.id, e.currentTarget)}>
									<span class="row-svc">{svc.short}</span>
									<span class="row-title" id="row-{p.id}-title">{p.title}{#if p.tag}<span class="row-tag">{p.tag}</span>{/if}</span>
									<span class="row-summary" id="row-{p.id}-summary">{p.summary}</span>
									<span class="row-open" aria-hidden="true">open the case study &rarr;</span>
								</button>
							</li>
						{/each}
					</ol>
				{/if}
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
	/* the select: a 16px native control (no zoom-on-focus on a phone), 48px tall */
	.svc-select { display: none; gap: 6px; }
	.svc-select label { font-size: 14px; font-weight: 500; }
	.svc-select select { font: inherit; font-size: 16px; min-height: 48px; padding: 0 40px 0 14px; width: 100%; border: 1px solid var(--border-strong); background: var(--surface-2); color: var(--text); border-radius: var(--radius); appearance: none; -webkit-appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--accent-deep) 50%), linear-gradient(135deg, var(--accent-deep) 50%, transparent 50%); background-position: calc(100% - 20px) 50%, calc(100% - 14px) 50%; background-size: 6px 6px, 6px 6px; background-repeat: no-repeat; }
	.svc-select select:focus-visible { outline: 2px solid var(--accent-deep); outline-offset: 1px; }
	.index-main { min-width: 0; }
	.index-head { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px 24px; margin-bottom: 24px; }
	.head-text { flex: 1 1 320px; min-width: 0; }
	.index-head h2 { font-size: clamp(1.5rem, 2.4vw, 2rem); }
	.index-head p { font-size: 16px; color: var(--muted); max-width: 60ch; margin-top: 6px; }
	/* the count and the list / map switch sit on the baseline of the heading block, right-aligned */
	.head-tools { margin-left: auto; flex: none; display: flex; align-items: center; gap: 10px; }
	.index-head .n { font-size: 13px; color: var(--muted); font-weight: 500; white-space: nowrap; border: 1px solid var(--border); padding: 8px 12px; }
	.pres { display: inline-flex; border: 1px solid var(--border); background: var(--surface); }
	.pres button { min-height: 36px; min-width: 44px; padding: 0 12px; font-size: 13px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); transition: background-color 0.15s ease, color 0.15s ease; }
	.pres button:hover { color: var(--text); }
	.pres button[aria-pressed="true"] { background: var(--accent-deep); color: var(--on-accent); }
	.pres button:focus-visible { outline-offset: -2px; }
	/* the rows: full title and summary, one 44px+ button each, with room between neighbours */
	.rows { display: grid; gap: 10px; }
	.row { display: grid; gap: 6px; width: 100%; text-align: left; padding: 16px 18px; border: 1px solid var(--border); background: var(--surface); transition: border-color 0.15s ease, background-color 0.15s ease; }
	.row:hover { border-color: var(--accent); background: var(--surface-2); }
	.row-svc { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500; color: var(--accent); }
	.row-title { font-family: var(--font-head); font-weight: 600; font-size: 18px; line-height: 1.3; letter-spacing: -0.005em; }
	.row-tag { display: block; font-family: var(--font-body); font-weight: 400; font-size: 15px; color: var(--muted); letter-spacing: 0; margin-top: 2px; }
	.row-summary { font-size: 16px; line-height: 1.6; color: var(--text); }
	.row-open { font-size: 14px; font-weight: 500; color: var(--accent-deep); margin-top: 2px; }
	.row:hover .row-open { color: var(--accent); }
	@media (min-width: 961px) {
		.rows { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
	}
	@media (max-width: 960px) {
		.index-layout { grid-template-columns: 1fr; gap: 24px; padding-top: 24px; }
		.svc-nav { position: static; }
		.svc-nav h2, .svc-list, .hint { display: none; }
		.svc-select { display: grid; }
		.index-head { margin-bottom: 16px; gap: 12px 16px; }
		.index-head p { font-size: 15px; }
		.head-tools { margin-left: 0; width: 100%; justify-content: space-between; }
		.pres button { min-height: 44px; padding: 0 16px; font-size: 14px; }
	}
	@media (max-width: 760px) {
		.index-top { grid-template-columns: 1fr; gap: 16px; padding-bottom: 20px; }
		.index-top .lede { font-size: 17px; }
		.index-top .btn { width: 100%; white-space: normal; text-align: center; }
		.index { padding-top: 20px; }
		.row { padding: 14px 16px; }
		.row-svc { font-size: 13px; }
	}
</style>
