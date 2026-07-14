<script lang="ts">
	import {
		PROJECTS,
		HUBS,
		CONNECTIONS,
		CLUSTERS,
		CLUSTER_LABEL,
		type Cluster
	} from '$lib/data/projects';
	import { view, panel, openPanel } from '$lib/state/app.svelte';

	let canvas = $state<HTMLDivElement>();
	let wires = $state<string[]>([]);
	let reduce = $state(false);

	function computeWires() {
		if (!canvas) return;
		const cRect = canvas.getBoundingClientRect();
		if (!cRect.width) return;
		const paths: string[] = [];
		for (const [a, b] of CONNECTIONS) {
			const na = canvas.querySelector<HTMLElement>(`#node-${a}`);
			const nb = canvas.querySelector<HTMLElement>(`#node-${b}`);
			if (!na || !nb) continue;
			const ra = na.getBoundingClientRect();
			const rb = nb.getBoundingClientRect();
			const x1 = ra.left + ra.width / 2 - cRect.left;
			const y1 = ra.top + ra.height / 2 - cRect.top;
			const x2 = rb.left + rb.width / 2 - cRect.left;
			const y2 = rb.top + rb.height / 2 - cRect.top;
			const mx = (x1 + x2) / 2;
			paths.push(`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
		}
		wires = paths;
	}

	// recompute when the map becomes visible (mode/reveal change) or on resize
	$effect(() => {
		const visible = view.mode === 'map' || view.revealing;
		if (visible) requestAnimationFrame(() => requestAnimationFrame(computeWires));
	});

	$effect(() => {
		reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let t: ReturnType<typeof setTimeout>;
		const onResize = () => {
			clearTimeout(t);
			t = setTimeout(computeWires, 120);
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	const inCluster = (cl: Cluster) => PROJECTS.filter((p) => p.cluster === cl);
</script>

<div class="map-view" aria-label="project map">
	<div class="map-bg" aria-hidden="true"></div>

	<div class="map-canvas" bind:this={canvas}>
		<svg class="wires" aria-hidden="true" preserveAspectRatio="none">
			{#each wires as d}
				<path class="wire" {d}></path>
				{#if !reduce}<path class="wire-pulse" {d}></path>{/if}
			{/each}
		</svg>

		{#each HUBS as h}
			<div
				id="node-{h.id}"
				class="node {h.type === 'center' ? 'center-node' : 'hub'}"
				style="left:{h.x}%; top:{h.y}%"
				aria-hidden="true"
			>
				{h.label}
			</div>
		{/each}

		{#each PROJECTS as p}
			<button
				id="node-{p.id}"
				class="node pnode {p.status === 'featured' ? 'featured' : 'pill'}"
				class:active={panel.open && panel.project?.id === p.id}
				style="left:{p.x}%; top:{p.y}%"
				onclick={() => openPanel(p)}
				aria-label="{p.title}, open detail"
			>
				{#if p.status === 'featured'}
					<span class="n-status"
						><span class="sq" aria-hidden="true"></span><span class="mono">{p.cluster}</span></span
					>
					<span class="n-title">{p.title}</span>
				{:else}
					<span class="mono">{p.title}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="map-rail">
		{#each CLUSTERS as cl}
			{#if inCluster(cl).length}
				<div class="rail-cluster">
					<span class="label">{CLUSTER_LABEL[cl]}</span>
					{#each inCluster(cl) as p}
						<button class="rail-item" onclick={() => openPanel(p)}>
							<span class="r-title">{p.title}</span><span class="mono">{p.year}</span>
						</button>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
</div>
