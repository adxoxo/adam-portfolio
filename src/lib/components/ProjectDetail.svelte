<script lang="ts">
	import { detail, closeDetail } from '$lib/state/app.svelte';
	import { CLUSTER_LABEL } from '$lib/data/projects';
	import { fade } from 'svelte/transition';
	import { send, receive } from '$lib/transition';
	import LoomEmbed from './LoomEmbed.svelte';
	import StackLogos from './StackLogos.svelte';

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeDetail();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if detail.project}
	{@const p = detail.project}
	{@const key = detail.from + ':' + p.id}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="morph-backdrop" onclick={closeDetail} transition:fade={{ duration: 200 }}></div>
	<div class="morph-wrap">
		<!-- opened from the map/tree: the tapped node "sent", so this morphs out of it.
		     opened from featured/archive: no counterpart, so `receive` uses the still
		     fallback and the grid behind it never moves. -->
		<div class="morph" role="dialog" aria-modal="true" aria-label={p.title} in:receive={{ key }} out:send={{ key }}>
			<div class="m-inner">
				<div class="m-head">
					<div class="m-head-l">
						<span class="chip mono">{CLUSTER_LABEL[p.cluster]}</span>
						<h2>{p.title}</h2>
					</div>
					<button class="m-x" onclick={closeDetail} aria-label="close">&times;</button>
				</div>
				{#if p.loom}<LoomEmbed id={p.loom} title={p.title} />{/if}
				{#if p.live}
					<div class="live-frame">
						<iframe src={p.live} title="{p.title} live preview" loading="lazy"></iframe>
					</div>
				{/if}
				{#if p.cover && !p.loom && !p.live}
					<div class="cover-frame"><img src={p.cover} alt="" loading="lazy" /></div>
				{/if}
				<div class="fig">
					<div class="schem">
						{#each p.schematic as step, i (i)}
							<span class="chip2 {i === p.schematic.length - 1 ? 'a' : ''}">{step}</span>
							{#if i < p.schematic.length - 1}<span class="arrow">-&gt;</span>{/if}
						{/each}
					</div>
				</div>
				<p style="color:var(--ink);text-transform:lowercase">{p.summary}</p>
				{#if p.why}
					<p class="why">{p.why}</p>
				{/if}
				{#if p.features?.length}
					<div class="feats">
						<span class="mono feats-label">how it works</span>
						<div class="feat-list">
							{#each p.features as f, i (i)}
								<div class="feat">
									<span class="feat-k">{f.label}</span>
									<span class="feat-v">{f.detail}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				<div class="olist">
					{#each p.outcomes as o (o)}<div><i></i><span>{o}</span></div>{/each}
				</div>
				<StackLogos stack={p.stack} variant="detail" />
				{#if p.live || p.github}
					<div class="fd-links">
						{#if p.live}<a class="repo-link" href={p.live} target="_blank" rel="noopener">visit site &#8599;</a>{/if}
						{#if p.github}<a class="repo-link" href={p.github} target="_blank" rel="noopener">view repository &#8599;</a>{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* cover image shown in the modal when a project has an image but no video/live */
	.cover-frame { width: 100%; border: 1px solid var(--border); overflow: hidden; }
	.cover-frame img { display: block; width: 100%; height: auto; }
	/* short motivation line, set off from the summary with a left accent rule */
	.why {
		color: var(--ink-soft);
		text-transform: lowercase;
		font-size: 15px;
		line-height: 1.6;
		border-left: 2px solid var(--accent);
		padding-left: 14px;
	}
	/* "how it works": an eyebrow label over a list of labelled technical highlights */
	.feats {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.feats-label {
		color: var(--ink-soft);
	}
	.feat-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.feat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		border-left: 2px solid var(--border-strong);
		padding-left: 12px;
	}
	.feat-k {
		color: var(--accent);
		text-transform: lowercase;
		font-size: 13px;
		letter-spacing: 0.02em;
	}
	.feat-v {
		color: var(--ink);
		text-transform: lowercase;
		font-size: 14px;
		line-height: 1.55;
	}
</style>
