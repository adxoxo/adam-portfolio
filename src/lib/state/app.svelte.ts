// Shared UI state (Svelte 5 runes). Mutate the exported objects' properties.
import type { Project } from '$lib/data/projects';

type Mode = 'site' | 'map';

export const view = $state<{ r: number; mode: Mode; revealing: boolean }>({
	r: 0,
	mode: 'site',
	revealing: false
});

// the currently opened project (drives the detail modal). `from` records which
// surface it was opened from and keys the crossfade: 'map'/'tree' nodes "send"
// so the modal morphs out of the tapped node, while 'feat'/'arch' don't send, so
// the modal falls back to a still scale+fade and the site grid never moves.
export type DetailFrom = 'feat' | 'map' | 'tree' | 'arch';
export const detail = $state<{ project: Project | null; from: DetailFrom }>({
	project: null,
	from: 'feat'
});

// contact / booking modal
export const contact = $state<{ open: boolean; view: 'menu' | 'book' }>({
	open: false,
	view: 'menu'
});

let raf = 0;
let savedScroll = 0;

function reduceMotion(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setR(v: number): void {
	view.r = v < 0 ? 0 : v > 1 ? 1 : v;
}

export function beginReveal(): void {
	if (view.mode === 'site' && typeof window !== 'undefined') savedScroll = window.scrollY;
	view.revealing = true;
}

function settle(mode: Mode): void {
	if (raf) cancelAnimationFrame(raf);
	raf = 0;
	view.revealing = false;
	view.mode = mode;
	view.r = mode === 'map' ? 1 : 0;
	if (mode === 'site') {
		closeDetail();
		if (typeof window !== 'undefined')
			requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, savedScroll)));
	}
}

// target: 0 = site, 1 = map
export function animateTo(target: number): void {
	if (reduceMotion()) {
		settle(target >= 0.5 ? 'map' : 'site');
		return;
	}
	beginReveal();
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

export function openDetail(p: Project, from: DetailFrom = 'feat'): void {
	detail.from = from;
	detail.project = p;
}
export function closeDetail(): void {
	// leave `from` untouched so the outgoing morph keeps the key it entered with
	detail.project = null;
}

export function openContact(): void {
	contact.view = 'menu';
	contact.open = true;
}
export function closeContact(): void {
	contact.open = false;
}
export function setContactView(v: 'menu' | 'book'): void {
	contact.view = v;
}
