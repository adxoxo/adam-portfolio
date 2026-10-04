// Map viewport behaviour. Browser-only, attached once when the map first opens.
// The board scales by changing its size (one --u variable, px per board unit), so
// the browser keeps native scrolling, momentum and crisp text. Touch: one finger
// scrolls natively, two fingers pinch. Mouse: drag to pan, ctrl or cmd + wheel
// to zoom. Buttons: zoom in, zoom out, fit. Pulses run only for clusters that
// are on screen, only while the map is shown and the tab is visible.

import type { SiteState } from '../state';

interface View {
	view: HTMLElement;
	port: HTMLElement;
	zoom: number;
	io?: IntersectionObserver;
}

const views = new WeakMap<HTMLElement, View>();
const MAX_ZOOM = 2.6;

function activeBoard(port: HTMLElement): HTMLElement | null {
	for (const b of port.querySelectorAll<HTMLElement>('.board')) {
		if (b.offsetParent !== null || getComputedStyle(b).display !== 'none') return b;
	}
	return null;
}

function fitU(port: HTMLElement, board: HTMLElement): number {
	const bw = Number(board.dataset.bw);
	const bh = Number(board.dataset.bh);
	const cw = port.clientWidth - 24;
	const ch = port.clientHeight - 108;
	if (board.dataset.v === 'wide') return Math.max(0.6, Math.min(cw / bw, ch / bh, 1.2));
	return Math.max(0.85, Math.min(cw / bw, 1.3));
}

function minZoom(board: HTMLElement) {
	return board.dataset.v === 'wide' ? 0.85 : 1;
}

function apply(v: View, board: HTMLElement) {
	const u = fitU(v.port, board) * v.zoom;
	board.style.setProperty('--u', u.toFixed(4));
	v.view.querySelector('[data-zoom-level]')?.replaceChildren(`${Math.round(v.zoom * 100)}%`);
}

function zoomAt(v: View, factor: number, cx?: number, cy?: number) {
	const board = activeBoard(v.port);
	if (!board) return;
	const prevU = Number(board.style.getPropertyValue('--u')) || fitU(v.port, board);
	const next = Math.min(MAX_ZOOM, Math.max(minZoom(board), v.zoom * factor));
	if (next === v.zoom) return;
	const rect = v.port.getBoundingClientRect();
	const px = cx === undefined ? rect.width / 2 : cx - rect.left;
	const py = cy === undefined ? rect.height / 2 : cy - rect.top;
	const bx = (v.port.scrollLeft + px - board.offsetLeft) / prevU;
	const by = (v.port.scrollTop + py - board.offsetTop) / prevU;
	v.zoom = next;
	apply(v, board);
	const u = Number(board.style.getPropertyValue('--u'));
	v.port.scrollLeft = bx * u + board.offsetLeft - px;
	v.port.scrollTop = by * u + board.offsetTop - py;
}

function fit(v: View) {
	const board = activeBoard(v.port);
	if (!board) return;
	v.zoom = 1;
	apply(v, board);
	v.port.scrollTo({ left: Math.max(0, (v.port.scrollWidth - v.port.clientWidth) / 2), top: 0 });
	observe(v, board);
}

function observe(v: View, board: HTMLElement) {
	v.io?.disconnect();
	board.closest('.map-port')?.querySelectorAll('.pulses[data-live]').forEach((g) => g.removeAttribute('data-live'));
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				const c = (e.target as HTMLElement).dataset.zone;
				board.querySelectorAll(`.pulses[data-c="${c}"]`).forEach((g) => g.toggleAttribute('data-live', e.isIntersecting));
			}
		},
		{ root: v.port, threshold: 0 }
	);
	board.querySelectorAll('[data-zone]').forEach((z) => io.observe(z));
	v.io = io;
}

function setup(view: HTMLElement, state: SiteState, close: () => void): View {
	const port = view.querySelector<HTMLElement>('.map-port')!;
	const v: View = { view, port, zoom: 1 };

	view.addEventListener('click', (e) => {
		const t = (e.target as HTMLElement).closest<HTMLElement>('[data-zoom],[data-jump]');
		if (!t) return;
		if (t.dataset.zoom === 'in') zoomAt(v, 1.25);
		else if (t.dataset.zoom === 'out') zoomAt(v, 0.8);
		else if (t.dataset.zoom === 'fit') fit(v);
		else if (t.dataset.jump) {
			const board = activeBoard(port);
			const label = board?.querySelector<HTMLElement>(`.c-label[data-c="${t.dataset.jump}"]`);
			const first = board?.querySelector<HTMLElement>(`.cnode[data-c="${t.dataset.jump}"]`);
			const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			label?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
			first?.focus({ preventScroll: true });
		}
	});

	// highlight the trace of the node under the pointer or focus
	const mark = (e: Event, on: boolean) => {
		const node = (e.target as HTMLElement).closest<HTMLElement>('.cnode');
		const board = node?.closest('.board');
		if (!node || !board) return;
		board.querySelector(`.trace[data-t="${node.dataset.id}"]`)?.classList.toggle('on', on);
	};
	port.addEventListener('pointerover', (e) => mark(e, true));
	port.addEventListener('pointerout', (e) => mark(e, false));
	port.addEventListener('focusin', (e) => mark(e, true));
	port.addEventListener('focusout', (e) => mark(e, false));

	// mouse drag to pan, two-finger pinch to zoom
	const touches = new Map<number, { x: number; y: number }>();
	let drag: { x: number; y: number; sl: number; st: number; moved: boolean } | null = null;
	let pinch = 0;
	port.addEventListener('pointerdown', (e) => {
		if (e.pointerType === 'mouse') {
			if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
			drag = { x: e.clientX, y: e.clientY, sl: port.scrollLeft, st: port.scrollTop, moved: false };
			return;
		}
		touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (touches.size === 2) {
			const [a, b] = [...touches.values()];
			pinch = Math.hypot(a.x - b.x, a.y - b.y);
		}
	});
	port.addEventListener('pointermove', (e) => {
		if (drag && e.pointerType === 'mouse') {
			const dx = e.clientX - drag.x;
			const dy = e.clientY - drag.y;
			if (!drag.moved && Math.hypot(dx, dy) > 4) {
				drag.moved = true;
				port.classList.add('grabbing');
			}
			if (drag.moved) {
				port.scrollLeft = drag.sl - dx;
				port.scrollTop = drag.st - dy;
			}
			return;
		}
		if (!touches.has(e.pointerId)) return;
		touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (touches.size === 2 && pinch) {
			const [a, b] = [...touches.values()];
			const d = Math.hypot(a.x - b.x, a.y - b.y);
			if (Math.abs(d - pinch) > 2) {
				zoomAt(v, d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
				pinch = d;
			}
		}
	});
	const lift = (e: PointerEvent) => {
		if (e.pointerType === 'mouse') {
			if (drag?.moved) {
				// swallow the click that ends a drag so it does not open a node
				const stop = (ev: Event) => {
					ev.stopPropagation();
					ev.preventDefault();
				};
				port.addEventListener('click', stop, { capture: true, once: true });
				setTimeout(() => port.removeEventListener('click', stop, { capture: true }), 0);
			}
			drag = null;
			port.classList.remove('grabbing');
			return;
		}
		touches.delete(e.pointerId);
		if (touches.size < 2) pinch = 0;
	};
	port.addEventListener('pointerup', lift);
	port.addEventListener('pointercancel', lift);
	port.addEventListener(
		'wheel',
		(e) => {
			if (!e.ctrlKey && !e.metaKey) return;
			e.preventDefault();
			zoomAt(v, e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
		},
		{ passive: false }
	);

	document.addEventListener('keydown', (e) => {
		if (state.mode !== 'map' || document.querySelector('dialog[open]')) return;
		if (e.key === 'Escape') close();
		else if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey) zoomAt(v, 1.25);
		else if (e.key === '-' && !e.ctrlKey && !e.metaKey) zoomAt(v, 0.8);
		else if (e.key === '0' && !e.ctrlKey && !e.metaKey) fit(v);
	});
	document.addEventListener('visibilitychange', () => view.toggleAttribute('data-paused', document.hidden));

	let resizeTimer = 0;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(() => {
			if (state.mode === 'map') fit(v);
		}, 160);
	});
	return v;
}

/** Called each time the map settles open: sets up once, then fits the board. */
export function attachMap(state: SiteState, close: () => void) {
	const view = document.getElementById('map-view');
	if (!view) return;
	let v = views.get(view);
	if (!v) {
		v = setup(view, state, close);
		views.set(view, v);
	}
	fit(v);
}
