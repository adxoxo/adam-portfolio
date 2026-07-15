import { crossfade } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

// Shared crossfade pair: a project card/node "sends", the detail modal
// "receives", so the clicked box appears to grow into the detail (and shrink
// back on close). Keyed by project id.
export const [send, receive] = crossfade({
	duration: (d) => Math.min(520, 90 + Math.sqrt(d) * 26),
	easing: cubicOut,
	fallback(node) {
		const style = getComputedStyle(node);
		const transform = style.transform === 'none' ? '' : style.transform;
		return {
			duration: 300,
			easing: cubicOut,
			css: (t, u) => `transform: ${transform} scale(${1 - u * 0.04}); opacity: ${t}`
		};
	}
});
