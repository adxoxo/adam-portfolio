<script lang="ts">
	import { archived, type Project } from '$lib/data/projects';
	import { openDetail } from '$lib/state/app.svelte';

	let { projects }: { projects: Project[] } = $props();
	const arch = $derived(
		[...archived(projects)].sort((a, b) => (b.year || '').localeCompare(a.year || ''))
	);
	const loop = $derived([...arch, ...arch]);
	const dur = $derived(arch.length * 7 + 's');
</script>

<div class="marquee">
	<div class="mtrack" style:--dur={dur}>
		{#each loop as p, i (i)}
			{#if p.github}
				<a class="acard" href={p.github} target="_blank" rel="noopener">
					<span class="yr mono">{p.year}</span>
					<h4>{p.title}</h4>
					<span class="st">{p.stack.join(', ')}</span>
					<span class="ext">open repo &#8599;</span>
				</a>
			{:else}
				<button class="acard" onclick={() => openDetail(p)}>
					<span class="yr mono">{p.year}</span>
					<h4>{p.title}</h4>
					<span class="st">{p.stack.join(', ')}</span>
				</button>
			{/if}
		{/each}
	</div>
</div>
