<script lang="ts">
	import { SERVICES, STACK } from '$lib/data/services';
	import StackLogos from './StackLogos.svelte';
</script>

<section class="section" id="services">
	<div class="wrap">
		<div class="sec-head">
			<span class="label">what i do</span>
			<span class="mono" style="color:var(--ink-soft)">full-stack, ai, cloud, embedded</span>
		</div>

		<div class="svc-list">
			{#each SERVICES as s, i (s.title)}
				<div class="svc">
					<span class="svc-i mono">{(i + 1).toString().padStart(2, '0')}</span>
					<h3>{s.title}</h3>
					<p>{s.desc}</p>
				</div>
			{/each}
		</div>

		<div class="stack">
			<span class="label">the stack</span>
			<div class="stack-groups">
				{#each STACK as g (g.label)}
					<div class="stack-g">
						<span class="stack-glabel mono">{g.label}</span>
						<StackLogos stack={g.items} variant="stack" />
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
