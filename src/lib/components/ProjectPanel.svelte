<script lang="ts">
	import { panel, closePanel } from '$lib/state/app.svelte';
	import LoomEmbed from './LoomEmbed.svelte';

	let closeBtn = $state<HTMLButtonElement>();

	$effect(() => {
		if (panel.open && closeBtn) closeBtn.focus();
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closePanel();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<aside class="panel" class:open={panel.open} aria-label="project detail" aria-hidden={!panel.open}>
	{#if panel.project}
		{@const p = panel.project}
		<div class="panel-head">
			<div>
				<div class="mono">id: {p.id}</div>
				<h2>{p.title}</h2>
			</div>
			<button class="panel-close" bind:this={closeBtn} onclick={closePanel} aria-label="close panel"
				>&times;</button
			>
		</div>
		<div class="panel-body">
			{#if p.loom}<LoomEmbed id={p.loom} title={p.title} />{/if}
			<div class="panel-fig">
				<div class="schematic">
					{#each p.schematic as step, i}
						<span class="node-chip {i === p.schematic.length - 1 ? 'accent' : ''}">{step}</span>
						{#if i < p.schematic.length - 1}<span class="arrow">-&gt;</span>{/if}
					{/each}
				</div>
			</div>
			<p>{p.summary}</p>
			<ul class="panel-list">
				{#each p.outcomes as o}
					<li><span class="sq" aria-hidden="true"></span><span>{o}</span></li>
				{/each}
			</ul>
			<div class="chips">
				{#each p.stack as s}<span class="chip mono">{s}</span>{/each}
			</div>
			{#if p.github}
				<a class="btn" href={p.github} target="_blank" rel="noopener">view repository &#8599;</a>
			{/if}
		</div>
	{/if}
</aside>
