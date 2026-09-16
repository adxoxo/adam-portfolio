<script lang="ts">
	import { tick, untrack } from 'svelte';
	import Illustration from './Illustration.svelte';
	import type { Media } from './data';

	// One media slot per project: image, native video, click-to-load embed or
	// illustration. No media renders an honest placeholder in the same frame.
	let { media, title }: { media: Media | undefined; title: string } = $props();

	// image/video start "loading" as soon as they are rendered; the skeleton
	// stays until the browser fires load / loadedmetadata. Parents key this
	// component on the project, so a media change remounts it.
	const kind = $derived(media?.kind ?? 'none');
	let status = $state<'idle' | 'loading' | 'ready' | 'error'>(
		untrack(() => (media?.kind === 'image' || media?.kind === 'video' ? 'loading' : 'idle'))
	);
	let embedOpen = $state(false);
	let frame = $state<HTMLIFrameElement>();
	let loadBtn = $state<HTMLButtonElement>();

	const embedSrc = $derived(media?.kind === 'embed' ? `https://www.loom.com/embed/${media.id}` : '');
	const watchUrl = $derived(media?.kind === 'embed' ? `https://www.loom.com/share/${media.id}` : '');

	async function openEmbed() {
		embedOpen = true;
		await tick();
		frame?.focus();
	}
	async function closeEmbed() {
		embedOpen = false;
		await tick();
		loadBtn?.focus();
	}
</script>

<figure class="media" data-kind={kind} data-status={status}>
	<div class="frame" class:free={kind === 'illustration'}>
		{#if media?.kind === 'image'}
			{#if status !== 'error'}
				<img
					src={media.src}
					alt={media.alt}
					loading="lazy"
					decoding="async"
					onload={() => (status = 'ready')}
					onerror={() => (status = 'error')}
				/>
			{/if}
			{#if status === 'loading'}<div class="skeleton" aria-hidden="true"></div>{/if}
			{#if status === 'error'}
				<div class="placeholder"><span class="ico" aria-hidden="true"></span><b>screenshot could not be loaded</b><span>the image for {title} is not available right now.</span></div>
			{/if}
		{:else if media?.kind === 'video'}
			{#if status !== 'error'}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={media.src}
					poster={media.poster}
					controls
					playsinline
					preload="metadata"
					aria-label="{title}, demo video"
					onloadedmetadata={() => (status = 'ready')}
					onerror={() => (status = 'error')}
				></video>
			{/if}
			{#if status === 'loading'}<div class="skeleton" aria-hidden="true"></div>{/if}
			{#if status === 'error'}
				<div class="placeholder"><span class="ico" aria-hidden="true"></span><b>video could not be loaded</b><span>the demo video for {title} is not available right now.</span></div>
			{/if}
		{:else if media?.kind === 'embed'}
			{#if embedOpen}
				<iframe
					bind:this={frame}
					src={embedSrc}
					title={media.title}
					loading="lazy"
					allow="fullscreen"
					allowfullscreen
					referrerpolicy="strict-origin-when-cross-origin"
				></iframe>
				<button type="button" class="close-embed" onclick={closeEmbed}>close demo</button>
			{:else}
				<div class="poster">
					<span class="ico play" aria-hidden="true"></span>
					<b>{media.title}</b>
					<span class="quiet">nothing loads from loom until you ask. needs an internet connection.</span>
					<span class="row">
						<button type="button" class="btn btn--small" bind:this={loadBtn} onclick={openEmbed}>load the demo</button>
						<a class="textlink" href={watchUrl} target="_blank" rel="noopener">watch on loom</a>
					</span>
				</div>
			{/if}
		{:else if media?.kind === 'illustration'}
			<Illustration variant={media.variant} />
		{:else}
			<div class="placeholder">
				<span class="ico" aria-hidden="true"></span>
				<b>demo coming soon</b>
				<span>a screenshot or a short video of {title} will go here.</span>
			</div>
		{/if}
	</div>
	{#if media?.caption}
		<figcaption>{media.caption}</figcaption>
	{:else if !media}
		<figcaption>no screenshot yet. the case study below describes what it does.</figcaption>
	{/if}
</figure>

<style>
	/* the column has a zero minimum and the frame no automatic minimum width:
	   the frame's aspect-ratio would otherwise transfer its content height into
	   its min-content width (560px for the loom poster at 390px) and widen the
	   figure, and with it the whole dialog, past the viewport */
	.media { margin: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; min-width: 0; }
	/* 16:10 is the frame's minimum, so every project shares one footprint. The
	   frame is not a scroll container on purpose: with overflow hidden the ratio
	   would pin the height and cut off whatever is taller (the loom poster and
	   the placeholders on a phone, a portrait screenshot anywhere). In-flow
	   content makes the frame taller instead. */
	.frame { position: relative; aspect-ratio: 16 / 10; min-width: 0; border: 1px solid var(--border); background: var(--surface); display: grid; }
	.frame.free { align-items: center; padding: 18px; }
	.frame.free > :global(.shot-inner) { width: 100%; }
	/* only the loom iframe and the shimmer have no size of their own: they fill the frame */
	iframe, .skeleton { position: absolute; inset: 0; width: 100%; height: 100%; }
	/* a screenshot or a video keeps its own proportions at the frame width. A
	   landscape one sits centred in the 16:10 minimum; a taller one is capped
	   and letterboxed, never cropped. */
	img, video { display: block; width: 100%; height: auto; max-height: min(70vh, 560px); object-fit: contain; align-self: center; }
	video { background: #000; }
	iframe { border: 0; display: block; }
	.skeleton { background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
	@keyframes shimmer { to { background-position: -200% 0; } }
	.placeholder, .poster { display: grid; align-content: center; justify-items: center; gap: 6px; text-align: center; padding: 24px; font-size: 14px; color: var(--muted); background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 28px 28px; background-position: -1px -1px; }
	.placeholder { background-color: var(--surface); }
	.placeholder b, .poster b { font-family: var(--font-head); font-weight: 600; font-size: 15px; color: var(--text); }
	.ico { width: 34px; height: 34px; border: 1px solid var(--border-strong); background: var(--bg); display: block; margin-bottom: 8px; position: relative; }
	.ico::after { content: ""; position: absolute; left: 9px; top: 9px; width: 14px; height: 14px; background: var(--accent); opacity: 0.6; }
	.ico.play::after { width: 0; height: 0; background: none; opacity: 1; left: 12px; top: 10px; border-left: 12px solid var(--accent-deep); border-top: 7px solid transparent; border-bottom: 7px solid transparent; }
	.poster .quiet { font-size: 12px; max-width: 34ch; }
	.poster .row { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; justify-content: center; margin-top: 8px; }
	.close-embed { position: absolute; right: 8px; top: 8px; z-index: 2; min-height: 36px; padding: 0 12px; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; background: var(--bg); color: var(--text); border: 1px solid var(--border); }
	.close-embed:hover { background: var(--surface); }
	figcaption { font-size: 13px; color: var(--muted); line-height: 1.5; }
	@media (max-width: 480px) { .frame.free { padding: 12px; } }
</style>
