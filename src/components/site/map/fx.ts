// Map motion effects, ported from React Bits (c) David Haz, MIT + Commons Clause:
// ElectricBorder (a light 2D canvas version of the WebGL original), DecryptedText,
// BorderGlow, ClickSpark, CountUp, a dark DotGrid and TargetCursor. Browser-only,
// attached once when the map first opens. Entry effects run on every
// `portfolio:mapopen` event, which the switch sends after each open. Text changes only touch existing text node values and
// always end on the original text.

import { all, dotGrid, el, finePointer, motionOK, one, onScreenLoop } from '../runtime/fx';

export const MAP_OPEN = 'portfolio:mapopen';
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/';
let attached = false;

const mapOpen = () => one('.app')?.dataset.mode === 'map';
const textNodes = (root: Element | null) => (root ? [...root.childNodes].filter((n): n is Text => n.nodeType === 3 && !!n.nodeValue?.trim()) : []);

interface Decrypting extends Text {
	fxFinal?: string;
	fxDelay?: number;
	fxTimer?: number;
}

/** Reveals a text node left to right while the rest cycles through random characters. */
function decryptNode(node: Decrypting, { speed = 32, frames = 14, delay = 0 } = {}) {
	const final = (node.fxFinal ??= node.nodeValue ?? '');
	clearTimeout(node.fxDelay);
	clearInterval(node.fxTimer);
	const per = Math.max(1, final.length / frames);
	let shown = 0;
	const tick = () => {
		shown += per;
		if (shown >= final.length) {
			node.nodeValue = final;
			clearInterval(node.fxTimer);
			return;
		}
		node.nodeValue = [...final].map((ch, i) => (i < shown || ch === ' ' ? ch : CHARS[(Math.random() * CHARS.length) | 0])).join('');
	};
	node.fxDelay = window.setTimeout(() => {
		tick();
		node.fxTimer = window.setInterval(tick, speed);
	}, delay);
}

/** ElectricBorder: a crackling green current around the Adam chip. Holds still while the map is dragged. */
function electric(view: HTMLElement, port: HTMLElement) {
	for (const chip of all('.chip-node', view)) {
		const canvas = el('canvas', 'fx-electric');
		canvas.setAttribute('aria-hidden', 'true');
		chip.append(canvas);
		const ctx = canvas.getContext('2d')!;
		const PAD = 16;
		let w = 0;
		let h = 0;
		let t = Math.random() * 100;
		const size = () => {
			const dpr = Math.min(2, devicePixelRatio || 1);
			w = chip.clientWidth + PAD * 2;
			h = chip.clientHeight + PAD * 2;
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		new ResizeObserver(size).observe(chip);
		size();
		const wave = (s: number, seed: number) =>
			Math.sin(s * 0.11 + t * 7 + seed) * 0.5 + Math.sin(s * 0.27 - t * 11 + seed * 2) * 0.3 + Math.sin(s * 0.61 + t * 19 + seed * 3) * 0.2;
		const strand = (seed: number, amp: number) => {
			const x0 = PAD;
			const y0 = PAD;
			const x1 = w - PAD;
			const y1 = h - PAD;
			const sides = [
				[x0, y0, x1, y0, 0, -1],
				[x1, y0, x1, y1, 1, 0],
				[x1, y1, x0, y1, 0, 1],
				[x0, y1, x0, y0, -1, 0]
			];
			let s = 0;
			ctx.beginPath();
			for (const [ax, ay, bx, by, nx, ny] of sides) {
				const len = Math.hypot(bx - ax, by - ay);
				for (let d = 0; d <= len; d += 4) {
					const k = d / len;
					const off = wave(s + d, seed) * amp + (Math.random() - 0.5) * amp * 0.35;
					const x = ax + (bx - ax) * k + nx * off;
					const y = ay + (by - ay) * k + ny * off;
					if (s === 0 && d === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				s += len;
			}
			ctx.closePath();
		};
		onScreenLoop(chip, (dt) => {
			if (port.classList.contains('grabbing')) return;
			t += dt * 0.6;
			const u = Number(chip.closest<HTMLElement>('.board')?.style.getPropertyValue('--u')) || 1;
			ctx.clearRect(0, 0, w, h);
			ctx.lineJoin = 'round';
			ctx.shadowColor = 'rgba(123,183,126,0.9)';
			ctx.shadowBlur = 12;
			ctx.strokeStyle = 'rgba(123,183,126,0.85)';
			ctx.lineWidth = 1.6;
			strand(0, 4 * u);
			ctx.stroke();
			ctx.strokeStyle = 'rgba(123,183,126,0.45)';
			ctx.lineWidth = 1;
			strand(2.4, 6 * u);
			ctx.stroke();
			ctx.shadowBlur = 4;
			ctx.strokeStyle = 'rgba(235,255,235,0.7)';
			ctx.lineWidth = 0.8;
			strand(5.1, 2.5 * u);
			ctx.stroke();
		});
	}
}

/** DecryptedText: the title and cluster names decode on open; a project name decodes on hover. */
function decrypt(view: HTMLElement, port: HTMLElement) {
	const onOpen = () => {
		textNodes(one('.map-title', view)).forEach((n) => decryptNode(n, { frames: 16 }));
		all('.c-label', view).forEach((label, i) => textNodes(label).forEach((n) => decryptNode(n, { frames: 12, delay: 200 + i * 120 })));
	};
	port.addEventListener('pointerover', (e) => {
		const node = (e.target as Element).closest('.cnode');
		if (!node || node.contains(e.relatedTarget as Node | null)) return;
		textNodes(one('.t', node)).forEach((n) => decryptNode(n, { frames: 10, speed: 28 }));
	});
	document.addEventListener(MAP_OPEN, onOpen);
}

/** BorderGlow: a green light runs along the node border nearest the cursor. */
function glow(view: HTMLElement, port: HTMLElement) {
	view.dataset.fxGlow = '';
	for (const node of all('.cnode', view)) {
		const g = el('span', 'fx-glow');
		g.setAttribute('aria-hidden', 'true');
		node.append(g);
	}
	port.addEventListener('pointermove', (e) => {
		const node = (e.target as Element).closest<HTMLElement>('.cnode');
		if (!node) return;
		const r = node.getBoundingClientRect();
		node.style.setProperty('--gx', `${e.clientX - r.left}px`);
		node.style.setProperty('--gy', `${e.clientY - r.top}px`);
	});
}

/** ClickSpark: eight green sparks burst from the press point on a node. */
function spark(port: HTMLElement) {
	const canvas = el('canvas', 'fx-spark');
	canvas.setAttribute('aria-hidden', 'true');
	document.body.append(canvas);
	const ctx = canvas.getContext('2d')!;
	const size = () => {
		const dpr = Math.min(2, devicePixelRatio || 1);
		canvas.width = innerWidth * dpr;
		canvas.height = innerHeight * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	};
	size();
	addEventListener('resize', size);
	const bursts: { x: number; y: number; t: number; a: number }[] = [];
	let raf = 0;
	const draw = (now: number) => {
		ctx.clearRect(0, 0, innerWidth, innerHeight);
		for (let b = bursts.length - 1; b >= 0; b--) {
			const burst = bursts[b];
			const k = (now - burst.t) / 420;
			if (k >= 1) {
				bursts.splice(b, 1);
				continue;
			}
			const e = k * (2 - k);
			ctx.strokeStyle = `rgba(123,183,126,${1 - k * 0.6})`;
			ctx.lineWidth = 2;
			ctx.lineCap = 'round';
			ctx.shadowColor = 'rgba(123,183,126,0.8)';
			ctx.shadowBlur = 6;
			for (let i = 0; i < 8; i++) {
				const a = burst.a + (i * Math.PI) / 4;
				const dist = e * 22;
				const len = 11 * (1 - e);
				ctx.beginPath();
				ctx.moveTo(burst.x + Math.cos(a) * dist, burst.y + Math.sin(a) * dist);
				ctx.lineTo(burst.x + Math.cos(a) * (dist + len), burst.y + Math.sin(a) * (dist + len));
				ctx.stroke();
			}
		}
		raf = bursts.length ? requestAnimationFrame(draw) : 0;
	};
	port.addEventListener('click', (e) => {
		if (!(e.target as Element).closest('.cnode') || !e.detail) return;
		bursts.push({ x: e.clientX, y: e.clientY, t: performance.now(), a: Math.random() * 0.4 });
		raf ||= requestAnimationFrame(draw);
	});
}

/** CountUp: the project counts climb from zero on every open. */
function countUp(view: HTMLElement) {
	const nodes = all('.map-title b, .jump b, .c-label b, .chip-node b', view).flatMap((b) => textNodes(b));
	const finals = nodes.map((t) => t.nodeValue ?? '');
	let raf = 0;
	const onOpen = () => {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const frame = (now: number) => {
			const k = Math.min(1, (now - t0) / 1000);
			const e = 1 - Math.pow(1 - k, 3);
			nodes.forEach((t, i) => (t.nodeValue = finals[i].replace(/\d+/, (n) => String(Math.round(Number(n) * e)))));
			if (k < 1) raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
	};
	document.addEventListener(MAP_OPEN, onOpen);
}

/** TargetCursor: corner brackets spin with the cursor and lock around the node under it. */
function targetCursor(view: HTMLElement) {
	const box = el('div', 'fx-tc');
	box.setAttribute('aria-hidden', 'true');
	const corners = [0, 1, 2, 3].map((i) => {
		const c = el('span', `fx-tc-c fx-tc-${i}`);
		box.append(c);
		return { el: c, x: 0, y: 0 };
	});
	box.append(el('span', 'fx-tc-dot'));
	document.body.append(box);
	document.body.dataset.fxCursor = '';
	const S = 12;
	const CS = 10;
	const PAD = 6;
	const idle = [
		[-S, -S],
		[S - CS, -S],
		[S - CS, S - CS],
		[-S, S - CS]
	];
	let x = -100;
	let y = -100;
	let angle = 0;
	let hover: HTMLElement | null = null;
	let inside = false;
	addEventListener(
		'pointermove',
		(e: PointerEvent) => {
			x = e.clientX;
			y = e.clientY;
			const t = e.target as Element;
			inside = e.pointerType === 'mouse' && !!t.closest?.('.map-port');
			hover = t.closest?.<HTMLElement>('.cnode') ?? null;
		},
		{ passive: true }
	);
	onScreenLoop(view, (dt) => {
		box.style.opacity = mapOpen() && inside ? '1' : '0';
		let goals = idle;
		if (hover) {
			const r = hover.getBoundingClientRect();
			goals = [
				[r.left - PAD - x, r.top - PAD - y],
				[r.right + PAD - CS - x, r.top - PAD - y],
				[r.right + PAD - CS - x, r.bottom + PAD - CS - y],
				[r.left - PAD - x, r.bottom + PAD - CS - y]
			];
			angle += (Math.round(angle / 360) * 360 - angle) * (1 - Math.exp(-dt / 0.06));
		} else angle = (angle + dt * 180) % 360;
		const k = 1 - Math.exp(-dt / 0.07);
		corners.forEach((c, i) => {
			c.x += (goals[i][0] - c.x) * k;
			c.y += (goals[i][1] - c.y) * k;
			c.el.style.transform = `translate(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px)`;
		});
		box.classList.toggle('on-target', !!hover);
		box.style.transform = `translate(${x}px,${y}px) rotate(${angle.toFixed(1)}deg)`;
	});
}

/** Starts the map effects once. Later opens only replay the entry effects. */
export function attachMapFx() {
	if (attached) return;
	const view = one('#map-view');
	const port = view && one('.map-port', view);
	if (!view || !port) return;
	attached = true;
	if (!motionOK()) return;
	const fine = finePointer();
	electric(view, port);
	decrypt(view, port);
	spark(port);
	countUp(view);
	dotGrid(view, { cls: 'fx-dots fx-dots--map', base: [48, 48, 48], active: [123, 183, 126], size: 1.4, gap: 24 });
	if (fine) {
		glow(view, port);
		targetCursor(view);
	}
}
