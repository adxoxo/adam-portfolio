<script lang="ts">
	// Fonts only. The public page (/) and the admin (/admin) each import their
	// own stylesheet, so the two designs never share a class name.
	import '$lib/styles/fonts.css';
	// the aquryu mark, generated from src/lib/assets/mark.png by scripts/gen-favicon.cjs;
	// imported so the url carries a content hash and browsers pick up a new icon
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/png" sizes="512x512" href={favicon} />
</svelte:head>

{@render children()}
