<script lang="ts">
	import { featured, CLUSTER_LABEL, type Project } from '$lib/data/projects';
	import { openDetail } from '$lib/state/app.svelte';

	let { projects }: { projects: Project[] } = $props();
	const feats = $derived(featured(projects));

	// Loom serves a still poster and an animated preview gif per video. The still
	// loads with the card (lightweight, no iframe); the animated gif is swapped in
	// only while the card is on screen, so scrolling the grid previews each video.
	const loomStill = (id: string) => `https://cdn.loom.com/sessions/thumbnails/${id}-with-play.jpg`;
	const loomAnim = (id: string) => `https://cdn.loom.com/sessions/thumbnails/${id}-with-play.gif`;
	let stillFailed = $state<Record<string, boolean>>({});
	let animFailed = $state<Record<string, boolean>>({});
	let inview = $state<Record<string, boolean>>({});

	// Mark a card in/out of view so its animated preview can mount only on screen.
	// Skipped under reduced-motion (the still poster stays), and it's a plain
	// image swap, so no video player ever loads in the grid.
	function preview(id: string) {
		return (node: HTMLElement) => {
			if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
			const io = new IntersectionObserver(([e]) => (inview[id] = e.isIntersecting), {
				threshold: 0.6
			});
			io.observe(node);
			return () => io.disconnect();
		};
	}
</script>

<div class="feat-grid">
	{#each feats as p (p.id)}
		<button class="fcard" onclick={() => openDetail(p, 'feat')}>
			{#if p.loom}
				<div class="media video" {@attach preview(p.id)}>
					{#if !stillFailed[p.id]}
						<img
							class="media-img"
							src={loomStill(p.loom)}
							alt=""
							loading="lazy"
							onerror={() => (stillFailed[p.id] = true)}
						/>
						{#if inview[p.id] && !animFailed[p.id]}
							<img
								class="media-img anim"
								src={loomAnim(p.loom)}
								alt=""
								loading="lazy"
								onerror={() => (animFailed[p.id] = true)}
							/>
						{/if}
					{:else}
						<span class="play" aria-hidden="true"></span>
					{/if}
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
	/* animated preview fades over the still once the card scrolls into view */
	.media-img.anim {
		animation: preview-in 0.3s ease both;
	}
	@keyframes preview-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	/* branded poster + square play badge, shown only when no loom thumbnail loads
	   (real loom thumbnails already carry their own play button) */
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
	@media (prefers-reduced-motion: reduce) {
		.media-img.anim {
			animation: none;
		}
	}
</style>
