<script lang="ts">
	import { SOCIALS } from '$lib/data/socials';
</script>

<div class="socials">
	{#each SOCIALS as s (s.name)}
		<a
			class="social"
			href={s.url}
			title={s.name}
			aria-label={s.name}
			target={s.url.startsWith('http') ? '_blank' : undefined}
			rel={s.url.startsWith('http') ? 'noopener' : undefined}
		>
			{#if s.email}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="2" y="4.5" width="20" height="15" rx="1"></rect>
					<path d="M2.5 6l9.5 6.5L21.5 6"></path>
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={s.path}></path></svg>
			{/if}
		</a>
	{/each}
</div>
