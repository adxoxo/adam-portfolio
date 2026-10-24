// Home page motion effects, ported from React Bits (c) David Haz, MIT + Commons Clause:
// ShinyText, VariableProximity, DotGrid, Magnet, SpotlightCard, Carousel, BlurText,
// ScrollReveal and LogoLoop. Browser-only and dependency-free. The server HTML stays
// the no-JS fallback: plain headings, the card grid and the stack grid. Each effect
// returns its own cleanup. Reduced motion keeps the moving effects off; cursor
// effects need a fine pointer.

type Cleanup = () => void;

export const one = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
export const all = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
export const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string) => {
	const n = document.createElement(tag);
	if (cls) n.className = cls;
	return n;
};
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const wrapIdx = (v: number, n: number) => ((v % n) + n) % n;
const nearest = (v: number, n: number) => wrapIdx(v + n / 2, n) - n / 2;
export const motionOK = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'cubic-bezier(.22,1,.36,1)';

/** Splits the text nodes of an element into word or letter spans. */
function split(root: HTMLElement, unit: 'word' | 'char', cls: string) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const nodes: Text[] = [];
	while (walker.nextNode()) nodes.push(walker.currentNode as Text);
	const pieces: HTMLElement[] = [];
	for (const node of nodes) {
		if (!node.nodeValue?.trim()) continue;
		const frag = document.createDocumentFragment();
		for (const part of node.nodeValue.split(/(\s+)/)) {
			if (!part) continue;
			if (/^\s+$/.test(part)) {
				frag.append(part);
				continue;
			}
			if (unit === 'word') {
				const s = el('span', cls);
				s.textContent = part;
				frag.append(s);
				pieces.push(s);
			} else {
				const word = el('span');
				word.style.whiteSpace = 'nowrap';
				for (const ch of part) {
					const s = el('span', cls);
					s.textContent = ch;
					word.append(s);
					pieces.push(s);
				}
				frag.append(word);
			}
		}
		node.replaceWith(frag);
	}
	return pieces;
}

/** Runs a frame callback only while the target is on screen. */
export function onScreenLoop(target: Element, step: (dt: number) => void): Cleanup {
	let raf = 0;
	let last = 0;
	let shown = false;
	const tick = (t: number) => {
		const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
		last = t;
		step(dt);
		raf = shown ? requestAnimationFrame(tick) : 0;
	};
	const io = new IntersectionObserver(([e]) => {
		shown = e.isIntersecting;
		if (shown && !raf) {
			last = 0;
			raf = requestAnimationFrame(tick);
		}
	});
	io.observe(target);
	return () => {
		io.disconnect();
		cancelAnimationFrame(raf);
		raf = 0;
	};
}

interface DotOptions {
	cls: string;
	base: number[];
	active: number[];
	size?: number;
	gap?: number;
}

/** DotGrid: dots that light up near the cursor, give way to fast moves and ripple on a press. */
export function dotGrid(host: HTMLElement, opts: DotOptions): Cleanup {
	const canvas = el('canvas', opts.cls);
	canvas.setAttribute('aria-hidden', 'true');
	host.dataset.fxDots = '';
	host.prepend(canvas);
	const ctx = canvas.getContext('2d')!;
	const GAP = opts.gap ?? 26;
	const SIZE = opts.size ?? 1.6;
	const PROX = 130;
	const SHOCK = 220;
	let dots: { x: number; y: number; dx: number; dy: number; vx: number; vy: number }[] = [];
	let w = 0;
	let h = 0;
	let mx = -1e4;
	let my = -1e4;
	let lx = 0;
	let ly = 0;
	let lt = 0;
	const build = () => {
		const dpr = Math.min(2, devicePixelRatio || 1);
		w = host.clientWidth;
		h = host.clientHeight;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const cols = Math.floor(w / GAP);
		const rows = Math.floor(h / GAP);
		const ox = (w - (cols - 1) * GAP) / 2;
		dots = [];
		for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dots.push({ x: ox + c * GAP, y: GAP / 2 + r * GAP, dx: 0, dy: 0, vx: 0, vy: 0 });
	};
	const local = (e: PointerEvent) => {
		const r = canvas.getBoundingClientRect();
		return [e.clientX - r.left, e.clientY - r.top];
	};
	const move = (e: PointerEvent) => {
		[mx, my] = local(e);
		wake();
		const now = performance.now();
		const dt = Math.max(1, now - lt) / 1000;
		const sx = (e.clientX - lx) / dt;
		const sy = (e.clientY - ly) / dt;
		lx = e.clientX;
		ly = e.clientY;
		lt = now;
		const speed = Math.hypot(sx, sy);
		if (speed < 400) return;
		const k = Math.min(1, speed / 3000);
		for (const d of dots) {
			const dist = Math.hypot(d.x - mx, d.y - my);
			if (dist > PROX) continue;
			const f = (1 - dist / PROX) * k;
			d.vx += sx * f * 0.08;
			d.vy += sy * f * 0.08;
		}
	};
	const leave = () => {
		mx = my = -1e4;
		wake();
	};
	const shock = (e: PointerEvent) => {
		const [cx, cy] = local(e);
		for (const d of dots) {
			const dist = Math.hypot(d.x - cx, d.y - cy);
			if (dist > SHOCK || dist === 0) continue;
			const f = (1 - dist / SHOCK) * 420;
			d.vx += ((d.x - cx) / dist) * f;
			d.vy += ((d.y - cy) / dist) * f;
		}
		wake();
	};
	const nearHost = () => mx > -PROX && my > -PROX && mx < w + PROX && my < h + PROX;
	/** Draws one frame. Returns true while any dot still moves. */
	const step = (dt: number) => {
		let busy = false;
		ctx.clearRect(0, 0, w, h);
		for (const d of dots) {
			d.vx += (-90 * d.dx - 12 * d.vx) * dt;
			d.vy += (-90 * d.dy - 12 * d.vy) * dt;
			d.dx += d.vx * dt;
			d.dy += d.vy * dt;
			if (Math.abs(d.vx) + Math.abs(d.vy) > 0.5 || Math.abs(d.dx) + Math.abs(d.dy) > 0.05) busy = true;
			const x = d.x + d.dx;
			const y = d.y + d.dy;
			const dist = Math.hypot(x - mx, y - my);
			const t = dist < PROX ? 1 - dist / PROX : 0;
			const c = opts.base.map((b, i) => Math.round(b + (opts.active[i] - b) * t));
			ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
			ctx.beginPath();
			ctx.arc(x, y, SIZE + t * 0.9, 0, Math.PI * 2);
			ctx.fill();
		}
		return busy;
	};
	// Frames run only while the grid is on screen and the cursor is near or a dot still moves;
	// a still grid keeps its last frame and costs nothing.
	let raf = 0;
	let last = 0;
	let shown = false;
	const frame = (t: number) => {
		const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
		last = t;
		const busy = step(dt);
		raf = shown && (busy || nearHost()) ? requestAnimationFrame(frame) : 0;
	};
	const wake = () => {
		if (shown && !raf) {
			last = 0;
			raf = requestAnimationFrame(frame);
		}
	};
	const io = new IntersectionObserver(([e]) => {
		shown = e.isIntersecting;
		if (shown) wake();
	});
	io.observe(host);
	build();
	const ro = new ResizeObserver(() => {
		build();
		step(0);
		wake();
	});
	ro.observe(host);
	addEventListener('pointermove', move, { passive: true });
	document.addEventListener('pointerleave', leave);
	host.addEventListener('pointerdown', shock);
	return () => {
		io.disconnect();
		cancelAnimationFrame(raf);
		ro.disconnect();
		removeEventListener('pointermove', move);
		document.removeEventListener('pointerleave', leave);
		host.removeEventListener('pointerdown', shock);
		canvas.remove();
		delete host.dataset.fxDots;
	};
}

/** ShinyText: a light sweep across the accent word. */
function shiny(): Cleanup {
	const word = one('.hero .tag .accent');
	word?.classList.add('fx-shiny');
	return () => word?.classList.remove('fx-shiny');
}

/** VariableProximity: the Geist weight of the name rises from 600 to 900 near the cursor. */
function proximity(): Cleanup {
	const h1 = one('.hero h1');
	if (!h1) return () => {};
	h1.setAttribute('aria-label', h1.textContent!.replace(/\s+/g, ' ').trim());
	const pieces = split(h1, 'char', 'fx-ch');
	// each letter keeps its resting width, so heavier glyphs never push the line around
	const lock = () => {
		pieces.forEach((p) => {
			p.style.width = '';
			p.style.setProperty('--w', '600');
		});
		const widths = pieces.map((p) => p.getBoundingClientRect().width);
		pieces.forEach((p, i) => (p.style.width = `${widths[i]}px`));
	};
	lock();
	void document.fonts?.ready.then(lock);
	let lastWidth = innerWidth;
	const relock = () => {
		if (innerWidth === lastWidth) return;
		lastWidth = innerWidth;
		lock();
	};
	addEventListener('resize', relock);
	const FROM = 600;
	const TO = 900;
	const R = 120;
	let mx = -1e4;
	let my = -1e4;
	let raf = 0;
	let near = false;
	const frame = () => {
		raf = 0;
		const centers = pieces.map((p) => {
			const r = p.getBoundingClientRect();
			return [r.left + r.width / 2, r.top + r.height / 2];
		});
		pieces.forEach((p, i) => {
			const t = Math.max(0, 1 - Math.hypot(mx - centers[i][0], my - centers[i][1]) / R);
			p.style.setProperty('--w', String(Math.round(FROM + (TO - FROM) * t)));
		});
	};
	const move = (e: PointerEvent) => {
		const box = h1.getBoundingClientRect();
		const inside = e.clientX > box.left - R && e.clientX < box.right + R && e.clientY > box.top - R && e.clientY < box.bottom + R;
		if (!inside && !near) return;
		near = inside;
		mx = inside ? e.clientX : -1e4;
		my = inside ? e.clientY : -1e4;
		raf ||= requestAnimationFrame(frame);
	};
	addEventListener('pointermove', move, { passive: true });
	return () => {
		removeEventListener('pointermove', move);
		removeEventListener('resize', relock);
		cancelAnimationFrame(raf);
	};
}

/** Magnet: the call-to-action buttons lean toward a cursor within 60px. */
function magnet(): Cleanup {
	const btns = all('.hero .cta-row .btn, .foot-call .btn');
	const shift = new Map(btns.map((b) => [b, [0, 0]]));
	btns.forEach((b) => b.classList.add('fx-magnet'));
	const PAD = 60;
	const STRENGTH = 4;
	const move = (e: PointerEvent) => {
		for (const b of btns) {
			const r = b.getBoundingClientRect();
			const [sx, sy] = shift.get(b)!;
			const cx = r.left - sx + r.width / 2;
			const cy = r.top - sy + r.height / 2;
			const inside = Math.abs(e.clientX - cx) < r.width / 2 + PAD && Math.abs(e.clientY - cy) < r.height / 2 + PAD;
			if (inside) {
				const x = (e.clientX - cx) / STRENGTH;
				const y = (e.clientY - cy) / STRENGTH;
				shift.set(b, [x, y]);
				b.classList.add('fx-pulling');
				b.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
			} else if (b.classList.contains('fx-pulling')) {
				shift.set(b, [0, 0]);
				b.classList.remove('fx-pulling');
				b.style.translate = '';
			}
		}
	};
	addEventListener('pointermove', move, { passive: true });
	return () => {
		removeEventListener('pointermove', move);
		btns.forEach((b) => {
			b.classList.remove('fx-magnet', 'fx-pulling');
			b.style.translate = '';
		});
	};
}

/** SpotlightCard: a soft green light follows the cursor over a project card. */
function spotlight(): Cleanup {
	const glimpse = one('.glimpse');
	if (!glimpse) return () => {};
	glimpse.dataset.fxSpot = '';
	const move = (e: PointerEvent) => {
		const card = (e.target as Element).closest<HTMLElement>('.gcard');
		if (!card) return;
		const r = card.getBoundingClientRect();
		card.style.setProperty('--mx', `${e.clientX - r.left}px`);
		card.style.setProperty('--my', `${e.clientY - r.top}px`);
	};
	glimpse.addEventListener('pointermove', move);
	return () => {
		glimpse.removeEventListener('pointermove', move);
		delete glimpse.dataset.fxSpot;
	};
}

/** BlurText: heading words come into focus one by one when they scroll into view. */
function blurHeadings(): Cleanup {
	const runs = all('.home-sec h2, .foot-call h2').map((h) => {
		h.setAttribute('aria-label', h.textContent!.trim());
		h.classList.add('fx-blur-wait');
		return { h, pieces: split(h, 'word', 'fx-w') };
	});
	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				io.unobserve(entry.target);
				const run = runs.find((r) => r.h === entry.target)!;
				run.h.classList.remove('fx-blur-wait');
				run.pieces.forEach((p, i) =>
					p.animate(
						[
							{ filter: 'blur(10px)', opacity: 0, transform: 'translateY(-24px)' },
							{ filter: 'blur(5px)', opacity: 0.5, transform: 'translateY(4px)', offset: 0.5 },
							{ filter: 'blur(0)', opacity: 1, transform: 'none' }
						],
						{ duration: 700, delay: i * 110, easing: EASE, fill: 'both' }
					)
				);
			}
		},
		{ threshold: 0.4, rootMargin: '0px 0px -8% 0px' }
	);
	runs.forEach((r) => io.observe(r.h));
	return () => {
		io.disconnect();
		runs.forEach((r) => r.h.classList.remove('fx-blur-wait'));
	};
}

/** ScrollReveal: the testimonial brightens and sharpens word by word as it scrolls up. */
function reveal(): Cleanup {
	const bq = one('.testimonial blockquote');
	if (!bq) return () => {};
	const words = all('p', bq).flatMap((p) => split(p, 'word', 'fx-rw'));
	bq.classList.add('fx-reveal');
	const SOFT = 10;
	let raf = 0;
	let dimmed = false;
	const frame = () => {
		raf = 0;
		const r = bq.getBoundingClientRect();
		// below the screen the quote stays at full contrast, for tools that read the whole page at once
		if (r.top >= innerHeight) {
			if (dimmed) {
				words.forEach((w) => {
					w.style.opacity = '';
					w.style.filter = '';
				});
				bq.style.transform = '';
				dimmed = false;
			}
			return;
		}
		dimmed = true;
		const start = innerHeight * 0.92;
		const end = innerHeight * 0.75 - r.height;
		const p = clamp((start - r.top) / Math.max(1, start - end), 0, 1);
		const n = words.length;
		words.forEach((w, i) => {
			const t = clamp((p * (n + SOFT) - i) / SOFT, 0, 1);
			w.style.opacity = (0.14 + 0.86 * t).toFixed(3);
			w.style.filter = t < 1 ? `blur(${((1 - t) * 4).toFixed(2)}px)` : '';
		});
		bq.style.transform = `rotate(${((1 - p) * 1.5).toFixed(2)}deg)`;
	};
	const onScroll = () => {
		raf ||= requestAnimationFrame(frame);
	};
	addEventListener('scroll', onScroll, { passive: true });
	addEventListener('resize', onScroll);
	frame();
	return () => {
		removeEventListener('scroll', onScroll);
		removeEventListener('resize', onScroll);
		cancelAnimationFrame(raf);
	};
}

/** LogoLoop: two rows of stack logos drift in opposite directions and ease to a stop on hover.
 *  The grouped stack grid stays in the page for screen readers. */
function logoLoop(moving: boolean): Cleanup {
	const stack = one('.stack');
	const groups = stack && one('.groups', stack);
	if (!stack || !groups) return () => {};
	const items = all('.group li', groups).map((li) => ({ src: li.querySelector('img')?.getAttribute('src'), name: li.textContent!.trim() }));
	const box = el('div', 'fx-loops');
	box.setAttribute('aria-hidden', 'true');
	groups.before(box);
	stack.dataset.fxLoop = '';
	const half = Math.ceil(items.length / 2);
	const rows = [items.slice(0, half), items.slice(half)].map((row, ri) => {
		const loop = el('div', 'fx-loop');
		const track = el('div', 'fx-loop-track');
		loop.append(track);
		box.append(loop);
		const list = () => {
			const ul = el('ul', 'fx-loop-list');
			for (const it of row) {
				const li = el('li', 'fx-logo');
				if (it.src) {
					const img = el('img');
					img.src = it.src;
					img.alt = '';
					img.width = img.height = 22;
					img.loading = 'lazy';
					li.append(img);
				}
				li.append(it.name);
				ul.append(li);
			}
			return ul;
		};
		const state = { loop, track, list, width: 0, offset: 0, v: 0, speed: ri ? -40 : 40, hover: false };
		loop.addEventListener('pointerenter', () => (state.hover = true));
		loop.addEventListener('pointerleave', () => (state.hover = false));
		return state;
	});
	const fill = () => {
		for (const r of rows) {
			r.track.replaceChildren(r.list());
			r.width = (r.track.firstChild as HTMLElement).getBoundingClientRect().width;
			const copies = Math.max(2, Math.ceil(r.loop.clientWidth / Math.max(1, r.width)) + 1);
			for (let i = 1; i < copies; i++) r.track.append(r.list());
		}
	};
	fill();
	const ro = new ResizeObserver(fill);
	ro.observe(box);
	const step = (dt: number) => {
		for (const r of rows) {
			const target = moving && !r.hover ? r.speed : 0;
			r.v += (target - r.v) * (1 - Math.exp(-dt / 0.25));
			r.offset = wrapIdx(r.offset + r.v * dt, r.width || 1);
			r.track.style.transform = `translate3d(${(-r.offset).toFixed(2)}px,0,0)`;
		}
	};
	const stop = onScreenLoop(box, step);
	return () => {
		stop();
		ro.disconnect();
		box.remove();
		delete stack.dataset.fxLoop;
	};
}

const ICON = {
	prev: 'M10 3 5 8l5 5',
	next: 'M6 3l5 5-5 5',
	pause: 'M5.5 3.5v9M10.5 3.5v9',
	play: 'M5 3.5v9l7.5-4.5z'
};
const svg = (d: string) =>
	`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

/** Carousel ("scale" transition): the preview cards ride a spring-driven rail with drag,
 *  arrows, dots, arrow keys and a 1.5s autoplay that pauses on hover, focus or the pause button. */
function carousel(autoplay: boolean): Cleanup {
	const glimpse = one('.glimpse');
	const track = glimpse && one('.glimpse-track', glimpse);
	const rail = glimpse && one('.glimpse-rail', glimpse);
	if (!glimpse || !track || !rail) return () => {};
	const slides = all(':scope > li', rail);
	const cards = slides.map((li) => one('.gcard', li)!);
	const n = slides.length;
	if (n < 2) return () => {};
	track.dataset.fxCarousel = '';
	rail.setAttribute('aria-roledescription', 'carousel');
	const shades = slides.map((li) => {
		const s = el('span', 'fx-shade');
		li.append(s);
		return s;
	});

	const bar = el('div', 'fx-cbar');
	const button = (cls: string, label: string, d: string) => {
		const b = el('button', cls);
		b.type = 'button';
		b.setAttribute('aria-label', label);
		b.innerHTML = svg(d);
		return b;
	};
	const prev = button('fx-cbtn', 'Previous project', ICON.prev);
	const next = button('fx-cbtn', 'Next project', ICON.next);
	const pause = button('fx-cbtn fx-cpause', 'Pause the project carousel', ICON.pause);
	const ind = el('div', 'fx-cdots');
	const dots = cards.map((c, i) => {
		const b = el('button', 'fx-cdot');
		b.type = 'button';
		b.setAttribute('aria-label', `Show ${one('.g-t', c)?.textContent ?? `project ${i + 1}`}`);
		b.append(el('i'));
		b.addEventListener('click', () => goTo(i));
		ind.append(b);
		return b;
	});
	bar.append(prev, ind, next);
	if (autoplay) bar.append(pause);
	track.after(bar);

	let W = 0;
	let cw = 0;
	let left = 0;
	let span = 0;
	let pos = 0;
	let vel = 0;
	let target = 0;
	let drag: { x: number; y: number; from: number; moved: boolean; samples: [number, number][]; id: number } | null = null;
	let suppress = false;
	let raf = 0;
	let last = 0;
	let elapsed = 0;
	let held = false;
	let stopped = false;
	const DELAY = 1.5;
	const snap = !motionOK();
	const current = () => wrapIdx(Math.round(target), n);

	const measure = () => {
		W = rail.clientWidth;
		cw = Math.round(Math.min(360, W - 2 * Math.max(44, W * 0.1)));
		left = (W - cw) / 2;
		span = cw + 24;
		rail.style.setProperty('--fx-cw', `${cw}px`);
		rail.style.setProperty('--fx-left', `${left}px`);
		rail.style.setProperty('--fx-h', 'auto');
		const tallest = Math.max(
			...cards.map((c) => {
				c.style.height = 'auto';
				const hh = c.getBoundingClientRect().height;
				c.style.height = '';
				return hh;
			})
		);
		rail.style.setProperty('--fx-h', `${Math.ceil(tallest)}px`);
	};

	const render = () => {
		const cur = current();
		slides.forEach((li, i) => {
			const offset = nearest(i - pos, n);
			const near = Math.min(Math.abs(offset), 1);
			let x = offset * span;
			const visible = x > -(left + cw + 2) && x < W - left + 2;
			x -= Math.sign(offset) * near * cw * 0.06;
			li.style.transform = `translate3d(${x}px,0,0) scale(${1 - 0.12 * near})`;
			li.style.zIndex = String(10 - Math.min(9, Math.round(Math.abs(offset) * 2)));
			li.style.visibility = visible ? '' : 'hidden';
			shades[i].style.opacity = String(near * 0.55);
			const active = i === cur;
			li.setAttribute('aria-hidden', active ? 'false' : 'true');
			cards[i].tabIndex = active ? 0 : -1;
		});
		dots.forEach((b, i) => b.setAttribute('aria-current', i === cur ? 'true' : 'false'));
		dots[cur].style.setProperty('--fill', autoplay && !stopped ? String(clamp(elapsed / DELAY, 0, 1)) : '1');
	};

	const settled = () => Math.abs(target - pos) < 0.0005 && Math.abs(vel) < 0.0005;
	const running = () => autoplay && !stopped;
	const tick = (t: number) => {
		const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
		last = t;
		if (!drag) {
			if (snap) {
				pos = target;
				vel = 0;
			} else {
				vel += (150 * (target - pos) - 24 * vel) * dt;
				pos += vel * dt;
			}
			if (settled()) {
				pos = target;
				vel = 0;
			}
		}
		if (running() && !held && !drag) {
			elapsed += dt;
			if (elapsed >= DELAY) {
				elapsed = 0;
				target += 1;
			}
		}
		render();
		raf = drag || (running() && !held) || !settled() ? requestAnimationFrame(tick) : 0;
	};
	const kick = () => {
		if (!raf) {
			last = 0;
			raf = requestAnimationFrame(tick);
		}
	};
	const goTo = (i: number) => {
		target += nearest(i - wrapIdx(target, n), n);
		elapsed = 0;
		kick();
	};
	const stepBy = (d: number) => {
		target = Math.round(target) + d;
		elapsed = 0;
		kick();
	};
	const setStopped = (value: boolean) => {
		stopped = value;
		elapsed = 0;
		pause.setAttribute('aria-label', value ? 'Play the project carousel' : 'Pause the project carousel');
		pause.innerHTML = svg(value ? ICON.play : ICON.pause);
		kick();
	};
	prev.addEventListener('click', () => stepBy(-1));
	next.addEventListener('click', () => stepBy(1));
	pause.addEventListener('click', () => setStopped(!stopped));

	const down = (e: PointerEvent) => {
		if (e.button !== 0) return;
		drag = { x: e.clientX, y: e.clientY, from: pos, moved: false, samples: [[performance.now(), e.clientX]], id: e.pointerId };
		kick();
	};
	const move = (e: PointerEvent) => {
		if (!drag || e.pointerId !== drag.id) return;
		const dx = e.clientX - drag.x;
		const dy = e.clientY - drag.y;
		if (!drag.moved) {
			if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
			drag.moved = true;
			rail.setPointerCapture(e.pointerId);
			rail.dataset.dragging = '';
		}
		pos = drag.from - dx / span;
		vel = 0;
		drag.samples.push([performance.now(), e.clientX]);
		if (drag.samples.length > 6) drag.samples.shift();
	};
	const up = (e: PointerEvent) => {
		if (!drag || e.pointerId !== drag.id) return;
		if (drag.moved) {
			const [t0, x0] = drag.samples[0];
			const dtm = Math.max(16, performance.now() - t0) / 1000;
			const v = -(e.clientX - x0) / dtm / span;
			target = Math.round(pos + clamp(v * 0.2, -1.5, 1.5));
			vel = v;
			suppress = true;
			elapsed = 0;
			delete rail.dataset.dragging;
		}
		drag = null;
		kick();
	};
	// Runs before the document-level Qwik handlers: a drag or a side card never opens a dialog.
	const click = (e: MouseEvent) => {
		if (suppress) {
			suppress = false;
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		const i = slides.indexOf((e.target as Element).closest('li')!);
		if (i >= 0 && i !== current()) {
			e.preventDefault();
			e.stopPropagation();
			goTo(i);
		}
	};
	const key = (e: KeyboardEvent) => {
		if (e.key === 'ArrowLeft') stepBy(-1);
		else if (e.key === 'ArrowRight') stepBy(1);
		else if (e.key === 'Home') goTo(0);
		else if (e.key === 'End') goTo(n - 1);
		else return;
		e.preventDefault();
		requestAnimationFrame(() => cards[current()].focus({ preventScroll: true }));
	};
	const hold = () => {
		held = true;
	};
	const release = () => {
		held = false;
		kick();
	};
	rail.addEventListener('pointerdown', down);
	rail.addEventListener('pointermove', move);
	rail.addEventListener('pointerup', up);
	rail.addEventListener('pointercancel', up);
	rail.addEventListener('click', click, true);
	rail.addEventListener('keydown', key);
	glimpse.addEventListener('pointerenter', hold);
	glimpse.addEventListener('pointerleave', release);
	glimpse.addEventListener('focusin', hold);
	glimpse.addEventListener('focusout', release);

	measure();
	render();
	kick();
	const ro = new ResizeObserver(() => {
		measure();
		render();
	});
	ro.observe(rail);
	return () => {
		cancelAnimationFrame(raf);
		ro.disconnect();
		rail.removeEventListener('pointerdown', down);
		rail.removeEventListener('pointermove', move);
		rail.removeEventListener('pointerup', up);
		rail.removeEventListener('pointercancel', up);
		rail.removeEventListener('click', click, true);
		rail.removeEventListener('keydown', key);
		glimpse.removeEventListener('pointerenter', hold);
		glimpse.removeEventListener('pointerleave', release);
		glimpse.removeEventListener('focusin', hold);
		glimpse.removeEventListener('focusout', release);
		bar.remove();
		shades.forEach((s) => s.remove());
		slides.forEach((li) => {
			li.removeAttribute('style');
			li.removeAttribute('aria-hidden');
		});
		cards.forEach((c) => c.removeAttribute('tabindex'));
		rail.removeAttribute('style');
		rail.removeAttribute('aria-roledescription');
		delete track.dataset.fxCarousel;
	};
}

/** Starts every home effect the device supports. Returns one cleanup for all of them. */
export function attachHomeFx(): Cleanup {
	const ok = motionOK();
	const fine = finePointer();
	const stops: Cleanup[] = [carousel(ok), logoLoop(ok)];
	if (fine) stops.push(spotlight());
	if (ok) {
		stops.push(shiny(), blurHeadings(), reveal());
		const hero = one('.hero');
		if (hero) stops.push(dotGrid(hero, { cls: 'fx-dots', base: [214, 214, 214], active: [79, 122, 82] }));
		if (fine) stops.push(proximity(), magnet());
	}
	return () => stops.forEach((s) => s());
}
