// Site <-> map switch. Browser-only code, called from event handlers. The reveal
// ratio is written straight to CSS variables so the wipe and the knob follow the
// pointer without re-rendering; the Qwik store only changes when a mode settles.

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
	app.querySelector<HTMLElement>('.slider')?.style.setProperty('--r', String(r));
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
	const knob = app.querySelector<HTMLElement>('.knob');
	knob?.setAttribute('aria-valuenow', mode === 'map' ? '100' : '0');
	knob?.setAttribute('aria-valuetext', mode === 'map' ? 'project map' : 'site');
	if (mode === 'map') {
		history.replaceState(history.state, '', '#map');
		attachMap(state, () => animateTo(state, 0));
		const focused = document.activeElement;
		if (previousMode !== mode && (!(focused instanceof HTMLElement) || focused === document.body || !focused.getClientRects().length)) {
			app.querySelector<HTMLElement>('.map-port')?.focus({ preventScroll: true });
		}
	} else {
		history.replaceState(history.state, '', location.pathname + location.search);
		const y = Number(app.dataset.scroll ?? 0);
		requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior })));
		const focused = document.activeElement;
		if (previousMode !== mode && (!(focused instanceof HTMLElement) || focused === document.body || !focused.getClientRects().length)) {
			const opener = openers.get(app);
			const target = opener?.isConnected && opener.getClientRects().length ? opener : knob;
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

/** Click on the switch track. Ignores the click that ends a drag. */
export function toggleFromClick(state: SiteState) {
	const app = appEl();
	if (!app) return;
	if (app.dataset.dragged) {
		delete app.dataset.dragged;
		return;
	}
	animateTo(state, state.mode === 'map' ? 0 : 1);
}

/** Starts a drag on the knob. A partial drag shows a partial reveal. */
export function startDrag(state: SiteState, e: PointerEvent, knob: HTMLElement) {
	const app = appEl();
	const slider = knob.parentElement;
	if (!app || !slider) return;
	try {
		knob.setPointerCapture(e.pointerId);
	} catch {
		return; // the pointer was already released; the click handler toggles
	}
	beginReveal(app, state);
	const downX = e.clientX;
	let moved = false;
	const move = (ev: PointerEvent) => {
		if (Math.abs(ev.clientX - downX) > 3) moved = true;
		if (!moved) return;
		const rect = slider.getBoundingClientRect();
		setR(app, (ev.clientX - rect.left - knob.offsetWidth / 2) / (rect.width - knob.offsetWidth));
	};
	const end = () => {
		knob.removeEventListener('pointermove', move);
		knob.removeEventListener('pointerup', end);
		knob.removeEventListener('pointercancel', end);
		if (!moved) {
			// a plain press: let the click toggle, but drop the reveal state if no click follows
			setTimeout(() => {
				if (app.hasAttribute('data-revealing') && !timers.get(app)) settle(app, state, state.mode);
			}, 400);
			return;
		}
		app.dataset.dragged = '1';
		setTimeout(() => delete app.dataset.dragged, 400);
		animateTo(state, currentR(app, state) >= 0.5 ? 1 : 0);
	};
	knob.addEventListener('pointermove', move);
	knob.addEventListener('pointerup', end);
	knob.addEventListener('pointercancel', end);
}

export function keyOnKnob(state: SiteState, key: string) {
	if (['ArrowRight', 'ArrowUp', 'End'].includes(key)) animateTo(state, 1);
	else if (['ArrowLeft', 'ArrowDown', 'Home'].includes(key)) animateTo(state, 0);
	else if (key === 'Enter' || key === ' ') animateTo(state, state.mode === 'map' ? 0 : 1);
}

/** Opens the map at once, used for /#map deep links. */
export function openMapNow(state: SiteState) {
	const app = appEl();
	if (!app) return;
	beginReveal(app, state);
	settle(app, state, 'map');
}
