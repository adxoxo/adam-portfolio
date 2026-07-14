// Shared reveal + panel state (Svelte 5 runes). Mutate the exported objects'
// properties; components that read them react automatically.
import type { Project } from '$lib/data/projects';

type Mode = 'site' | 'map';

export const view = $state<{ r: number; mode: Mode; revealing: boolean }>({
	r: 0,
	mode: 'site',
	revealing: false
});

export const panel = $state<{ open: boolean; project: Project | null }>({
	open: false,
	project: null
});

let raf = 0;

function reduceMotion(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setR(v: number): void {
	view.r = v < 0 ? 0 : v > 1 ? 1 : v;
}

export function beginReveal(): void {
	view.revealing = true;
}

function settle(mode: Mode): void {
	if (raf) cancelAnimationFrame(raf);
	raf = 0;
	view.revealing = false;
	view.mode = mode;
	view.r = mode === 'map' ? 1 : 0;
	if (mode === 'site') closePanel();
}

// target: 0 = site, 1 = map
export function animateTo(target: number): void {
	if (reduceMotion()) {
		settle(target >= 0.5 ? 'map' : 'site');
		return;
	}
	view.revealing = true;
	const start = view.r;
	let t0 = 0;
	const step = (ts: number) => {
		if (!t0) t0 = ts;
		const k = Math.min(1, (ts - t0) / 400);
		const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
		setR(start + (target - start) * e);
		if (k < 1) raf = requestAnimationFrame(step);
		else settle(target >= 0.5 ? 'map' : 'site');
	};
	raf = requestAnimationFrame(step);
}

export function openPanel(p: Project): void {
	panel.project = p;
	panel.open = true;
}

export function closePanel(): void {
	panel.open = false;
}
