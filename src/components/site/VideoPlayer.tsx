import { $, component$, sync$, untrack, useSignal, useStore } from '@qwik.dev/core';
import type { Demo } from '~/lib/data/demos';
import { NARRATED_DEMOS } from '~/lib/data/presentation';
import { Icon } from './icons';

const fmt = (s: number) => {
	if (!Number.isFinite(s) || s < 0) s = 0;
	const m = Math.floor(s / 60);
	const r = Math.floor(s % 60);
	return `${m}:${r.toString().padStart(2, '0')}`;
};

// Play, pause, mute and fullscreen run synchronously inside the user gesture
// (sync$), so iOS Safari accepts sound playback and fullscreen requests even
// before the rest of the player code has loaded.
const togglePlay = sync$((_: Event, el: Element) => {
	const v = el.closest('.vp')?.querySelector('video');
	if (!v) return;
	if (v.paused || v.ended) {
		const p = v.play();
		if (p) p.catch(() => {});
	} else v.pause();
});
const playWithSound = sync$((_: Event, el: Element) => {
	const v = el.closest('.vp')?.querySelector('video');
	if (!v) return;
	v.muted = false;
	v.volume = 1;
	const p = v.play();
	if (p) p.catch(() => {});
});
const toggleMute = sync$((_: Event, el: Element) => {
	const v = el.closest('.vp')?.querySelector('video');
	if (v) v.muted = !v.muted;
});
// seeks inside the input event, before a time update can re-render the slider value
const seekNow = sync$((_: Event, el: HTMLInputElement) => {
	const v = el.closest('.vp')?.querySelector('video');
	if (v) v.currentTime = el.valueAsNumber;
});
const toggleFull = sync$((_: Event, el: Element) => {
	const box = el.closest('.vp') as (HTMLElement & { webkitRequestFullscreen?: () => void }) | null;
	const v = box?.querySelector('video') as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
	const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
	if (doc.fullscreenElement || doc.webkitFullscreenElement) {
		if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
		else doc.webkitExitFullscreen?.();
		return;
	}
	if (box?.requestFullscreen) box.requestFullscreen().catch(() => {});
	else if (box?.webkitRequestFullscreen) box.webkitRequestFullscreen();
	else v?.webkitEnterFullscreen?.();
});

/**
 * Local demo video with its own controls. Nothing plays until the visitor
 * presses play, and sound starts only from that press. Captions come from the
 * native WebVTT track and start visible, because most videos have no narration.
 * A narrated demo speaks the description instead, so it has no caption track and
 * no cc button; its readable transcript stays on the case-study page.
 */
export const VideoPlayer = component$<{ demo: Demo; title: string }>(({ demo, title }) => {
	const video = useSignal<HTMLVideoElement>();
	const narrated = NARRATED_DEMOS.has(demo.id);
	// A plain value, not a prop signal: the first re-render after resuming a server-rendered
	// player would otherwise set src again, which reloads the video and stops the first play.
	const src = untrack(() => demo.url);
	const st = useStore({
		started: false,
		playing: false,
		muted: false,
		time: 0,
		duration: demo.durationSeconds,
		captions: true,
		error: false,
		waiting: false,
		full: false
	});

	const setCaptions = $((on: boolean) => {
		const t = video.value?.textTracks?.[0];
		if (t) t.mode = on ? 'showing' : 'hidden';
		st.captions = on;
	});

	const retry = $(() => {
		st.error = false;
		st.waiting = false;
		video.value?.load();
	});

	const mb = (demo.bytes / 1048576).toFixed(1);

	return (
		<div class="vp" data-playing={st.playing ? '' : undefined} onFullscreenChange$={() => (st.full = !!document.fullscreenElement)}>
			<div class="vp-stage" style={{ aspectRatio: `${demo.width} / ${demo.height}` }}>
				<video
					ref={video}
					src={src}
					poster={demo.poster}
					preload="metadata"
					playsInline
					width={demo.width}
					height={demo.height}
					aria-label={`${title} demo video`}
					onPlay$={() => {
						st.started = true;
						st.playing = true;
					}}
					onPause$={() => (st.playing = false)}
					onEnded$={() => (st.playing = false)}
					onWaiting$={() => (st.waiting = true)}
					onPlaying$={() => (st.waiting = false)}
					onTimeUpdate$={(_, el) => (st.time = el.currentTime)}
					onLoadedMetadata$={(_, el) => {
						if (Number.isFinite(el.duration)) st.duration = el.duration;
						const t = el.textTracks?.[0];
						if (t) t.mode = st.captions ? 'showing' : 'hidden';
					}}
					onVolumeChange$={(_, el) => (st.muted = el.muted)}
					onError$={() => (st.error = true)}
					onClick$={togglePlay}
				>
					{!narrated && <track kind="captions" src={demo.captions} srclang="en" label="english" default />}
				</video>
				{!st.started && !st.error && (
					<button type="button" class="vp-big" onClick$={playWithSound}>
						<Icon name="play" /> play with sound
					</button>
				)}
				{st.error && (
					<div class="vp-msg" role="alert">
						<p>the video did not load.</p>
						<button type="button" class="btn" onClick$={retry}>
							<Icon name="retry" /> try again
						</button>
						<a href={demo.url} download>
							download the mp4 ({mb} mb)
						</a>
					</div>
				)}
			</div>
			<div class="vp-bar">
				<button type="button" class="vp-btn" aria-label={st.playing ? 'pause' : 'play'} onClick$={togglePlay}>
					<Icon name={st.playing ? 'pause' : 'play'} />
				</button>
				<span class="vp-time" aria-hidden="true">
					{fmt(st.time)}
					<span class="dur"> / {fmt(st.duration)}</span>
				</span>
				<input
					class="vp-seek"
					type="range"
					min={0}
					max={Math.max(1, Math.round(st.duration * 10) / 10)}
					step={0.1}
					value={st.time}
					aria-label="seek"
					aria-valuetext={`${fmt(st.time)} of ${fmt(st.duration)}`}
					onInput$={[seekNow, $((_: Event, el: HTMLInputElement) => (st.time = el.valueAsNumber))]}
				/>
				<button type="button" class="vp-btn" aria-label={st.muted ? 'turn sound on' : 'mute'} aria-pressed={st.muted} onClick$={toggleMute}>
					<Icon name={st.muted ? 'muted' : 'sound'} />
				</button>
				{!narrated && (
					<button type="button" class="vp-btn" aria-label="captions" aria-pressed={st.captions} onClick$={() => setCaptions(!st.captions)}>
						<span class="cc" aria-hidden="true">cc</span>
					</button>
				)}
				<button type="button" class="vp-btn" aria-label={st.full ? 'exit full screen' : 'full screen'} onClick$={toggleFull}>
					<Icon name="full" />
				</button>
			</div>
			{st.waiting && st.playing && (
				<p class="sr-only" role="status">
					loading the video
				</p>
			)}
		</div>
	);
});
