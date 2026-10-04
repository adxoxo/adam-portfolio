import { component$ } from '@qwik.dev/core';
import type { DocumentHead } from '@qwik.dev/router';
import { PageShell } from '~/components/site/PageShell';
import { CALENDLY_URL, EMAIL, MAILTO, SITE_URL } from '~/components/site/state';

const UPDATED = '4 october 2026';

export default component$(() => (
	<PageShell>
		<h1>privacy</h1>
		<p class="lede">
			this portfolio has no sign-up, no contact form and no advertising. this page lists what happens to data when you visit it, based on how the site is
			actually built and hosted.
		</p>
		<p class="updated">last updated {UPDATED}</p>

		<section aria-labelledby="pv-host">
			<h2 id="pv-host">hosting and request logs</h2>
			<p>
				the site runs on cloudflare workers. like any web host, cloudflare receives the technical details of each request to deliver the page and protect
				it from abuse: your ip address, the page or file you asked for, the time, your browser&apos;s user agent and the referring page.
			</p>
			<p>
				request logs and the site&apos;s own server log lines are kept in cloudflare&apos;s logging service for a limited period that cloudflare sets. i use
				them to find errors. they are not used to build a profile of you. cloudflare&apos;s own handling is described in the{' '}
				<a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">
					cloudflare privacy policy
				</a>
				.
			</p>
		</section>

		<section aria-labelledby="pv-analytics">
			<h2 id="pv-analytics">cloudflare web analytics</h2>
			<p>
				cloudflare adds its web analytics script to the pages at its edge. the script loads from static.cloudflareinsights.com and sends a small report
				to this site&apos;s /cdn-cgi/rum address: the page address, the referring page, browser and device type, and page load timing. i see the results
				only as totals, such as visits per page.
			</p>
			<p>cloudflare states that this analytics product does not use cookies or local storage. no other analytics or tracking tool runs on this site.</p>
		</section>

		<section aria-labelledby="pv-cookies">
			<h2 id="pv-cookies">cookies and browser storage</h2>
			<p>
				the public pages set no cookies and write nothing to your browser&apos;s storage, so there is no cookie banner. the only cookies this site sets are
				the login cookies of the private /admin page, which only i use to edit project content.
			</p>
		</section>

		<section aria-labelledby="pv-content">
			<h2 id="pv-content">project content</h2>
			<p>
				the project texts come from a supabase database. the server reads the published projects and sends you a finished page, so your browser does not
				connect to supabase. nothing about your visit is written to that database. if the database cannot be reached, the server uses a built-in copy of
				the same projects.
			</p>
		</section>

		<section aria-labelledby="pv-media">
			<h2 id="pv-media">videos, images and fonts</h2>
			<p>
				every project video, poster, caption file, image and font is served from this site&apos;s own address. the pages do not load youtube, loom, google
				fonts or another media host. the videos use demo data or public project data, never real customer records.
			</p>
			<p>
				one exception exists for the future: if a project only has an older loom walkthrough, its dialog asks before it loads anything from loom.com.
			</p>
		</section>

		<section aria-labelledby="pv-calendly">
			<h2 id="pv-calendly">booking a call</h2>
			<p>
				the booking button is a plain link to{' '}
				<a href={CALENDLY_URL} target="_blank" rel="noopener">
					my calendly page
				</a>
				. nothing loads from calendly until you press it. when you book a time there, calendly handles the details you enter under the{' '}
				<a href="https://calendly.com/legal/privacy-notice" target="_blank" rel="noopener">
					calendly privacy notice
				</a>
				, and i receive the booking.
			</p>
		</section>

		<section aria-labelledby="pv-email">
			<h2 id="pv-email">email</h2>
			<p>
				the email links open your own email app with my address, <a href={MAILTO}>{EMAIL}</a>. the site does not send or store the message. your email
				provider and mine (gmail) process it like any other email. i use what you write only to reply to you.
			</p>
		</section>

		<section aria-labelledby="pv-links">
			<h2 id="pv-links">links to other sites</h2>
			<p>
				project pages link to github repositories and to some live project sites, and the footer links to github, linkedin, instagram and threads. once
				you follow a link, that site&apos;s own privacy policy applies.
			</p>
		</section>

		<section aria-labelledby="pv-contact">
			<h2 id="pv-contact">questions</h2>
			<p>
				write to <a href={MAILTO}>{EMAIL}</a> with any question about this page or to ask what data about you i hold, which for most visitors is none.
			</p>
		</section>
	</PageShell>
));

export const head: DocumentHead = {
	links: [{ rel: 'canonical', href: `${SITE_URL}/privacy` }],
	title: 'Privacy | Adam Gemenez',
	meta: [
		{ name: 'description', content: 'what happens to data when you visit adam’s portfolio: cloudflare hosting, request logs and web analytics, no cookies on public pages.' },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:site_name', content: 'Adam Gemenez portfolio' },
		{ property: 'og:title', content: 'Privacy | Adam Gemenez' },
		{ property: 'og:description', content: 'What happens to data when you visit Adam’s portfolio, including hosting, request logs, analytics and public-page storage.' },
		{ property: 'og:url', content: `${SITE_URL}/privacy` },
		{ name: 'twitter:card', content: 'summary' }
	]
};
