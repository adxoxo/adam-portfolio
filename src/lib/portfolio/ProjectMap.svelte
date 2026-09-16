<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { prefersReducedMotion } from 'svelte/motion';
	import { layoutFor } from './mapLayout';
	import type { Project, ServiceId } from './data';

	let {
		projects,
		service,
		onselect,
		onopen
	}: {
		projects: Project[];
		service: ServiceId | 'all';
		onselect: (svc: ServiceId | 'all') => void;
		onopen: (id: string, opener: HTMLElement | SVGElement) => void;
	} = $props();

	// narrow screens get the vertical tree, everything else the radial map
	const narrow = new MediaQuery('max-width: 640px');
	const layout = $derived(layoutFor(service, narrow.current, projects));

	// pan / zoom, in viewBox units. One measurement per gesture start, never per frame.
	let sc = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let svg = $state<SVGSVGElement>();
	let grabbing = $state(false);
	let unitsPerPx = 1;
	let panning = false;
	let lx = 0, ly = 0, moved = 0;

	function measure() {
		if (!svg) return;
		const r = svg.getBoundingClientRect();
		unitsPerPx = r.width ? layout.w / r.width : 1;
	}
	function zoomAt(cx: number, cy: number, ns: number) {
		ns = Math.min(3, Math.max(0.5, ns));
		tx = cx - (cx - tx) * (ns / sc);
		ty = cy - (cy - ty) * (ns / sc);
		sc = ns;
	}
	function zoomBtn(f: number) {
		zoomAt(layout.w / 2, layout.h / 2, sc * f);
	}
	function fit() {
		sc = 1;
		tx = 0;
		ty = 0;
	}
	function onWheel(e: WheelEvent) {
		if (!e.ctrlKey || !svg) return;
		e.preventDefault();
		measure();
		const r = svg.getBoundingClientRect();
		zoomAt((e.clientX - r.left) * unitsPerPx, (e.clientY - r.top) * unitsPerPx, sc * (1 - e.deltaY * 0.0016));
	}
	function onDown(e: PointerEvent) {
		if ((e.target as Element).closest('.node')) return;
		measure();
		panning = true;
		grabbing = true;
		moved = 0;
		lx = e.clientX;
		ly = e.clientY;
		svg?.setPointerCapture(e.pointerId);
	}
	function onMove(e: PointerEvent) {
		if (!panning) return;
		const dx = (e.clientX - lx) * unitsPerPx, dy = (e.clientY - ly) * unitsPerPx;
		moved += Math.abs(dx) + Math.abs(dy);
		tx += dx;
		ty += dy;
		lx = e.clientX;
		ly = e.clientY;
	}
	function onUp(e: PointerEvent) {
		if (!panning) return;
		panning = false;
		grabbing = false;
		if (svg?.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
	}
	function onKey(e: KeyboardEvent) {
		// arrow keys pan, + / - zoom, 0 fits. only when the canvas itself has focus
		if (e.target !== svg) return;
		const step = 40;
		if (e.key === 'ArrowLeft') tx += step;
		else if (e.key === 'ArrowRight') tx -= step;
		else if (e.key === 'ArrowUp') ty += step;
		else if (e.key === 'ArrowDown') ty -= step;
		else if (e.key === '+' || e.key === '=') zoomBtn(1.25);
		else if (e.key === '-') zoomBtn(1 / 1.25);
		else if (e.key === '0') fit();
		else return;
		e.preventDefault();
	}

	// motion: pulses run only while the map is on screen, never under
	// prefers-reduced-motion, and the visitor can pause them
	let paused = $state(false);
	let inView = $state(true);
	const pulses = $derived(!prefersReducedMotion.current);
	const running = $derived(pulses && !paused && inView);
	$effect(() => {
		if (!svg || typeof IntersectionObserver === 'undefined') return;
		const io = new IntersectionObserver(([en]) => (inView = en.isIntersecting), { threshold: 0.05 });
		io.observe(svg);
		return () => io.disconnect();
	});

	function activate(e: KeyboardEvent, fn: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			fn();
		}
	}
	function hubClick(svc: ServiceId) {
		onselect(service === svc ? 'all' : svc);
	}
</script>

<div class="map-wrap" class:grabbing>
	<!-- the svg is a pannable canvas (drag, arrows, +/-); every node inside is its own role=button -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<svg
		bind:this={svg}
		class="map"
		class:paused={!running}
		viewBox="0 0 {layout.w} {layout.h}"
		role="group"
		aria-label="project map. arrow keys pan, plus and minus zoom, 0 fits"
		tabindex="0"
		onwheel={onWheel}
		onpointerdown={onDown}
		onpointermove={onMove}
		onpointerup={onUp}
		onpointercancel={onUp}
		onkeydown={onKey}
	>
		<defs>
			<clipPath id="map-portrait"><circle r="15" /></clipPath>
		</defs>
		<g class="stage" transform="translate({tx} {ty}) scale({sc})">
			<g class="wires" aria-hidden="true">
				{#each layout.wires as w, i (w.id)}
					<path class="wire" class:on={w.svc !== 'root' && w.svc === service} d={w.d} />
					{#if pulses}
						<path class="pulse" d={w.d} pathLength="100" style:animation-delay="-{(i * 0.53) % 3.6}s" style:animation-duration="{w.svc === 'root' ? 4.4 : 3.6}s" />
					{/if}
				{/each}
			</g>
			{#each layout.nodes as n (n.id)}
				{#if n.kind === 'root'}
					<g class="node root" style:transform="translate({n.x}px, {n.y}px)" aria-hidden="true">
						<rect x={-n.w / 2} y={-n.h / 2} width={n.w} height={n.h} rx="22" />
						<g transform="translate({-n.w / 2 + 22} 0)">
							<image href="/adam.jpg" x="-15" y="-15" width="30" height="30" preserveAspectRatio="xMidYMin slice" clip-path="url(#map-portrait)" />
						</g>
						<text x={-n.w / 2 + 46} y="1" class="root-t">adam</text>
					</g>
				{:else if n.kind === 'hub'}
					<g
						class="node hub"
						class:on={service === n.svc}
						style:transform="translate({n.x}px, {n.y}px)"
						role="button"
						tabindex="0"
						aria-pressed={service === n.svc}
						aria-label="{n.label}, {n.count} projects, show only this service"
						data-svc={n.svc}
						onclick={() => hubClick(n.svc!)}
						onkeydown={(e) => activate(e, () => hubClick(n.svc!))}
					>
						<rect x={-n.w / 2} y={-n.h / 2} width={n.w} height={n.h} />
						<text x={-n.w / 2 + 14} y="1" class="hub-t">{n.label}</text>
						<text x={n.w / 2 - 14} y="1" class="hub-c" text-anchor="end">{n.count}</text>
					</g>
				{:else}
					<g
						class="node project"
						class:featured={n.featured}
						style:transform="translate({n.x}px, {n.y}px)"
						role="button"
						tabindex="0"
						aria-label="{n.label}, open case study"
						data-project={n.projectId}
						onclick={(e) => onopen(n.projectId!, e.currentTarget)}
						onkeydown={(e) => activate(e, () => onopen(n.projectId!, e.currentTarget))}
					>
						<rect x={-n.w / 2} y={-n.h / 2} width={n.w} height={n.h} />
						{#if n.featured}<rect class="dot" x={-n.w / 2 + 10} y="-3" width="6" height="6" />{/if}
						<text x={-n.w / 2 + (n.featured ? 24 : 14)} y="1" class="proj-t">{n.label}</text>
					</g>
				{/if}
			{/each}
		</g>
	</svg>

	<div class="ctrl" role="group" aria-label="map controls">
		<button type="button" onclick={() => zoomBtn(1.25)} aria-label="zoom in">+</button>
		<button type="button" onclick={() => zoomBtn(1 / 1.25)} aria-label="zoom out">&#8722;</button>
		<button type="button" onclick={fit} aria-label="fit the map">fit</button>
		{#if pulses}
			<button type="button" class="motion" onclick={() => (paused = !paused)} aria-pressed={paused} aria-label={paused ? 'resume motion' : 'pause motion'}>
				{#if paused}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" /></svg>{:else}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z" /></svg>{/if}
			</button>
		{/if}
	</div>
</div>
<p class="legend">
	<span class="r">adam</span><span class="h">service, click to focus</span><span class="p">project, click to open</span>
	<span class="plain hint">drag to pan &middot; ctrl + scroll to zoom</span>
	{#if pulses}<span class="plain">{paused ? 'motion paused' : 'the moving dots show where work flows'}</span>{:else}<span class="plain">motion off, following your system setting</span>{/if}
</p>

<style>
	.map-wrap { position: relative; border: 1px solid var(--border); background-color: var(--bg); background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 66px 66px; background-position: -1px -1px; overflow: hidden; }
	.map { display: block; width: 100%; height: auto; max-height: 78vh; cursor: grab; touch-action: pan-y; font-family: var(--font-body); }
	@media (pointer: fine) { .map { touch-action: none; } }
	.map:focus-visible { outline-offset: -3px; }
	.grabbing .map { cursor: grabbing; }
	.stage { will-change: transform; }

	.wire { fill: none; stroke: var(--border-strong); stroke-width: 1.2; vector-effect: non-scaling-stroke; opacity: 0.9; }
	.wire.on { stroke: var(--accent); opacity: 0.8; }
	.pulse { fill: none; stroke: var(--accent); stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: 5 95; stroke-dashoffset: 0; vector-effect: non-scaling-stroke; animation: flow 3.6s linear infinite; }
	.paused .pulse { animation-play-state: paused; }
	@keyframes flow { to { stroke-dashoffset: -100; } }

	.node { transition: transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1); }
	.node rect { fill: var(--surface); stroke: var(--border-strong); stroke-width: 1; vector-effect: non-scaling-stroke; }
	.node text { dominant-baseline: middle; fill: var(--text); font-size: 13px; pointer-events: none; user-select: none; }
	.root rect { fill: var(--accent-deep); stroke: var(--accent-deep); }
	.root-t { font-family: var(--font-head); font-weight: 700; font-size: 16px; fill: var(--on-accent) !important; }
	.hub { cursor: pointer; }
	.hub rect { fill: var(--bg); stroke: var(--accent); stroke-dasharray: 4 3; }
	.hub-t { font-family: var(--font-head); font-weight: 600; fill: var(--accent) !important; letter-spacing: 0.02em; }
	.hub-c { fill: var(--muted) !important; font-size: 11px; font-weight: 500; }
	.hub.on rect { fill: var(--accent-deep); stroke: var(--accent-deep); stroke-dasharray: none; }
	.hub.on .hub-t, .hub.on .hub-c { fill: var(--on-accent) !important; }
	.hub:hover:not(.on) rect { fill: var(--surface-2); }
	.project { cursor: pointer; }
	.project rect { fill: var(--surface-2); }
	.project .dot { fill: var(--accent); stroke: none; }
	.project:hover rect { stroke: var(--accent); }
	.project:hover .proj-t { fill: var(--accent); }
	.node:focus { outline: none; }
	.node:focus-visible rect:first-child { stroke: var(--accent); stroke-width: 2.5; }

	.ctrl { position: absolute; right: 12px; bottom: 12px; z-index: 2; display: grid; gap: 6px; }
	.ctrl button { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); font-size: 18px; font-weight: 500; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
	.ctrl button:hover { border-color: var(--accent); color: var(--accent); }
	.ctrl button[aria-label="fit the map"] { font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; }
	.ctrl .motion svg { width: 14px; height: 14px; fill: currentColor; }
	.ctrl .motion[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); }
	.legend { margin-top: 16px; font-size: 13px; color: var(--muted); display: flex; flex-wrap: wrap; gap: 6px 20px; }
	.legend span::before { content: ""; display: inline-block; width: 10px; height: 10px; margin-right: 8px; vertical-align: -1px; border: 1px solid var(--border-strong); background: var(--surface-2); }
	.legend span.r::before { background: var(--accent-deep); border-color: var(--accent-deep); }
	.legend span.h::before { border: 1px dashed var(--accent); background: var(--bg); }
	.legend span.plain { margin-left: auto; }
	.legend span.plain + span.plain { margin-left: 0; }
	.legend span.plain::before { display: none; }
	@media (max-width: 640px) {
		.map { max-height: none; touch-action: pan-y; }
		.ctrl { position: static; grid-auto-flow: column; justify-content: end; padding: 10px; border-top: 1px solid var(--border); }
		.legend span.plain { margin-left: 0; width: 100%; }
		.legend .hint { display: none; }
	}
</style>
