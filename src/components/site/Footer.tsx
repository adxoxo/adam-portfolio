import { component$, useContext } from '@qwik.dev/core';
import { SOCIALS } from '~/lib/data/socials';
import { CALENDLY_URL, EMAIL, MAILTO, SiteStateCtx } from './state';
import { openContact } from './ContactDialog';
import { animateTo } from './runtime/switch';
import { Icon } from './icons';

/** Footer: contact callout, site navigation, contact routes, public social
 *  profiles, policy pages, copyright and back to top. */
export const Footer = component$<{ variant: 'home' | 'page' }>(({ variant }) => {
	const state = useContext(SiteStateCtx);
	const home = variant === 'home';
	const year = new Date().getFullYear();
	const social = SOCIALS.filter((s) => !s.email);
	return (
		<footer class="footer" aria-labelledby="foot-h">
			<div class="wrap">
				<div class="foot-call">
					<div>
						<h2 id="foot-h">let's talk</h2>
						<p>tell me what you are building and where it feels heavy. book a call or write an email, whichever is easier.</p>
					</div>
					<div class="cta-row">
						<button type="button" id={`foot-contact-${variant}`} class="btn" onClick$={openContact}>
							work with me
						</button>
					</div>
				</div>
				<div class="foot-grid">
					<div class="foot-brand">
						<a class="brand" href={home ? '#top' : '/'}>
							<img src="/brand/dragon-mark.webp" alt="" width={128} height={160} loading="lazy" />
							<span>adam</span>
						</a>
						<p>ai engineer and full-stack developer. i build systems that make things lighter: ai, web apps, automations and embedded devices.</p>
					</div>
					<nav class="foot-col" aria-label="site">
						<h3>site</h3>
						<ul>
							<li>
								<a href={home ? '#work' : '/#work'}>selected work</a>
							</li>
							<li>
								<a href={home ? '#projects' : '/#projects'}>all projects</a>
							</li>
							<li>
								{home ? (
									<button type="button" onClick$={() => animateTo(state, 1)}>
										project map
									</button>
								) : (
									<a href="/#map">project map</a>
								)}
							</li>
							<li>
								<a href={home ? '#about' : '/#about'}>what i do</a>
							</li>
						</ul>
					</nav>
					<div class="foot-col">
						<h3>contact</h3>
						<ul>
							<li>
								<a href={MAILTO}>
									<Icon name="mail" />
									<span class="addr">{EMAIL}</span>
								</a>
							</li>
							<li>
								<a href={CALENDLY_URL} target="_blank" rel="noopener">
									<Icon name="calendar" />
									book a call on calendly
								</a>
							</li>
						</ul>
					</div>
					<div class="foot-col">
						<h3>elsewhere</h3>
						<ul>
							{social.map((s) => (
								<li key={s.name}>
									<a href={s.url} target="_blank" rel="noopener me">
										<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
											<path d={s.path} fill="currentColor" />
										</svg>
										{s.name}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>
				<div class="foot-base">
					<p>© {year} adam</p>
					<nav aria-label="legal and page">
						<a href="/privacy">privacy</a>
						<a href="/accessibility">accessibility</a>
						<a href="#top">back to top</a>
					</nav>
				</div>
			</div>
		</footer>
	);
});
