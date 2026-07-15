<script lang="ts">
	import { featured, CLUSTER_LABEL, type Project } from '$lib/data/projects';
	import { detail, openDetail } from '$lib/state/app.svelte';
	import { send, receive } from '$lib/transition';

	let { projects }: { projects: Project[] } = $props();
	const feats = $derived(featured(projects));
</script>

<div class="feat-grid">
	{#each feats as p (p.id)}
		{#if detail.project?.id !== p.id}
			<button
				class="fcard"
				onclick={() => openDetail(p)}
				in:receive={{ key: p.id }}
				out:send={{ key: p.id }}
			>
				<div class="top">
					<span class="chip mono">{CLUSTER_LABEL[p.cluster]}</span>
					<span class="mono" style="color:var(--ink-soft)">{p.year}</span>
				</div>
				<h3>{p.title}</h3>
				<p>{p.summary}</p>
				<div class="stk">{#each p.stack as s (s)}<span>{s}</span>{/each}</div>
				<span class="go">open &#8599;</span>
			</button>
		{/if}
	{/each}
</div>
