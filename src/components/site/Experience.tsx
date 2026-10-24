import { component$ } from '@qwik.dev/core';

interface Job {
	name: string;
	role: string;
	/** Optional description. Left out where Adam has confirmed only the role. */
	text?: string;
	/** Confirmed date label, shown in place of a Current / Previous word. */
	dates: string;
	/** Present or ongoing role: keeps the green date label. */
	current: boolean;
	/** Official company logo, a local file in public/brand/company-logos (provenance in the release notes). */
	logo?: { src: string; w: number; h: number; dark?: boolean };
}

// The five confirmed roles and dates, as Adam confirmed them on 2026-10-11. Nothing is added beyond that.
// Lead Flow Consulting uses the visible header wordmark of lukaslanx.com, the site Adam supplied for it
// (captured once, public GET; see the release notes). Tactiv Studios has only its role.
export const JOBS: Job[] = [
	{
		name: 'Lead Flow Consulting',
		role: 'AI engineer',
		text: 'AI and software systems, automation, integrations, and client engineering.',
		dates: '2026',
		current: false,
		logo: { src: '/brand/company-logos/leadflow.webp', w: 480, h: 72, dark: true }
	},
	{ name: 'Cleo', role: 'AI / Software engineer', text: 'Voice AI for automotive dealerships.', dates: '2026', current: true, logo: { src: '/brand/company-logos/cleo.svg', w: 88, h: 28 } },
	{ name: 'Typid', role: 'Co-founder / Engineer', text: 'An event platform built with trusted former colleagues.', dates: '2026', current: true, logo: { src: '/brand/company-logos/typid.svg', w: 110, h: 32 } },
	{
		name: 'SILVR AI Automation',
		role: 'AI automation / GoHighLevel',
		text: 'AI automation and GoHighLevel work for foreign clients.',
		dates: '2026',
		current: false,
		logo: { src: '/brand/company-logos/silvr.webp', w: 394, h: 120, dark: true }
	},
	{ name: 'Tactiv Studios', role: 'Project manager', dates: '2021 - 2023', current: false, logo: { src: '/brand/company-logos/tactiv.svg', w: 143, h: 32 } }
];

export const Experience = component$(() => (
	<section class="section home-sec" id="experience" aria-labelledby="exp-h">
		<div class="wrap wrap--narrow">
			<p class="eyebrow">01 / Experience</p>
			<h2 id="exp-h">Where Adam works.</h2>
			<ul class="jobs">
				{JOBS.map((j) => (
					<li class="job" key={j.name}>
						<span class={j.logo?.dark ? 'job-logo dark' : j.logo ? 'job-logo' : 'job-logo none'} aria-hidden="true">
							{j.logo && <img src={j.logo.src} alt="" width={j.logo.w} height={j.logo.h} loading="lazy" decoding="async" />}
						</span>
						<div class="job-text">
							<h3>{j.name}</h3>
							<p class="role">{j.role}</p>
							{j.text && <p>{j.text}</p>}
						</div>
						<span class={j.current ? 'status current' : 'status'}>{j.dates}</span>
					</li>
				))}
			</ul>
			<figure class="testimonial" aria-labelledby="testimonial-label">
				<p class="eyebrow" id="testimonial-label">From a client</p>
				<blockquote cite="https://v2.onlinejobs.ph/jobseekers/info/4420845">
					<p>Adam worked for us as a full-time developer for 4 months, and he did an amazing job. Highly recommended.</p>
					<p>Adam is a very reliable, competent, and easy-to-work-with contractor. Besides his technical ability, he also has a very nice personality. If you're looking for a proactive developer that really cares about your business, I can highly recommend Adam to you.</p>
					<p>(The direction of our company changed. Otherwise, we would definitely still keep him in his position.)</p>
				</blockquote>
				<figcaption>
					<div>
						<p class="testimonial-name">Lukas Lanx</p>
						<p class="testimonial-context">Client · 4-month full-time engagement</p>
					</div>
					<a class="text-link" href="https://v2.onlinejobs.ph/jobseekers/info/4420845" target="_blank" rel="noopener noreferrer">
						View on OnlineJobs.ph <span aria-hidden="true">↗</span>
						<span class="sr-only"> (opens in a new tab)</span>
					</a>
				</figcaption>
			</figure>
		</div>
	</section>
));
