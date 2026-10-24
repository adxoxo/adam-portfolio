import { $, component$, sync$, useContext } from '@qwik.dev/core';
import { SiteStateCtx } from './state';
import { openContact } from './ContactDialog';
import { animateTo } from './runtime/switch';
import { ProjectPreviews } from './ProjectPreviews';
import { replayDragon } from './runtime/dragon-intro';

const preventPlainMapClick = sync$((event: MouseEvent) => {
	if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
});

const Arrow = component$(() => (
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M3 8h10M9 4l4 4-4 4" />
	</svg>
));

/** Hero: the original dragon beside the full name and a decorative blue check,
 *  the tagline, two actions and the project previews. A plain click on the work
 *  link opens the project map in place; a modified click follows /#map. */
export const Hero = component$(() => {
	const state = useContext(SiteStateCtx);
	return (
		<header class="hero" id="top">
			<div class="wrap wrap--narrow">
				<div class="ident">
					<button class="dragon-replay" type="button" aria-label="Replay dragon intro" onClick$={() => replayDragon()}>
						<img class="ident-mark" src="/brand/dragon-mark.webp" alt="" width={128} height={160} decoding="async" />
						<span class="dragon-replay-label" aria-hidden="true">Replay dragon</span>
					</button>
					<div class="ident-text">
						<h1>
							Adam Scott{' '}
							<span class="nb">
								Gemenez
								<svg class="verified" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
									<path
										fill-rule="evenodd"
										d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
									/>
								</svg>
							</span>
						</h1>
						<p class="role">AI engineer / Software engineer</p>
						<a class="recognition" href="https://stellarph.io/programs/ph100/2026" target="_blank" rel="noopener noreferrer">
							<span>StellarPH · PH100 of 2026</span>
							<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M4 12 12 4M4 4h8v8" />
							</svg>
							<span class="sr-only"> (opens in a new tab)</span>
						</a>
					</div>
				</div>
				<p class="tag">
					Systems that make things <span class="accent">lighter.</span>
				</p>
				<p class="lede">
					Adam builds software people actually use: production-ready client systems, AI tools, web apps, automations, and embedded devices. Whatever the problem needs, the goal stays simple: make work and life lighter.
				</p>
				<div class="cta-row">
					<a
						class="btn"
						href="#map"
						onClick$={[
							preventPlainMapClick,
							$((event: MouseEvent) => {
								if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
								animateTo(state, 1);
							})
						]}
					>
						See Adam's work
						<Arrow />
					</a>
					<button type="button" id="hero-contact" class="btn btn--ghost" onClick$={openContact}>
						Work with Adam
						<Arrow />
					</button>
				</div>
				<ProjectPreviews />
			</div>
		</header>
	);
});
