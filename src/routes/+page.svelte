<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { replaceState } from '$app/navigation';
	import type { PageData } from './$types';
	import '$lib/portfolio/styles.css';
	import PillNav from '$lib/portfolio/PillNav.svelte';
	import ChatDemo from '$lib/portfolio/ChatDemo.svelte';
	import ProjectExplorer from '$lib/portfolio/ProjectExplorer.svelte';
	import ProjectDialog from '$lib/portfolio/ProjectDialog.svelte';
	import ContactDialog from '$lib/portfolio/ContactDialog.svelte';
	import WorkflowDiagram from '$lib/portfolio/WorkflowDiagram.svelte';
	import RotatingWord from '$lib/portfolio/RotatingWord.svelte';
	import markUrl from '$lib/assets/mark.png';
	import { CASES, LINKS, SERVICES, isServiceId, projectById, projectsOf, type Project, type ServiceId } from '$lib/portfolio/data';

	let { data }: { data: PageData } = $props();
	// approved content plus the media the database overlays (see +page.server.ts)
	const projects = $derived(data.projects);

	type View = 'overview' | 'index';

	let view = $state<View>('overview');
	let service = $state<ServiceId | 'all'>('all');
	let openProject = $state<Project | null>(null);
	let contactOpen = $state(false);
	let similarTo = $state<Project | null>(null);
	let announcement = $state('');
	let opener: HTMLElement | SVGElement | null = null;
	let explorer = $state<ReturnType<typeof ProjectExplorer>>();
	let heroTitle = $state<HTMLHeadingElement>();
	// the changing first word of the headline; "systems" stays the accessible name
	const HEADLINE_WORDS = ['systems', 'websites', 'automations', 'marketing', 'workflows'];

	// the project index is the dark map: pill, sidebar and canvas follow it
	const dark = $derived(view === 'index');
	// previous / next inside the dialog walk the list the visitor came from
	const dialogList = $derived(view === 'index' && service !== 'all' ? projectsOf(service, projects) : projects);

	function announce(msg: string) {
		announcement = '';
		setTimeout(() => (announcement = msg), 30);
	}

	/* ---------- hash routing: #overview, #about, #index/<service> ----------
	   The server always renders the light overview (the hash never reaches it);
	   the browser reads the hash once after hydration and from then on the url
	   follows the view. Older links with a trailing /map or /list, a bare
	   #index, and the previous site's #top / #work anchors still work. */
	let routed = false; // true once the browser has read the initial hash
	function readHash() {
		const h = location.hash.replace(/^#/, '');
		if (h.startsWith('index')) {
			const [, svc = 'all'] = h.split('/');
			service = svc === 'all' || isServiceId(svc) ? (svc as ServiceId | 'all') : 'all';
			view = 'index';
			return null;
		}
		view = 'overview';
		return h && h !== 'overview' && h !== 'top' ? h : null;
	}
	function writeHash() {
		const cur = location.hash.replace(/^#/, '');
		if (view === 'index') {
			const h = `index/${service}`;
			if (cur !== h) replaceState('#' + h, {});
		} else if (cur.startsWith('index')) {
			// back on the overview: only a stale index hash is replaced, a section
			// anchor such as #about or #work is left alone
			replaceState('#overview', {});
		}
	}
	$effect(() => {
		// keep the url in sync whenever view / service change, after the initial
		// read. untrack: replaceState reads SvelteKit's reactive page.url, and
		// without it a popstate would re-run this effect before the hashchange
		// handler has read the new hash, writing the old one back
		view; service;
		if (routed) untrack(writeHash);
	});
	function onHashChange() {
		const scroll = readHash();
		if (view === 'index') writeHash(); // canonicalise old /map and /list links even when nothing changed
		if (scroll) jumpTo(scroll);
	}
	// initial route, once the page is in the browser. SvelteKit's router finishes
	// initialising right after hydration, so the canonical hash (an old /map or
	// /list link rewritten) is written on the next task, and only from then on
	// does the url follow the view.
	onMount(() => {
		const scroll = readHash();
		const t = setTimeout(() => {
			writeHash();
			routed = true;
		}, 0);
		if (scroll) tick().then(() => jumpTo(scroll, true));
		return () => clearTimeout(t);
	});

	async function setView(v: View) {
		view = v;
		await tick();
		window.scrollTo({ top: 0, behavior: 'auto' });
		if (v === 'index') explorer?.focusTitle();
		else heroTitle?.focus({ preventScroll: true });
		announce(v === 'index' ? 'project index' : 'overview');
	}
	async function jumpTo(id: string, instant = false) {
		if (view !== 'overview') view = 'overview';
		await tick();
		const el = document.getElementById(id);
		if (!el) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: reduced || instant ? 'auto' : 'smooth', block: 'start' });
	}
	function selectService(svc: ServiceId | 'all') {
		service = svc;
		const n = svc === 'all' ? projects.length : projectsOf(svc, projects).length;
		announce(`${svc === 'all' ? 'all services' : SERVICES.find((s) => s.id === svc)!.title}, ${n} projects`);
	}
	// from the overview: jump straight into one service (or all of them) on the map
	async function jumpToService(svc: ServiceId | 'all') {
		service = svc;
		await setView('index');
	}
	/* ---------- dialogs ---------- */
	function open(id: string, from: HTMLElement | SVGElement) {
		const p = projectById(id, projects);
		if (!p) return;
		opener = from;
		openProject = p;
	}
	function restoreFocus() {
		const o = opener;
		opener = null;
		if (o && document.contains(o) && 'focus' in o) (o as HTMLElement).focus({ preventScroll: true });
	}
	function onDialogClosed() {
		openProject = null;
		restoreFocus();
	}
	function dialogService(svc: ServiceId) {
		opener = null;
		openProject = null;
		service = svc;
		view = 'index';
		tick().then(() => {
			window.scrollTo({ top: 0, behavior: 'auto' });
			explorer?.focusTitle();
		});
	}
	// "build something similar": swap the project dialog for the contact dialog,
	// prefilled; focus returns to the original opener when that one closes
	function similar(p: Project) {
		openProject = null;
		similarTo = p;
		contactOpen = true;
	}
	function contact(from: HTMLElement) {
		opener = from;
		similarTo = null;
		contactOpen = true;
	}
	function onContactClosed() {
		contactOpen = false;
		restoreFocus();
	}
</script>

<svelte:head>
	<title>adam, systems built around how your business works</title>
	<meta
		name="description"
		content="adam, ai / software engineer. custom software, connected tools and ai automation for businesses, with a project index you can open case by case."
	/>
	<link rel="canonical" href="https://portfolio.aquryu.space/" />
</svelte:head>

<svelte:window onhashchange={onHashChange} />

<div class="pf" class:dark style:--mark-url="url({markUrl})">
	<a class="skip" href="#main">skip to content</a>
	<PillNav {view} onview={setView} onjump={(s) => jumpTo(s)} oncontact={contact} />
	<div aria-live="polite" class="visually-hidden">{announcement}</div>

	<main id="main">
		{#if view === 'overview'}
			<section class="hero" aria-labelledby="hero-title">
				<div class="container">
					<div>
						<p class="eyebrow">ai / software engineer, taking new work</p>
						<h1 id="hero-title" tabindex="-1" bind:this={heroTitle}>
							<span class="visually-hidden">systems</span>
							<span class="line"><RotatingWord words={HEADLINE_WORDS} /></span>
							built around <span class="accent">how your business works.</span>
						</h1>
						<p class="lede">i build custom software, connect your tools, and use ai to automate complex workflows, from customer conversations to everyday operations.</p>
						<div class="actions">
							<button type="button" class="btn" onclick={(e) => contact(e.currentTarget)}>work with me</button>
							<button type="button" class="btn btn--secondary" onclick={() => setView('index')}>see the project index</button>
						</div>
						<p class="quiet">
							<span>jump to:</span>
							{#each SERVICES as s (s.id)}<button type="button" onclick={() => jumpToService(s.id)}>{s.short}</button>{/each}
						</p>
					</div>
					<div>
						<ChatDemo onopencase={(el) => open('aq_chatbot', el)} />
					</div>
				</div>
			</section>

			<section class="block hairline" id="services" aria-labelledby="services-title">
				<div class="container">
					<div class="services-head">
						<div>
							<p class="eyebrow">what i build</p>
							<h2 class="h-section" id="services-title">five services, each backed by projects you can open</h2>
						</div>
						<p class="lede">every row leads to the project index, where each project is a short case study: the problem, what the system does, and what you can see running.</p>
					</div>
					<div class="svc-rows">
						{#each SERVICES as s, i (s.id)}
							{@const ps = projectsOf(s.id, projects)}
							<div class="svc-row">
								<span class="num">0{i + 1}</span>
								<div class="svc-title">
									<h3><button type="button" onclick={() => jumpToService(s.id)}>{s.title}</button></h3>
									<p class="who">{s.who}</p>
								</div>
								<div class="svc-body">
									<p class="desc">{s.desc}</p>
									<p class="eg">for example: {ps.map((p) => p.title).join(', ')}</p>
								</div>
								<span class="count" aria-hidden="true">{ps.length} projects</span>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<section class="block" id="work" aria-labelledby="work-title">
				<div class="container">
					<p class="eyebrow">selected work</p>
					<h2 class="h-section" id="work-title">two sales processes, built end to end</h2>
					<p class="lede work-lede">two different businesses, two different chains: a guided booking flow with payment and invoicing, and an enquiry that becomes a proposal or a technician booking. each diagram follows the built system.</p>
					<div class="cases">
						{#each CASES as c (c.id)}
							<article class="case" aria-labelledby="case-{c.id}">
								<div class="case-text">
									<div class="case-lead">
										<span class="kind"><b>{c.kindLabel}</b> {c.kind}</span>
										<h3 id="case-{c.id}">{c.title}</h3>
										<button type="button" class="textlink" onclick={(e) => open(c.id, e.currentTarget)}>read the case study</button>
									</div>
									<dl>
										<div><dt>problem</dt><dd>{c.problem}</dd></div>
										<div><dt>solution</dt><dd>{c.solution}</dd></div>
										<div><dt>what you can see</dt><dd>{c.see}</dd></div>
									</dl>
								</div>
								<div class="shot">
									<WorkflowDiagram variant={c.flow} />
									<p class="shot-note">workflow diagram based on the project implementation</p>
								</div>
							</article>
						{/each}
					</div>
					<p class="more"><button type="button" class="btn btn--secondary" onclick={() => jumpToService('all')}>browse all fifteen projects</button></p>
				</div>
			</section>

			<section class="block about" id="about" aria-labelledby="about-title">
				<div class="container">
					<div class="about-me">
						<img class="portrait" src="/adam.jpg" alt="adam, portrait" width="160" height="160" loading="lazy" decoding="async" />
						<div>
							<p class="eyebrow">about</p>
							<h2 id="about-title">adam, ai / software engineer</h2>
							<div class="bio">
								<p>i build practical systems for businesses and for my own use: websites that bring in enquiries, assistants that qualify and sort, automations that finish the paperwork, and the odd sensor that reports to the web. i work across the whole stack, so there is no handoff between the person you talk to and the person who builds it.</p>
								<p>technical readers: every project in the index has a technical details section with the actual stack and the source where it is public.</p>
							</div>
							<dl class="facts">
								<div><dt>experience</dt><dd>silver ai automation, cleo, plus independent client work</dd></div>
								<div><dt>tools</dt><dd>python, typescript, react, sveltekit, django, fastapi, supabase, cloudflare, n8n, claude, groq, esp32</dd></div>
								<div><dt>links</dt><dd class="links"><a href={LINKS.github} target="_blank" rel="noopener">github</a><a href={LINKS.linkedin} target="_blank" rel="noopener">linkedin</a></dd></div>
							</dl>
						</div>
					</div>
					<div>
						<p class="eyebrow">how a project runs</p>
						<ol class="process">
							<li><span class="n">01</span><div><h3>a short call about the problem</h3><p>what slows you down, what you already use, what "done" looks like. no slides.</p></div></li>
							<li><span class="n">02</span><div><h3>a scoped proposal with a first milestone</h3><p>one page: what gets built, what it costs, what you will be able to see at the first checkpoint.</p></div></li>
							<li><span class="n">03</span><div><h3>build, demo, hand over</h3><p>you see it running before it goes live. you get the accounts, the source and a plain-language note on how to run it.</p></div></li>
						</ol>
					</div>
				</div>
			</section>

			<section class="block contact" id="contact" aria-labelledby="contact-title">
				<div class="container">
					<div class="panel">
						<div>
							<p class="eyebrow">contact</p>
							<h2 id="contact-title">tell me what slows your business down</h2>
							<p class="lede">a few sentences are enough. you will get a straight answer on whether it is a website, an assistant, an automation or something else, and what a first step would look like.</p>
							<div class="actions">
								<button type="button" class="btn" onclick={(e) => contact(e.currentTarget)}>send a message</button>
								<a class="btn btn--secondary" href={LINKS.mailto}>email directly</a>
							</div>
						</div>
						<div>
							<ul class="ways">
								<li><span class="k">email</span><a href="mailto:{LINKS.email}">{LINKS.email}</a></li>
								<li><span class="k">linkedin</span><a href={LINKS.linkedin} target="_blank" rel="noopener">adam-scott-gemenez</a></li>
								<li><span class="k">github</span><a href={LINKS.github} target="_blank" rel="noopener">adxoxo</a></li>
								<li><span class="k">availability</span><span>taking new work</span></li>
							</ul>
						</div>
					</div>
				</div>
			</section>
		{:else}
			<ProjectExplorer bind:this={explorer} {projects} {service} onservice={selectService} onopen={open} oncontact={contact} />
		{/if}
	</main>

	<footer class="site-footer">
		<div class="container">
			<a class="brand" href="#overview" onclick={(e) => { e.preventDefault(); setView('overview'); }}><span class="mark" aria-hidden="true"></span>adam</a>
			<ul>
				<li><button type="button" onclick={() => setView('overview')}>overview</button></li>
				<li><button type="button" onclick={() => setView('index')}>project index</button></li>
				<li><button type="button" onclick={() => jumpTo('about')}>about</button></li>
				<li><button type="button" onclick={() => jumpTo('contact')}>contact</button></li>
				<li><a href={LINKS.github} target="_blank" rel="noopener">github</a></li>
				<li><a href={LINKS.linkedin} target="_blank" rel="noopener">linkedin</a></li>
			</ul>
			<span class="right">adam, ai / software engineer</span>
		</div>
	</footer>

	{#if openProject}
		<ProjectDialog project={openProject} list={dialogList} onclose={onDialogClosed} onnav={(id) => (openProject = projectById(id, projects) ?? null)} onservice={dialogService} onsimilar={similar} />
	{/if}
	{#if contactOpen}
		<ContactDialog {similarTo} onclose={onContactClosed} />
	{/if}
</div>

<style>
	main { padding-top: var(--top-offset); }

	/* ---------- hero ---------- */
	.hero { padding: 40px 0 var(--section-gap); }
	.hero .container { display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(0, 1fr); gap: 56px; align-items: center; }
	.hero h1 { font-size: clamp(2.4rem, 4.6vw, 4rem); line-height: 1.04; letter-spacing: -0.025em; margin: 22px 0 24px; max-width: 13ch; }
	.hero h1:focus { outline: none; }
	.hero h1 .accent { color: var(--accent-deep); display: block; }
	/* the changing word has its own line and a green underline, the same box for every word */
	.hero h1 .line { display: block; }
	.hero h1 .line :global(.word) { box-shadow: inset 0 -0.09em 0 var(--accent); padding-bottom: 0.02em; }
	.hero .lede { margin-bottom: 30px; max-width: 46ch; }
	.hero .actions { display: flex; flex-wrap: wrap; gap: 12px; }
	.quiet { margin-top: 26px; font-size: 14px; color: var(--muted); display: flex; flex-wrap: wrap; gap: 6px 14px; }
	.quiet button { color: var(--accent-deep); font-weight: 500; text-decoration: underline; text-underline-offset: 3px; min-height: 32px; }
	.quiet button:hover { color: var(--accent); }
	@media (max-width: 960px) {
		.hero { padding-top: 16px; }
		.hero .container { grid-template-columns: minmax(0, 1fr); gap: 44px; }
		.hero h1 { max-width: 16ch; }
	}
	/* very narrow phones: the two hero buttons may wrap and take the full width instead of forcing a wider column */
	@media (max-width: 360px) {
		.hero .actions .btn, .more .btn { white-space: normal; width: 100%; padding: 12px 18px; text-align: center; }
	}

	/* ---------- services rows ---------- */
	.services-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px; align-items: end; margin-bottom: 40px; }
	@media (max-width: 760px) { .services-head { grid-template-columns: 1fr; gap: 16px; } }
	.svc-rows { border-top: 1px solid var(--border); }
	.svc-row { display: grid; grid-template-columns: 64px minmax(0, 1.1fr) minmax(0, 1.5fr) auto; gap: 24px; align-items: start; padding: 26px 0; border-bottom: 1px solid var(--border); position: relative; }
	.svc-row .num { font-family: var(--font-head); font-weight: 600; color: var(--accent); font-size: 15px; padding-top: 4px; }
	.svc-row h3 { font-size: 22px; }
	.svc-row h3 button { font: inherit; text-align: left; color: inherit; }
	.svc-row h3 button::before { content: ""; position: absolute; inset: 0; }
	.svc-row h3 button:hover { color: var(--accent-deep); }
	.svc-row h3 button:focus-visible { outline: none; }
	.svc-row:has(h3 button:focus-visible) { outline: 2px solid var(--accent-deep); outline-offset: 2px; }
	.svc-row .who { font-size: 14px; color: var(--muted); margin-top: 4px; }
	.svc-row .desc { font-size: 16px; }
	.svc-row .eg { font-size: 14px; color: var(--muted); margin-top: 6px; }
	.svc-row .count { font-size: 14px; font-weight: 500; color: var(--accent-deep); white-space: nowrap; padding-top: 6px; display: inline-flex; align-items: center; gap: 8px; }
	.svc-row .count::after { content: "\2192"; }
	.svc-row:hover { background: var(--surface); }
	@media (max-width: 760px) {
		.svc-row { grid-template-columns: 40px minmax(0, 1fr); gap: 8px 16px; padding: 22px 0; }
		.svc-row .svc-body, .svc-row .count { grid-column: 2; }
		.svc-row .count { padding-top: 0; }
	}

	/* ---------- case studies: text row, then the workflow at full width ---------- */
	.work-lede { margin-top: 18px; }
	.cases { display: grid; gap: 64px; margin-top: 48px; }
	.case { display: grid; gap: 28px; border-top: 1px solid var(--border); padding-top: 40px; }
	.case-text { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.6fr); gap: 20px 56px; align-items: start; }
	.case-lead { display: grid; justify-items: start; gap: 4px; }
	.case-text h3 { font-size: clamp(1.4rem, 2.2vw, 1.9rem); margin: 6px 0 10px; font-weight: 700; }
	.case-text dl { display: grid; gap: 12px; margin: 0; }
	.case-text dt { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; color: var(--accent); }
	.case-text dd { margin: 2px 0 0; font-size: 16px; }
	.shot { border: 1px solid var(--border); background: var(--surface); padding: 22px; display: grid; gap: 14px; }
	.shot-note { font-size: 12px; color: var(--muted); }
	.more { margin-top: 48px; }
	@media (max-width: 880px) {
		.case-text { grid-template-columns: 1fr; }
		.cases { gap: 48px; }
		.case { padding-top: 32px; gap: 22px; }
	}
	@media (max-width: 480px) { .shot { padding: 14px; } }

	/* ---------- about + process ---------- */
	.about { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
	.about .container { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 64px; }
	.about-me { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 32px; align-items: start; }
	.portrait { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; object-position: 50% 22%; border: 1px solid var(--border); box-shadow: 0 0 0 6px var(--bg); display: block; }
	.about h2 { font-size: clamp(1.6rem, 2.6vw, 2.1rem); margin-top: 14px; }
	.bio { margin-top: 18px; display: grid; gap: 14px; max-width: 54ch; }
	.links { display: flex; flex-wrap: wrap; gap: 8px 22px; }
	.links a { min-height: 44px; display: inline-flex; align-items: center; font-weight: 500; }
	.facts { display: grid; margin-top: 22px; border-top: 1px solid var(--border); max-width: 54ch; }
	.facts div { display: grid; grid-template-columns: 120px 1fr; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 15px; }
	.facts dt { color: var(--muted); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; padding-top: 4px; }
	.facts dd { margin: 0; }
	.process { display: grid; margin-top: 14px; }
	.process li { display: grid; grid-template-columns: 44px 1fr; gap: 16px; padding: 22px 0; border-bottom: 1px solid var(--border); }
	.process li:first-child { border-top: 1px solid var(--border); }
	.process .n { font-family: var(--font-head); font-weight: 600; color: var(--accent); }
	.process h3 { font-size: 18px; margin-bottom: 4px; }
	.process p { font-size: 15px; color: var(--muted); }
	@media (max-width: 880px) { .about .container { grid-template-columns: 1fr; gap: 40px; } }
	@media (max-width: 560px) { .about-me { grid-template-columns: 1fr; gap: 20px; } .portrait { width: 120px; height: 120px; } .facts div { grid-template-columns: 1fr; gap: 2px; } }

	/* ---------- contact ---------- */
	.contact .panel { border: 1px solid var(--border); display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
	.contact .panel > div { padding: 48px; }
	.contact .panel > div + div { border-left: 1px solid var(--border); background: var(--surface); }
	.contact h2 { font-size: clamp(1.8rem, 3vw, 2.6rem); margin-top: 14px; max-width: 14ch; }
	.contact .lede { margin-top: 18px; max-width: 44ch; }
	.contact .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
	.ways li { display: grid; grid-template-columns: 96px 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 15px; align-items: center; }
	.ways li:first-child { border-top: 1px solid var(--border); }
	.ways .k { color: var(--muted); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; }
	.ways a { font-weight: 500; min-height: 44px; display: inline-flex; align-items: center; overflow-wrap: anywhere; }
	@media (max-width: 880px) { .contact .panel { grid-template-columns: 1fr; } .contact .panel > div { padding: 32px 24px; } .contact .panel > div + div { border-left: 0; border-top: 1px solid var(--border); } }

	/* ---------- footer ---------- */
	.site-footer { border-top: 1px solid var(--border); padding: 36px 0; font-size: 14px; color: var(--muted); }
	.site-footer .container { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 32px; }
	.site-footer .brand { font-size: 18px; }
	.site-footer ul { display: flex; flex-wrap: wrap; gap: 4px 22px; }
	.site-footer a, .site-footer button { color: var(--muted); text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; font-weight: 500; }
	.site-footer a:hover, .site-footer button:hover { color: var(--accent-deep); }
	.site-footer .right { margin-left: auto; }
</style>
