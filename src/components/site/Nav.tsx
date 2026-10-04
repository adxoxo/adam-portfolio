import { $, component$, sync$, useContext } from '@qwik.dev/core';
import { SiteStateCtx } from './state';
import { openContact } from './ContactDialog';
import { animateTo, keyOnKnob, startDrag, toggleFromClick } from './runtime/switch';

const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '];
const preventKeys = sync$((e: KeyboardEvent) => {
	if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '].includes(e.key)) e.preventDefault();
});

/** Floating pill nav. Home: photo, name, site/map switch, contact. Other pages:
 *  photo, name, back to the portfolio, contact. */
export const Nav = component$<{ variant: 'home' | 'page' }>(({ variant }) => {
	const state = useContext(SiteStateCtx);
	const map = state.mode === 'map';
	return (
		<nav class="pill" aria-label="main">
			<a class="brand" href={variant === 'home' ? '/#top' : '/'}>
				<img class="brand-photo" src="/brand/portrait-112.webp" alt="" width={34} height={34} decoding="async" />
				<span>adam</span>
			</a>
			<div class="divider" aria-hidden="true" />
			{variant === 'home' ? (
				<div class="switch" role="group" aria-label="view">
					<button type="button" class="end" aria-pressed={!map} onClick$={() => animateTo(state, 0)}>
						site
					</button>
					<div class="slider" style={{ '--r': map ? 1 : 0 }} onClick$={() => toggleFromClick(state)}>
						<div class="fill" />
						<div
							class="knob"
							role="slider"
							tabIndex={0}
							aria-label="switch between the site and the project map"
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={map ? 100 : 0}
							aria-valuetext={map ? 'project map' : 'site'}
							onPointerDown$={(e, el) => startDrag(state, e, el)}
							onKeyDown$={[
								preventKeys,
								$((e: KeyboardEvent) => {
									if (KEYS.includes(e.key)) keyOnKnob(state, e.key);
								})
							]}
						>
							<span />
							<span />
						</div>
					</div>
					<button type="button" class="end" aria-pressed={map} onClick$={() => animateTo(state, 1)}>
						map
					</button>
				</div>
			) : (
				<a class="pill-back" href="/" aria-label="back to portfolio">
					back<span class="wide-only"> to portfolio</span>
				</a>
			)}
			<div class="divider" aria-hidden="true" />
			<button type="button" id="nav-contact" class="pill-cta" onClick$={openContact}>
				work with me
			</button>
		</nav>
	);
});
