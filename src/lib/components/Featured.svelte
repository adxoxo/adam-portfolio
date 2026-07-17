<script lang="ts">
	import { featured, CLUSTER_LABEL, type Project } from '$lib/data/projects';
	import { openDetail } from '$lib/state/app.svelte';

	let { projects }: { projects: Project[] } = $props();
	const feats = $derived(featured(projects));

	// loom_thumb is loom's real oEmbed thumbnail (an animated gif), cached in the
	// db when the loom is saved in /admin, so the browser never calls loom. If it
	// is missing or fails, the card falls back to the branded panel below.
	let failed = $state<Record<string, boolean>>({});
</script>

<div class="feat-grid">
	{#each feats as p (p.id)}
		<button class="fcard" onclick={() => openDetail(p, 'feat')}>
			{#if p.loomThumb && !failed[p.id]}
				<div class="media video">
					<img
						class="media-img"
						src={p.loomThumb}
						alt=""
						loading="lazy"
						onerror={() => (failed[p.id] = true)}
					/>
					<span class="media-tag mono">watch walkthrough</span>
				</div>
			{:else if p.loom}
				<div class="media video">
					<span class="play" aria-hidden="true"></span>
					<span class="media-tag mono">watch walkthrough</span>
				</div>
			{:else if p.cover}
				<div class="media">
					<img class="media-img" src={p.cover} alt="" loading="lazy" />
				</div>
			{/if}
			<div class="top">
				<span class="chip mono">{CLUSTER_LABEL[p.cluster]}</span>
				<span class="mono" style="color:var(--ink-soft)">{p.year}</span>
			</div>
			<h3>{p.title}</h3>
			<p>{p.summary}</p>
			<div class="stk">{#each p.stack as s (s)}<span>{s}</span>{/each}</div>
			<span class="go">{p.loom ? 'watch + open' : 'open'} &#8599;</span>
		</button>
	{/each}
</div>

<style>
	/* full-bleed media strip at the top of the card (card padding is 26px) */
	.media {
		position: relative;
		margin: -26px -26px 0;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--panel);
		border-bottom: 1px solid var(--border);
	}
	.media-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	/* branded panel (+ square play badge) shown when a loom has no cached thumbnail */
	.media.video {
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(160deg, var(--panel), var(--bg));
	}
	.play {
		position: relative;
		z-index: 1;
		width: 48px;
		height: 48px;
		background: var(--accent);
		display: grid;
		place-items: center;
	}
	.play::after {
		content: '';
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 8px 0 8px 14px;
		border-color: transparent transparent transparent var(--on-accent);
		margin-left: 2px;
	}
	.media-tag {
		position: absolute;
		z-index: 1;
		left: 10px;
		bottom: 10px;
		background: var(--bg);
		color: var(--ink);
		padding: 4px 8px;
		border: 1px solid var(--border);
	}
	.fcard:hover .media {
		border-bottom-color: var(--accent);
	}
	.fcard:hover .play {
		background: var(--accent-hover);
	}
</style>
