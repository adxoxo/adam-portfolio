// Site <-> map switch. Browser-only code, called from event handlers. The reveal
// ratio is written straight to a CSS variable so the wipe follows the
// transition without re-rendering; the Qwik store only changes when a mode settles.

import type { Mode, SiteState } from '../state';
import { attachMap } from '../map/runtime';

const DURATION = 420;
const timers = new WeakMap<HTMLElement, number>();
const openers = new WeakMap<HTMLElement, HTMLElement>();

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function appEl(): HTMLElement | null {
	return document.querySelector<HTMLElement>('.app');
}

function setR(app: HTMLElement, value: number): number {
	const r = Math.min(1, Math.max(0, value));
	app.style.setProperty('--wipe', `${((1 - r) * 100).toFixed(2)}%`);
	app.dataset.r = String(r);
	return r;
}

function currentR(app: HTMLElement, state: SiteState): number {
	const v = Number(app.dataset.r);
	return Number.isFinite(v) ? v : state.mode === 'map' ? 1 : 0;
}

function beginReveal(app: HTMLElement, state: SiteState) {
	if (state.mode === 'site' && !app.hasAttribute('data-revealing')) {
		app.dataset.scroll = String(window.scrollY);
		const focused = document.activeElement;
		if (focused instanceof HTMLElement && app.contains(focused)) openers.set(app, focused);
		else openers.delete(app);
	}
	app.setAttribute('data-revealing', '');
}

function settle(app: HTMLElement, state: SiteState, mode: Mode) {
	const previousMode = state.mode;
	const raf = timers.get(app);
	if (raf) cancelAnimationFrame(raf);
	timers.delete(app);
	app.removeAttribute('data-revealing');
	app.dataset.mode = mode;
	setR(app, mode === 'map' ? 1 : 0);
	state.mode = mode;
	const toggle = app.querySelector<HTMLElement>('.pill-switch');
	toggle?.setAttribute('aria-checked', String(mode === 'map'));
	if (mode === 'map') {
		history.replaceState(history.state, '', '#map');
		attachMap(state, () => animateTo(state, 0));
		// motion effects load on the first open; every open replays their entry
		void import('../map/fx').then(({ attachMapFx, MAP_OPEN }) => {
			attachMapFx();
			document.dispatchEvent(new Event(MAP_OPEN));
		});
		const focused = document.activeElement;
		if (previousMode !== mode && (!(focused instanceof HTMLElement) || focused === document.body || !focused.getClientRects().length)) {
			app.querySelector<HTMLElement>('.map-port')?.focus({ preventScroll: true });
		}
	} else {
		history.replaceState(history.state, '', location.pathname + location.search);
		const y = Number(app.dataset.scroll ?? 0);
		const goto = app.dataset.goto;
		delete app.dataset.goto;
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
				if (goto) document.getElementById(goto)?.scrollIntoView({ behavior: 'auto', block: 'start' });
			})
		);
		const focused = document.activeElement;
		if (previousMode !== mode && (!(focused instanceof HTMLElement) || focused === document.body || !focused.getClientRects().length)) {
			const opener = openers.get(app);
			const target = opener?.isConnected && opener.getClientRects().length ? opener : toggle;
			target?.focus({ preventScroll: true });
		}
		openers.delete(app);
	}
}

/** Animates to the site (0) or the map (1). Reduced motion switches at once. */
export function animateTo(state: SiteState, target: 0 | 1) {
	const app = appEl();
	if (!app) return;
	const mode: Mode = target ? 'map' : 'site';
	beginReveal(app, state);
	if (reducedMotion()) return settle(app, state, mode);
	const prev = timers.get(app);
	if (prev) cancelAnimationFrame(prev);
	const start = currentR(app, state);
	let t0 = 0;
	const step = (ts: number) => {
		if (!t0) t0 = ts;
		const k = Math.min(1, (ts - t0) / DURATION);
		const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
		setR(app, start + (target - start) * e);
		if (k < 1) timers.set(app, requestAnimationFrame(step));
		else settle(app, state, mode);
	};
	timers.set(app, requestAnimationFrame(step));
}

/** Switch click: flips between the site and the map. */
export function toggleView(state: SiteState) {
	animateTo(state, state.mode === 'map' ? 0 : 1);
}

/** Jumps to a section of the site. From the map it returns to the site first. */
export function goToSection(state: SiteState, id: string) {
	const app = appEl();
	if (!app) return;
	if (state.mode === 'map') {
		app.dataset.goto = id;
		animateTo(state, 0);
		return;
	}
	document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

/** Opens the map at once, used for /#map deep links. */
export function openMapNow(state: SiteState) {
	const app = appEl();
	if (!app) return;
	beginReveal(app, state);
	settle(app, state, 'map');
}
