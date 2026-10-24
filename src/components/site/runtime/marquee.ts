// Calm project marquee. Browser-only, started from a visible task and stopped by
// its cleanup. The track is a native horizontal scroller moved by a small
// requestAnimationFrame loop, so swipe, wheel and keyboard scrolling stay native.
// The server renders one original list. Visual copies of it fill the lane; they are
// aria-hidden divs with no focusable descendants, and a click on one is forwarded
// to the original card, so dialogs and focus return use the real control.

const RESUME_DELAY = 1400; // ms of calm after a swipe, wheel or drag
const EASE = 0.6; // s, speed ramp for start and resume only; every stop is immediate
const DESKTOP_SPEED = 20; // px/s
const PHONE_SPEED = 16; // px/s

export function startMarquee(root: HTMLElement): () => void {
	const track = root.querySelector<HTMLElement>('.glimpse-track');
	const lane = root.querySelector<HTMLElement>('.glimpse-lane');
	const rail = root.querySelector<HTMLElement>('.glimpse-rail');
	const ctl = root.querySelector<HTMLButtonElement>('.glimpse-ctl');
	if (!track || !lane || !rail || !ctl) return () => {};
	const ctlTxt = ctl.querySelector<HTMLElement>('.glimpse-ctl-txt');
	const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
	const phoneMq = matchMedia('(max-width: 807px)');
	const ac = new AbortController();
	const { signal } = ac;
	const mq = { on: false, userPlay: true, hover: false, touching: false, lastUser: -1e9, onScreen: true, v: 0, pos: 0, loop: 0, raf: 0, last: 0, groups: [] as HTMLElement[] };

	const loopOffset = () => (mq.groups.length ? mq.groups[0].offsetLeft - rail!.offsetLeft : 0);
	const focusHeld = () => {
		const a = document.activeElement;
		return !!a && track.contains(a) && a.matches(':focus-visible');
	};
	const modeBlocked = () => {
		const app = root.closest<HTMLElement>('.app');
		return !!document.querySelector('dialog[open]') || (!!app && (app.dataset.mode === 'map' || app.hasAttribute('data-revealing')));
	};

	function buildGroups() {
		const items = [...rail!.children];
		const make = () => {
			const g = document.createElement('div');
			g.className = 'glimpse-group';
			g.setAttribute('aria-hidden', 'true');
			for (const li of items) {
				const card = li.querySelector<HTMLElement>('[data-project]');
				if (!card) continue;
				const item = document.createElement('div');
				item.className = 'glimpse-item';
				const copy = document.createElement('div');
				copy.className = card.className;
				copy.dataset.cloneFor = card.dataset.project;
				copy.innerHTML = card.innerHTML;
				copy.querySelectorAll('img').forEach((im) => {
					im.removeAttribute('loading');
					im.alt = '';
				});
				item.appendChild(copy);
				g.appendChild(item);
			}
			return g;
		};
		// the scroll window runs from one loop to two loops: two loops plus a viewport
		const one = loopOffset() || rail!.offsetWidth + parseFloat(getComputedStyle(lane!).columnGap || '0');
		const need = Math.max(3, Math.ceil((2 * one + track!.clientWidth) / Math.max(one, 1)));
		while (mq.groups.length < need - 1) {
			const g = make();
			lane!.appendChild(g);
			mq.groups.push(g);
		}
	}
	function measure() {
		const frac = mq.loop > 0 ? (track!.scrollLeft - mq.loop) / mq.loop : 0;
		buildGroups();
		const loop = loopOffset();
		if (loop <= 0) return;
		mq.loop = loop;
		const f = mq.pos ? (((mq.pos % loop) + loop) % loop) / loop : Math.max(0, frac) % 1;
		mq.pos = loop + f * loop;
		track!.scrollLeft = mq.pos;
	}
	function normalize() {
		let s = track!.scrollLeft;
		const L = mq.loop;
		if (L <= 0) return;
		if (s < L || s >= 2 * L) {
			while (s < L) s += L;
			while (s >= 2 * L) s -= L;
			mq.pos = s;
			track!.scrollLeft = s;
		}
	}
	const wantRun = () =>
		mq.on && mq.userPlay && !reduceMq.matches && !mq.hover && !mq.touching && !focusHeld() && performance.now() - mq.lastUser > RESUME_DELAY && !modeBlocked() && mq.onScreen && !document.hidden;

	function frame(t: number) {
		mq.raf = 0;
		if (!mq.on || !mq.onScreen || document.hidden) {
			mq.v = 0;
			return;
		}
		const dt = Math.min(0.064, Math.max(0, (t - mq.last) / 1000));
		mq.last = t;
		const s = track!.scrollLeft;
		if (Math.abs(s - mq.pos) > 1.5) {
			mq.pos = s; // the visitor moved it
			mq.lastUser = performance.now();
		}
		const run = wantRun();
		// ease up on start and resume; any blocking condition stops the motion at once
		mq.v = run ? mq.v + (1 - mq.v) * (1 - Math.exp(-dt / EASE)) : 0;
		if (mq.v > 0) {
			mq.pos += (phoneMq.matches ? PHONE_SPEED : DESKTOP_SPEED) * mq.v * dt;
			if (mq.pos >= 2 * mq.loop) mq.pos -= mq.loop;
			track!.scrollLeft = mq.pos;
		} else if (!mq.touching && !focusHeld() && performance.now() - mq.lastUser > 160) {
			normalize();
		}
		mq.raf = requestAnimationFrame(frame);
	}
	function kick() {
		if (mq.on && !mq.raf && mq.onScreen && !document.hidden) {
			mq.last = performance.now();
			mq.raf = requestAnimationFrame(frame);
		}
	}
	function setCtl() {
		const paused = !mq.userPlay;
		ctl!.dataset.state = paused ? 'paused' : 'playing';
		ctl!.setAttribute('aria-label', paused ? 'Play project preview motion' : 'Pause project preview motion');
		if (ctlTxt) ctlTxt.textContent = paused ? 'Play' : 'Pause';
	}
	function enable() {
		if (mq.on) return;
		mq.on = true;
		root.dataset.marquee = 'on';
		ctl!.hidden = false;
		setCtl();
		mq.loop = 0;
		mq.pos = 0;
		measure();
		kick();
	}
	function disable() {
		if (!mq.on) return;
		mq.on = false;
		cancelAnimationFrame(mq.raf);
		mq.raf = 0;
		mq.v = 0;
		mq.groups.forEach((g) => g.remove());
		mq.groups = [];
		delete root.dataset.marquee;
		ctl!.hidden = true;
		track!.scrollLeft = 0;
	}
	const syncMotion = () => (reduceMq.matches ? disable() : enable());

	ctl.addEventListener(
		'click',
		() => {
			mq.userPlay = !mq.userPlay;
			if (!mq.userPlay) mq.v = 0;
			setCtl();
		},
		{ signal }
	);
	track.addEventListener('pointerenter', (e) => {
		if (e.pointerType === 'mouse' || e.pointerType === 'pen') mq.hover = true;
	}, { signal });
	track.addEventListener('pointerleave', () => {
		mq.hover = false;
		mq.lastUser = performance.now() - RESUME_DELAY + 400;
	}, { signal });
	track.addEventListener('pointerdown', (e) => {
		if (e.pointerType !== 'mouse') mq.touching = true;
		mq.lastUser = performance.now();
	}, { signal });
	const release = () => {
		mq.touching = false;
		mq.lastUser = performance.now();
	};
	track.addEventListener('pointerup', release, { signal });
	track.addEventListener('pointercancel', release, { signal });
	track.addEventListener('wheel', () => (mq.lastUser = performance.now()), { passive: true, signal });
	track.addEventListener('scroll', () => {
		if (mq.on && Math.abs(track.scrollLeft - mq.pos) > 1.5) {
			mq.pos = track.scrollLeft;
			mq.lastUser = performance.now();
		}
	}, { passive: true, signal });
	// keyboard focus on an original card brings it into view; focusHeld() then pauses motion
	track.addEventListener('focusin', (e) => {
		const target = e.target as HTMLElement;
		if (!mq.on || !target.matches(':focus-visible')) return;
		const tr = track.getBoundingClientRect();
		const cr = target.getBoundingClientRect();
		const pad = 28;
		if (cr.left < tr.left + pad) track.scrollLeft -= tr.left + pad - cr.left;
		else if (cr.right > tr.right - pad) track.scrollLeft += cr.right - (tr.right - pad);
		mq.pos = track.scrollLeft;
	}, { signal });
	track.addEventListener('focusout', () => (mq.lastUser = performance.now()), { signal });
	// a visual copy forwards its click, with modifiers, to the original card
	track.addEventListener('click', (e) => {
		const copy = (e.target as HTMLElement).closest<HTMLElement>('[data-clone-for]');
		if (!copy) return;
		e.preventDefault();
		const original = rail.querySelector<HTMLElement>(`[data-project="${CSS.escape(copy.dataset.cloneFor ?? '')}"]`);
		original?.dispatchEvent(
			new MouseEvent('click', { bubbles: true, cancelable: true, button: e.button, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey })
		);
	}, { signal });
	reduceMq.addEventListener('change', syncMotion, { signal });
	phoneMq.addEventListener('change', () => mq.on && measure(), { signal });
	document.addEventListener('visibilitychange', kick, { signal });
	// dialogs: `close` does not bubble, so listen in the capture phase
	document.addEventListener('close', kick, { capture: true, signal });
	const io = new IntersectionObserver(([en]) => {
		mq.onScreen = en.isIntersecting;
		kick();
	});
	io.observe(track);
	const ro = new ResizeObserver(() => mq.on && measure());
	ro.observe(rail);
	ro.observe(track);
	syncMotion();

	return () => {
		ac.abort();
		io.disconnect();
		ro.disconnect();
		disable();
	};
}
