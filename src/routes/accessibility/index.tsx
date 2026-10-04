import { component$ } from '@qwik.dev/core';
import type { DocumentHead } from '@qwik.dev/router';
import { PageShell } from '~/components/site/PageShell';
import { EMAIL, MAILTO, SITE_URL } from '~/components/site/state';

const UPDATED = '4 october 2026';

export default component$(() => (
	<PageShell>
		<h1>accessibility</h1>
		<p class="lede">
			i want every project here to be usable with a keyboard, a phone, a screen reader and with motion turned down. this page says what the site does
			today and where it still falls short.
		</p>
		<p class="updated">last updated {UPDATED}</p>

		<section aria-labelledby="ac-keys">
			<h2 id="ac-keys">keyboard</h2>
			<ul>
				<li>every link and control is reachable with tab and shows a visible focus outline. a skip link jumps past the navigation.</li>
				<li>the site and map switch in the navigation takes the arrow keys, home, end, enter and space. the site and map buttons beside it do the same.</li>
				<li>on the map, tab moves through the projects cluster by cluster, the cluster buttons at the top jump to a cluster, + and - zoom, 0 fits the board, and escape returns to the site where you left it.</li>
				<li>project and contact dialogs move focus inside, keep tab inside, close with escape or the close button, and return focus to the control that opened them.</li>
			</ul>
		</section>

		<section aria-labelledby="ac-touch">
			<h2 id="ac-touch">touch and small screens</h2>
			<ul>
				<li>buttons and links have touch targets of at least 44 by 44 pixels.</li>
				<li>the layout works down to a 320 pixel wide screen without sideways scrolling, and it respects browser text zoom.</li>
				<li>on a phone the map is a vertical board with readable labels. scroll with one finger, pinch with two, or use the zoom and fit buttons.</li>
			</ul>
		</section>

		<section aria-labelledby="ac-video">
			<h2 id="ac-video">video and sound</h2>
			<ul>
				<li>nothing plays sound on its own. sound starts only when you press play with sound or the play button.</li>
				<li>the player has play and pause, a seek bar, mute, captions and full screen buttons, all with text labels for screen readers.</li>
				<li>every video has a caption track that describes the steps on screen. captions start switched on and the cc button turns them off.</li>
				<li>the preview in selected work is silent, pauses when it leaves the screen and has its own pause button.</li>
				<li>if a video fails to load, the player offers a retry button and a download link.</li>
			</ul>
		</section>

		<section aria-labelledby="ac-motion">
			<h2 id="ac-motion">reduced motion</h2>
			<p>
				when your system asks for reduced motion, the hero logo and text appear without animation, the site and map switch changes at once, the moving
				current on the map stops, and the selected work preview does not start by itself. you can still play any video with its controls.
			</p>
		</section>

		<section aria-labelledby="ac-limits">
			<h2 id="ac-limits">known limits</h2>
			<ul>
				<li>the videos have sound effects but no spoken narration. the captions carry the description instead.</li>
				<li>the map is a visual layout. the same projects, with the same details, are in the all projects list on the main page.</li>
				<li>calendly, github and the social sites have their own accessibility, which i cannot change.</li>
				<li>the site uses the wcag 2.2 aa success criteria as its target. it has not had an independent audit.</li>
			</ul>
		</section>

		<section aria-labelledby="ac-contact">
			<h2 id="ac-contact">report a problem</h2>
			<p>
				if something on this site does not work for you, write to <a href={MAILTO}>{EMAIL}</a>. tell me the page, what you tried and the device or
				assistive technology you use, and i will fix it or send you the content another way.
			</p>
		</section>
	</PageShell>
));

export const head: DocumentHead = {
	links: [{ rel: 'canonical', href: `${SITE_URL}/accessibility` }],
	title: 'Accessibility | Adam Gemenez',
	meta: [
		{ name: 'description', content: 'how adam’s portfolio works with a keyboard, touch, screen readers, captions and reduced motion, and how to report a problem.' },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:site_name', content: 'Adam Gemenez portfolio' },
		{ property: 'og:title', content: 'Accessibility | Adam Gemenez' },
		{ property: 'og:description', content: 'How Adam’s portfolio supports keyboard, touch, screen readers, captions and reduced motion, plus known limits.' },
		{ property: 'og:url', content: `${SITE_URL}/accessibility` },
		{ name: 'twitter:card', content: 'summary' }
	]
};
