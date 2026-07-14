<script lang="ts">
	// id = the share hash from a loom url, e.g. loom.com/share/<THIS>
	let { id, title = 'walkthrough' }: { id: string; title?: string } = $props();
</script>

<div class="loom">
	<iframe
		src="https://www.loom.com/embed/{id}"
		{title}
		loading="lazy"
		allowfullscreen
	></iframe>
</div>

<style>
	.loom {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border: 1px solid var(--border);
		background: var(--panel-2);
	}
	.loom iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}
</style>
