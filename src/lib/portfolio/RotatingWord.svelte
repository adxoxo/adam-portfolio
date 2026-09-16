<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';

	// One word at a time, fade + 8px slide, like the changing word on a marketing
	// headline: the current word fades out moving 8px down, the next one starts
	// 8px down and fades in to the baseline. Every word is rendered in the same grid cell, so the box is always
	// as wide and as tall as the longest word and nothing around it moves.
	// Decorative: the parent keeps a static first word in the accessible name.
	let {
		words,
		hold = 1500,
		phase = 280
	}: {
		words: string[];
		hold?: number; // how long a word stays readable
		phase?: number; // fade / slide duration, one way
	} = $props();

	let index = $state(0);
	let leaving = $state(false);
	let box = $state<HTMLSpanElement>();
	let inView = $state(true);
	let visibility = $state<DocumentVisibilityState>('visible');

	const reduced = $derived(prefersReducedMotion.current);
	const shown = $derived(reduced ? 0 : index);
	const running = $derived(!reduced && inView && visibility === 'visible');

	// only while on screen
	$effect(() => {
		if (!box || typeof IntersectionObserver === 'undefined') return;
		const io = new IntersectionObserver(([en]) => (inView = en.isIntersecting), { threshold: 0.1 });
		io.observe(box);
		return () => io.disconnect();
	});

	// the cycle: hold, fade the current word out, swap, fade the next one in.
	// Stopping clears the pending timer and lets a half-faded word settle back;
	// resuming starts a fresh hold from the word that is showing (no catch-up).
	$effect(() => {
		if (!running) return;
		let timer: ReturnType<typeof setTimeout>;
		const out = () => {
			leaving = true;
			timer = setTimeout(swap, phase);
		};
		const swap = () => {
			index = (index + 1) % words.length;
			leaving = false;
			timer = setTimeout(out, hold + phase);
		};
		timer = setTimeout(out, hold);
		return () => {
			clearTimeout(timer);
			leaving = false;
		};
	});
</script>

<svelte:document bind:visibilityState={visibility} />

<span class="rotor" class:reduced bind:this={box} aria-hidden="true" data-word={words[shown]} data-running={running} style:--phase="{phase}ms">
	{#each words as w, i (w)}
		<span class="word" class:current={i === shown} class:leaving={i === shown && leaving}>{w}</span>
	{/each}
</span>

<style>
	.rotor { display: inline-grid; grid-template-columns: max-content; text-align: left; vertical-align: top; }
	.word { grid-area: 1 / 1; justify-self: start; opacity: 0; transform: translateY(8px); transition: opacity var(--phase, 280ms) ease, transform var(--phase, 280ms) ease; will-change: opacity, transform; white-space: nowrap; }
	.word.current { opacity: 1; transform: translateY(0); }
	.word.leaving { opacity: 0; transform: translateY(8px); }
	.reduced .word { transition: none; }
</style>
