import { crossfade } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';

function reduced(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Crossfade morph used by the MAP only (canvas nodes + mobile tree): the tapped
// node "sends" and the detail modal "receives", so the node appears to grow into
// the modal and shrink back on close. This is safe on the map because nodes are
// absolutely positioned, so removing the tapped one never reflows the others.
//
// The SITE featured cards (and archive) deliberately do NOT send. When the modal
// is opened from there its `receive` finds no counterpart and uses `fallback`
// below (a still rise + scale + fade), so the featured grid never moves.
export const [send, receive] = crossfade({
	duration: (d) => Math.min(520, 90 + Math.sqrt(d) * 26),
	easing: cubicOut,
	fallback(node) {
		if (reduced()) return { duration: 120, css: (t: number) => `opacity: ${t}` };
		const style = getComputedStyle(node);
		const transform = style.transform === 'none' ? '' : style.transform;
		return {
			duration: 260,
			easing: cubicOut,
			css: (t: number, u: number) =>
				`opacity: ${t}; transform: ${transform} translateY(${u * 12}px) scale(${1 - u * 0.03})`
		};
	}
});
