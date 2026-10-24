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
			<div class="wrap wrap--narrow">
				<div class="foot-call">
					<div>
						<h2 id="foot-h">Have something in mind?</h2>
						<p>Tell Adam what feels heavy. He'll help find a simpler way. Book a call or write an email, whichever is easier.</p>
					</div>
					<div class="cta-row">
						<button type="button" id={`foot-contact-${variant}`} class="btn" onClick$={openContact}>
							Talk to Adam
						</button>
					</div>
				</div>
				<div class="foot-grid">
					<div class="foot-brand">
						<a class="brand" href={home ? '#top' : '/'}>
							<img src="/brand/dragon-mark.webp" alt="" width={128} height={160} loading="lazy" />
							<span>Adam Scott Gemenez</span>
						</a>
						<p>AI engineer and full-stack developer. Adam builds systems that make things lighter: AI, web apps, automations and embedded devices.</p>
					</div>
					<nav class="foot-col" aria-label="site">
						<h3>Site</h3>
						<ul>
							<li>
								{home ? (
									<button type="button" onClick$={() => animateTo(state, 1)}>
										Project map
									</button>
								) : (
									<a href="/#map">Project map</a>
								)}
							</li>
							<li>
								<a href={home ? '#experience' : '/#experience'}>Experience</a>
							</li>
							<li>
								<a href={home ? '#about' : '/#about'}>Capabilities</a>
							</li>
						</ul>
					</nav>
					<div class="foot-col">
						<h3>Contact</h3>
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
									Book a call on Calendly
								</a>
							</li>
						</ul>
					</div>
					<div class="foot-col">
						<h3>Elsewhere</h3>
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
					<p>© {year} Adam Scott Gemenez</p>
					<nav aria-label="legal and page">
						<a href="/privacy">Privacy</a>
						<a href="/accessibility">Accessibility</a>
						<a href="#top">Back to top</a>
					</nav>
				</div>
			</div>
		</footer>
	);
});
