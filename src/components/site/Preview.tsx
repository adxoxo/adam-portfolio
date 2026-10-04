import { component$, useSignal, useVisibleTask$ } from '@qwik.dev/core';
import type { Demo } from '~/lib/data/demos';
import { Icon } from './icons';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Attaches the source on first use, so a preview never downloads before it plays. */
function start(v: HTMLVideoElement) {
	if (!v.getAttribute('src') && v.dataset.src) v.setAttribute('src', v.dataset.src);
	const p = v.play();
	if (p) p.then(() => v.setAttribute('data-on', '')).catch(() => {});
	else v.setAttribute('data-on', '');
}

/** Hover preview for desktop pointers. Muted, never on touch, never with reduced motion. */
export function hoverPreview(e: PointerEvent, card: Element, on: boolean) {
	if (e.pointerType !== 'mouse') return;
	const v = card.querySelector<HTMLVideoElement>('.frame video');
	if (!v) return;
	if (on && !reduced()) start(v);
	else v.pause();
}

/** Poster with a muted, silent preview layer. Decorative: the card title is the control. */
export const PosterFrame = component$<{ demo: Demo; eager?: boolean; thumb?: boolean }>(({ demo, eager, thumb }) => (
	<div class="frame" aria-hidden="true">
		<img src={thumb ? demo.thumb : demo.poster} alt="" width={thumb ? 640 : demo.width} height={thumb ? 360 : demo.height} loading={eager ? 'eager' : 'lazy'} decoding="async" />
		{!thumb && <video muted playsInline loop preload="none" data-src={demo.url} tabIndex={-1} width={demo.width} height={demo.height} />}
		<span class="play-mark">
			<Icon name="play" />
		</span>
	</div>
));

/**
 * The lead preview: plays muted while at least a third of it is on screen, the
 * tab is visible and the visitor allows motion. It pauses off screen. A visible
 * control pauses or resumes it; with reduced motion it starts only from that control.
 */
export const LeadPreview = component$<{ demo: Demo; title: string }>(({ demo, title }) => {
	const box = useSignal<HTMLElement>();
	const playing = useSignal(false);
	const userPaused = useSignal(false);

	useVisibleTask$(({ cleanup }) => {
		const v = box.value?.querySelector('video');
		if (!v) return;
		let inView = false;
		const sync = () => {
			if (inView && !userPaused.value && !reduced() && !document.hidden) start(v);
			else if (!v.paused) v.pause();
		};
		const io = new IntersectionObserver(
			([e]) => {
				inView = e.isIntersecting && e.intersectionRatio >= 0.33;
				sync();
			},
			{ threshold: [0, 0.33, 0.66] }
		);
		io.observe(v);
		document.addEventListener('visibilitychange', sync);
		cleanup(() => {
			io.disconnect();
			document.removeEventListener('visibilitychange', sync);
			v.pause();
		});
	});

	return (
		<div class="lead-media" ref={box}>
			<div class="frame">
				<img src={demo.poster} alt="" width={demo.width} height={demo.height} decoding="async" />
				<video
					muted
					playsInline
					loop
					preload="none"
					data-src={demo.url}
					aria-hidden="true"
					tabIndex={-1}
					width={demo.width}
					height={demo.height}
					onPlay$={() => (playing.value = true)}
					onPause$={() => (playing.value = false)}
				/>
			</div>
			<button
				type="button"
				class="preview-ctl"
				aria-label={playing.value ? `pause the silent ${title} preview` : `play the silent ${title} preview`}
				onClick$={(_, el) => {
					const v = el.parentElement?.querySelector('video');
					if (!v) return;
					if (playing.value) {
						userPaused.value = true;
						v.pause();
					} else {
						userPaused.value = false;
						start(v);
					}
				}}
			>
				<Icon name={playing.value ? 'pause' : 'play'} />
				{playing.value ? 'pause preview' : 'play preview'}
			</button>
		</div>
	);
});
