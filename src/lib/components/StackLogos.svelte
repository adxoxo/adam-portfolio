<script lang="ts">
	import { techIcon } from '$lib/data/tech';

	// Renders a project's stack as brand logos. Each logo sits on a constant light
	// tile (--logo-surface) so full-colour marks stay legible in both site (light)
	// and map (dark) modes. Labels with no logo fall back to a small text chip.
	let {
		stack,
		variant = 'card'
	}: { stack: string[]; variant?: 'card' | 'detail' | 'archive' | 'stack' } = $props();
</script>

<ul class="stack-logos {variant}" aria-label="stack">
	{#each stack as s (s)}
		{@const src = techIcon(s)}
		{#if src}
			<li class="logo" title={s}><img {src} alt={s} loading="lazy" /></li>
		{:else}
			<li class="txt">{s}</li>
		{/if}
	{/each}
</ul>

<style>
	.stack-logos {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.logo {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--logo-surface);
		border: 1px solid var(--border);
		border-radius: 6px;
	}
	.logo img {
		display: block;
		width: auto;
		object-fit: contain;
	}
	.txt {
		display: inline-flex;
		align-items: center;
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--ink-soft);
		text-transform: lowercase;
	}

	/* featured cards: compact */
	.card .logo {
		padding: 5px 6px;
	}
	.card .logo img {
		height: 16px;
	}
	.card .txt {
		padding: 4px 8px;
		font-size: 11px;
		letter-spacing: 0.02em;
	}

	/* detail modal: a touch larger */
	.detail .logo {
		padding: 6px 8px;
	}
	.detail .logo img {
		height: 20px;
	}
	.detail .txt {
		padding: 5px 9px;
		font-size: 12px;
	}

	/* archive marquee: smallest */
	.archive .logo {
		padding: 4px 5px;
	}
	.archive .logo img {
		height: 13px;
	}
	.archive .txt {
		padding: 3px 6px;
		font-size: 11px;
	}

	/* "the stack" section: the showcase, slightly larger */
	.stack .logo {
		padding: 6px 8px;
	}
	.stack .logo img {
		height: 18px;
	}
	.stack .txt {
		padding: 5px 9px;
		font-size: 12px;
	}
</style>
