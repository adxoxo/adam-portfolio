<script lang="ts">
	import {
		HUBS,
		CLUSTERS,
		CLUSTER_LABEL,
		buildConnections,
		type Cluster,
		type Project
	} from '$lib/data/projects';
	import { view, openDetail } from '$lib/state/app.svelte';

	let { projects }: { projects: Project[] } = $props();

	const connections = $derived(buildConnections(projects));
	const POS = $derived.by(() => {
		const m: Record<string, { x: number; y: number }> = {};
		for (const h of HUBS) m[h.id] = { x: h.x, y: h.y };
		for (const p of projects) m[p.id] = { x: p.x, y: p.y };
		return m;
	});
	const inCluster = (cl: Cluster) => projects.filter((p) => p.cluster === cl);

	let canvas = $state<HTMLDivElement>();
	let wires = $state<string[]>([]);
	let reduce = $state(false);
	let sc = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let grabbing = $state(false);

	function computeWires() {
		if (!canvas) return;
		const W = canvas.clientWidth;
		const H = canvas.clientHeight;
		if (!W) return;
		const out: string[] = [];
		for (const [a, b] of connections) {
			const pa = POS[a];
			const pb = POS[b];
			if (!pa || !pb) continue;
			const x1 = (pa.x / 100) * W,
				y1 = (pa.y / 100) * H,
				x2 = (pb.x / 100) * W,
				y2 = (pb.y / 100) * H,
				mx = (x1 + x2) / 2;
			out.push(`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
		}
		wires = out;
	}
	function zoomAt(mx: number, my: number, ns: number) {
		ns = Math.min(3, Math.max(0.4, ns));
		tx = mx - (mx - tx) * (ns / sc);
		ty = my - (my - ty) * (ns / sc);
		sc = ns;
	}
	function zoomBtn(factor: number) {
		if (!canvas) return;
		const r = canvas.getBoundingClientRect();
		zoomAt(r.width / 2, r.height / 2, sc * factor);
	}
	function resetView() {
		sc = 1;
		tx = 0;
		ty = 0;
	}

	// reset the view whenever we enter map mode
	$effect(() => {
		if (view.mode === 'map') resetView();
	});

	// (re)draw wires when the map becomes visible; keep them in sync on resize
	$effect(() => {
		const visible = view.mode === 'map' || view.revealing;
		if (visible && canvas) requestAnimationFrame(() => requestAnimationFrame(computeWires));
	});
	$effect(() => {
		reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let rt: ReturnType<typeof setTimeout>;
		const onResize = () => {
			clearTimeout(rt);
			rt = setTimeout(computeWires, 120);
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	// pan + zoom listeners (wheel needs passive:false; drag pans, ctrl+wheel zooms)
	$effect(() => {
		const el = canvas;
		if (!el) return;
		let panning = false,
			lx = 0,
			ly = 0;
		const onWheel = (e: WheelEvent) => {
			if (!e.ctrlKey) return;
			e.preventDefault();
			const r = el.getBoundingClientRect();
			zoomAt(e.clientX - r.left, e.clientY - r.top, sc * (1 - e.deltaY * 0.0016));
		};
		const onDown = (e: PointerEvent) => {
			if ((e.target as HTMLElement).closest('.pnode')) return;
			panning = true;
			grabbing = true;
			lx = e.clientX;
			ly = e.clientY;
			el.setPointerCapture(e.pointerId);
		};
		const onMove = (e: PointerEvent) => {
			if (!panning) return;
			tx += e.clientX - lx;
			ty += e.clientY - ly;
			lx = e.clientX;
			ly = e.clientY;
		};
		const onUp = (e: PointerEvent) => {
			if (!panning) return;
			panning = false;
			grabbing = false;
			try {
				el.releasePointerCapture(e.pointerId);
			} catch {
				/* ignore */
			}
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		el.addEventListener('pointerdown', onDown);
		el.addEventListener('pointermove', onMove);
		el.addEventListener('pointerup', onUp);
		el.addEventListener('pointercancel', onUp);
		return () => {
			el.removeEventListener('wheel', onWheel);
			el.removeEventListener('pointerdown', onDown);
			el.removeEventListener('pointermove', onMove);
			el.removeEventListener('pointerup', onUp);
			el.removeEventListener('pointercancel', onUp);
		};
	});
</script>

<div class="map-view" aria-label="project map">
	<div class="map-bg" aria-hidden="true"></div>

	<div class="canvas" bind:this={canvas}>
		<div class="stage" class:grab={grabbing} style:transform={`translate(${tx}px, ${ty}px) scale(${sc})`}>
			<svg class="wires" aria-hidden="true" preserveAspectRatio="none">
				{#each wires as d (d)}
					<path class="wire" {d}></path>
					{#if !reduce}<path class="wire-p" {d}></path>{/if}
				{/each}
			</svg>

			{#each HUBS as h (h.id)}
				<div
					class="node {h.type === 'center' ? 'center-node' : 'hub'}"
					style="left:{h.x}%; top:{h.y}%"
					aria-hidden="true"
				>
					{h.label}
				</div>
			{/each}

			{#each projects as p (p.id)}
				<button
					class="node pnode {p.status === 'featured' ? 'featured' : 'pill-n'}"
					style="left:{p.x}%; top:{p.y}%"
					onclick={() => openDetail(p, 'map')}
					aria-label="{p.title}, open detail"
				>
					{#if p.status === 'featured'}
						<span class="st"><i></i><span class="mono">{p.cluster}</span></span>
						<span class="t">{p.title}</span>
					{:else}
						<span class="mono">{p.title}</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div class="map-hint">hold ctrl and scroll to zoom, drag to pan</div>
	<div class="zoom-ctrl">
		<button onclick={() => zoomBtn(1.25)} aria-label="zoom in">+</button>
		<button onclick={() => zoomBtn(1 / 1.25)} aria-label="zoom out">&#8722;</button>
		<button onclick={resetView} aria-label="reset view">&#8226;</button>
	</div>

	<!-- mobile: the map reads as a vertical tree, one trunk with branching limbs -->
	<div class="tree">
		<div class="tbranch troot">
			<div class="thub-row">
				<span class="tdot"></span>
				<span class="thub-label">adam</span>
			</div>
		</div>
		{#each CLUSTERS as cl (cl)}
			{#if inCluster(cl).length}
				<div class="tbranch">
					<div class="thub-row">
						<span class="tdot"></span>
						<span class="thub-label">{CLUSTER_LABEL[cl]}</span>
					</div>
					<div class="tleaves">
						{#each inCluster(cl) as p (p.id)}
							<button
								class="tleaf {p.status === 'featured' ? 'featured' : ''}"
								onclick={() => openDetail(p, 'tree')}
								aria-label="{p.title}, open detail"
							>
								<span class="tl-t">{p.title}</span>
								<span class="mono tl-y">{p.year}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div>
