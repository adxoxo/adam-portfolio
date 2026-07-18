<script lang="ts">
	import { archived, type Project } from '$lib/data/projects';
	import { openDetail } from '$lib/state/app.svelte';
	import StackLogos from './StackLogos.svelte';

	let { projects }: { projects: Project[] } = $props();
	const arch = $derived(
		[...archived(projects)].sort((a, b) => (b.year || '').localeCompare(a.year || ''))
	);

	// Endless marquee. The track is two identical halves; the animation shifts it left
	// by exactly one half (-50%), so the second half lands precisely where the first
	// started and the loop is seamless. Each half repeats the archive list `perHalf`
	// times: we measure the container against one sequence and repeat enough that a
	// half always overflows the viewport, so a card is on screen at every moment and
	// there is never an empty gap on wide screens. No js: perHalf stays 1 (two copies).
	const GAP = 14; // must match .mseq margin-right in app.css
	let containerW = $state(0);
	let seqW = $state(0);
	// how many times to repeat the list per half so a half always overflows the
	// viewport; 1 until the container and a sequence have been measured (or no js)
	const perHalf = $derived(
		containerW > 0 && seqW > 0 ? Math.max(1, Math.ceil(containerW / (seqW + GAP)) + 1) : 1
	);

	// extra (duplicate) sequences after the first real one
	const dupSeqs = $derived(Array.from({ length: 2 * perHalf - 1 }, (_, k) => k));
	// scale the duration with the half width so the pixel speed stays constant
	const dur = $derived(perHalf * Math.max(arch.length, 1) * 7 + 's');
</script>

{#snippet cards(dup: boolean)}
	{#each arch as p (p.id)}
		{#if p.github}
			<a
				class="acard"
				href={p.github}
				target="_blank"
				rel="noopener"
				tabindex={dup ? -1 : undefined}
			>
				<span class="yr mono">{p.year}</span>
				<h4>{p.title}</h4>
				<StackLogos stack={p.stack} variant="archive" text />
				<span class="ext">open repo &#8599;</span>
			</a>
		{:else}
			<button class="acard" onclick={() => openDetail(p, 'arch')} tabindex={dup ? -1 : undefined}>
				<span class="yr mono">{p.year}</span>
				<h4>{p.title}</h4>
				<StackLogos stack={p.stack} variant="archive" text />
			</button>
		{/if}
	{/each}
{/snippet}

<div class="marquee" bind:clientWidth={containerW}>
	<div class="mtrack" style:--dur={dur}>
		<div class="mseq" bind:clientWidth={seqW}>{@render cards(false)}</div>
		{#each dupSeqs as k (k)}
			<div class="mseq dup" aria-hidden="true">{@render cards(true)}</div>
		{/each}
	</div>
</div>
