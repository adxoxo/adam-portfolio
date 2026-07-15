import { cubicOut } from 'svelte/easing';

interface PopParams {
	duration?: number;
}

// Self-contained modal entrance: a subtle rise + slight scale + fade. Used by the
// project detail and contact modals. It deliberately does NOT crossfade from the
// clicked card, so opening a modal never moves or reflows the cards / nodes behind
// it. Respects prefers-reduced-motion (fades only, no transform).
export function panelPop(_node: Element, { duration = 260 }: PopParams = {}) {
	const reduce =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reduce) return { duration: 120, css: (t: number) => `opacity: ${t}` };
	return {
		duration,
		easing: cubicOut,
		css: (t: number, u: number) =>
			`opacity: ${t}; transform: translateY(${u * 12}px) scale(${1 - u * 0.03})`
	};
}
