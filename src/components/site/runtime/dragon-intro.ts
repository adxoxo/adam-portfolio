// Browser-only, decorative intro. No focus trap, scroll lock, or dependency on project media.
const SESSION_KEY = 'portfolio:dragon-intro:v1';
const REPLAY = 'portfolio:replay-dragon';

export function replayDragon() {
	document.dispatchEvent(new Event(REPLAY));
}

export function attachDragonIntro(root: HTMLElement) {
	const mark = root.querySelector('img')!;
	const hero = document.querySelector<HTMLImageElement>('.ident-mark');
	const app = root.closest<HTMLElement>('.app');
	if (!hero || !app) return () => {};
	const motion = matchMedia('(prefers-reduced-motion: reduce)');
	let cancel = () => {};
	let disposed = false;

	const ready = () => hero.complete && hero.naturalWidth > 0 && document.fonts.status === 'loaded';
	const allowed = () => !disposed && !motion.matches && document.visibilityState === 'visible' &&
		app.dataset.mode === 'site' && !app.hasAttribute('data-revealing') && !document.querySelector('dialog[open]');

	const play = async (manual: boolean) => {
		cancel();
		if (!allowed() || typeof mark.animate !== 'function') return;
		if (!manual && (location.hash || scrollY > 0 || ready())) return;
		if (hero.complete && !hero.naturalWidth) return;
		const animations: Animation[] = [];
		let stopped = false;
		const stop = () => {
			if (stopped) return;
			stopped = true;
			root.hidden = true;
			clearTimeout(timeout);
			animations.forEach((a) => a.cancel());
			window.removeEventListener('pointerdown', stop, true);
			window.removeEventListener('keydown', stop, true);
			window.removeEventListener('scroll', stop);
			motion.removeEventListener('change', stop);
			document.removeEventListener('visibilitychange', stop);
			observer.disconnect();
		};
		const observer = new MutationObserver(() => { if (!allowed()) stop(); });
		const timeout = window.setTimeout(stop, 1200);
		cancel = stop;
		observer.observe(app, { attributes: true, attributeFilter: ['data-mode', 'data-revealing'] });
		window.addEventListener('pointerdown', stop, true);
		window.addEventListener('keydown', stop, true);
		motion.addEventListener('change', stop);
		document.addEventListener('visibilitychange', stop);
		// Let our own scroll event finish before user scrolling becomes a cancel signal.
		if (manual && scrollY > 0) {
			window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		}
		if (stopped || !allowed()) { stop(); return; }
		window.addEventListener('scroll', stop, { passive: true });

		const animate = (element: HTMLElement, frames: Keyframe[], duration: number) => {
			const animation = element.animate(frames, { duration, fill: 'both', easing: 'cubic-bezier(.22,1,.36,1)' });
			animations.push(animation);
			return animation.finished;
		};
		try {
			// decode() may fail or stall. The lifetime timer still clears the overlay.
			await mark.decode();
			if (stopped || !allowed() || (!manual && ready())) return;
			root.hidden = false;
			await animate(mark, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], 180);
			if (stopped) return;
			if (manual) {
				await animate(mark, [{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }], 240);
			} else if (!ready()) {
				await Promise.race([
					Promise.all([hero.decode().catch(() => {}), document.fonts.ready]),
					new Promise((resolve) => setTimeout(resolve, 500))
				]);
			}
			if (stopped || !allowed()) return;
			const from = mark.getBoundingClientRect();
			const to = hero.getBoundingClientRect();
			const x = to.x + to.width / 2 - from.x - from.width / 2;
			const y = to.y + to.height / 2 - from.y - from.height / 2;
			await Promise.all([
				animate(mark, [{ opacity: 1, transform: 'translate(0,0) scale(1)' },
					{ opacity: 0, transform: `translate(${x}px,${y}px) scale(${to.width / from.width})` }], 260),
				animate(root, [{ opacity: 1 }, { opacity: 0 }], 260)
			]);
		} catch {
			// A missing image or canceled animation must leave the content available.
		} finally {
			stop();
		}
	};

	const replay = () => { void play(true); };
	document.addEventListener(REPLAY, replay);
	try {
		if (!sessionStorage.getItem(SESSION_KEY)) {
			sessionStorage.setItem(SESSION_KEY, 'seen');
			void play(false);
		}
	} catch {
		// No storage permission: skip automatic replay rather than repeat on every visit.
	}
	return () => {
		disposed = true;
		cancel();
		document.removeEventListener(REPLAY, replay);
	};
}
