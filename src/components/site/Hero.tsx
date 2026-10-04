import { component$ } from '@qwik.dev/core';
import { openContact } from './ContactDialog';

/** Light hero. The supplied dragon sits behind the copy at low opacity and
 *  sweeps in once; reduced motion shows the final frame. */
export const Hero = component$(() => (
	<header class="hero" id="top">
		<img class="hero-mark logo-sweep play" src="/brand/dragon-light.webp" alt="" width={801} height={1000} decoding="async" />
		<div class="wrap">
			<div class="hero-copy">
				<p class="avail">
					<i aria-hidden="true" />
					available for new work
				</p>
				<h1>systems that make things lighter</h1>
				<p class="sub">
					i build systems. ai, full-stack, embedded, whatever the problem needs. i do it because i love it, and the good ones make life lighter, not just
					work.
				</p>
				<div class="cta-row">
					<a class="btn" href="#work">
						see adam's work
					</a>
					<button type="button" id="hero-contact" class="btn btn--ghost" onClick$={openContact}>
						work with me
					</button>
				</div>
			</div>
		</div>
	</header>
));
