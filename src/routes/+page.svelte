<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { pushState, replaceState } from '$app/navigation';
	import type { PageData } from './$types';
	import '$lib/portfolio/styles.css';
	import PillNav from '$lib/portfolio/PillNav.svelte';
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
	// how the index shows its projects: rows or the map. 'auto' follows the
	// viewport (rows on phones and tablets, the map above 960px); 'list' and
	// 'map' are an explicit choice, kept across service changes and resizes
	type Presentation = 'auto' | 'list' | 'map';

	let view = $state<View>('overview');
	let service = $state<ServiceId | 'all'>('all');
	let presentation = $state<Presentation>('auto');
	const narrowIndex = new MediaQuery('max-width: 960px');
	const shown = $derived<'list' | 'map'>(presentation === 'auto' ? (narrowIndex.current ? 'list' : 'map') : presentation);
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

	/* ---------- hash routing: #overview, #work, #process, #about, #contact, #index/<service>[/list|/map] ----------
	   The server always renders the light overview (the hash never reaches it);
	   the browser reads the hash once after hydration and from then on the url
	   follows the view. A bare #index, an unknown service and the previous
	   site's #top / #work anchors still work. Every visitor navigation (view,
	   service, presentation) pushes one history entry; replaceState is only
	   used to canonicalise an invalid or legacy hash, so Back and Forward walk
	   the states the visitor actually saw. The hashchange handler reads the
	   url into the state; nothing writes the url from an effect, so a popstate
	   can never be overwritten with stale state. */
	let routed = false; // true once the browser has read the initial hash
	function readHash() {
		const h = location.hash.replace(/^#/, '');
		if (h.startsWith('index')) {
			const [, svc = 'all', pres = ''] = h.split('/');
			service = svc === 'all' || isServiceId(svc) ? (svc as ServiceId | 'all') : 'all';
			presentation = pres === 'list' || pres === 'map' ? pres : 'auto';
			view = 'index';
			return null;
		}
		view = 'overview';
		return h && h !== 'overview' && h !== 'top' ? h : null;
	}
	function indexHash() {
		return `index/${service}` + (presentation === 'auto' ? '' : `/${presentation}`);
	}
	// write the url for the current state: push for a visitor navigation,
	// replace for canonicalisation. Nothing is written when the url already
	// says the same, so a repeated selection adds no entry. A push before the
	// initial read is skipped: the mount writes the canonical hash right after.
	function writeHash(push: boolean) {
		if (push && !routed) return;
		const cur = location.hash.replace(/^#/, '');
		let next: string | null = null;
		if (view === 'index') next = indexHash();
		// back on the overview: only a stale index hash is replaced, a section
		// anchor such as #about or #work is left alone
		else if (cur.startsWith('index')) next = 'overview';
		if (next === null || next === cur) return;
		if (push) pushState('#' + next, {});
		else replaceState('#' + next, {});
	}
	function onHashChange() {
		const scroll = readHash();
		if (view === 'index') writeHash(false); // canonicalise a bare #index or an unknown service, no new entry
		if (scroll) jumpTo(scroll);
	}
	// initial route, once the page is in the browser. SvelteKit's router finishes
	// initialising right after hydration, so the canonical hash (a bare #index
	// rewritten) is written on the next task, and only from then on does the
	// url follow the view.
	onMount(() => {
		const scroll = readHash();
		const t = setTimeout(() => {
			writeHash(false);
			routed = true;
		}, 0);
		if (scroll) tick().then(() => jumpTo(scroll, true));
		return () => clearTimeout(t);
	});

	async function setView(v: View) {
		view = v;
		writeHash(true);
		await tick();
		window.scrollTo({ top: 0, behavior: 'auto' });
		if (v === 'index') explorer?.focusTitle();
		else heroTitle?.focus({ preventScroll: true });
		announce(v === 'index' ? 'project index' : 'overview');
	}
	async function jumpTo(id: string, instant = false) {
		if (view !== 'overview') {
			view = 'overview';
			writeHash(true);
		}
		await tick();
		const el = document.getElementById(id);
		if (!el) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: reduced || instant ? 'auto' : 'smooth', block: 'start' });
	}
	function selectService(svc: ServiceId | 'all') {
		service = svc;
		writeHash(true);
		const n = svc === 'all' ? projects.length : projectsOf(svc, projects).length;
		announce(`${svc === 'all' ? 'all services' : SERVICES.find((s) => s.id === svc)!.title}, ${n} projects`);
	}
	// list or map, chosen by the visitor: kept until the url says otherwise.
	// Choosing what is already shown changes nothing and adds no entry.
	function selectPresentation(p: 'list' | 'map') {
		if (p === shown) return;
		presentation = p;
		writeHash(true);
		announce(p === 'list' ? 'projects as a list' : 'projects on the map');
	}
	// from the overview: jump straight into one service (or all of them) in the index
	async function jumpToService(svc: ServiceId | 'all') {
		service = svc;
		await setView('index');
	}
	// the in-page links to the index are real anchors (#index/all works as a
	// url); with the page running, the handler opens the index in place
	function toIndex(e: MouseEvent) {
		e.preventDefault();
		jumpToService('all');
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
		writeHash(true);
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
					</div>
					<div class="hero-side">
						<p class="lede">tell me what your business needs. i will find the simplest practical way to build it.</p>
						<div class="actions">
							<button type="button" class="btn" onclick={(e) => contact(e.currentTarget)}>tell me what you need</button>
							<button type="button" class="btn btn--secondary" onclick={() => setView('index')}>see the project index</button>
						</div>
						<p class="quiet">websites, ai assistants, automations, custom apps and connected devices. all fifteen projects are in the index, each as a short case study.</p>
					</div>
				</div>
			</section>

			<section class="block hairline" id="work" aria-labelledby="work-title">
				<div class="container">
					<p class="eyebrow">selected work</p>
					<h2 class="h-section" id="work-title">two sales processes, built end to end</h2>
					<p class="lede work-lede">two different businesses, two different chains: a guided booking flow with payment and invoicing, and an enquiry that becomes a proposal or a technician booking. each diagram follows the built system.</p>
					<div class="cases">
						{#each CASES as c (c.id)}
							<article class="case" aria-labelledby="case-{c.id}">
								<div class="case-text">
									<div class="case-lead">
										<span class="kind">{c.kind}</span>
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
					<div class="more">
						<button type="button" class="btn btn--secondary" onclick={() => jumpToService('all')}>browse all fifteen projects</button>
						<p class="note">the project index is the full portfolio: five services, fifteen projects, each one a short case study.</p>
					</div>
				</div>
			</section>

			<section class="block hairline" id="process" aria-labelledby="process-title">
				<div class="container">
					<p class="eyebrow">process</p>
					<h2 class="h-section" id="process-title">how a project runs</h2>
					<ol class="process">
						<li><span class="n">01</span><div><h3>a short call about the problem</h3><p>what slows you down, what you already use, what "done" looks like. no slides.</p></div></li>
						<li><span class="n">02</span><div><h3>a scoped proposal with a first milestone</h3><p>one page: what gets built, what it costs, what you will be able to see at the first checkpoint.</p></div></li>
						<li><span class="n">03</span><div><h3>build, demo, hand over</h3><p>you see it running before it goes live. you get the accounts, the source and a plain-language note on how to run it.</p></div></li>
					</ol>
				</div>
			</section>

			<section class="block about" id="about" aria-labelledby="about-title">
				<div class="container">
					<div>
						<p class="eyebrow">about</p>
						<h2 id="about-title">adam, ai / software engineer</h2>
						<div class="bio">
							<p>i build practical systems for businesses and for my own use: websites that bring in enquiries, assistants that qualify and sort, automations that finish the paperwork, and the odd sensor that reports to the web. i work across the whole stack, so there is no handoff between the person you talk to and the person who builds it.</p>
							<p>technical readers: every project in the index has a technical details section with the actual stack and the source where it is public.</p>
						</div>
					</div>
					<dl class="facts">
						<div><dt>tools</dt><dd>python, typescript, react, sveltekit, django, fastapi, supabase, cloudflare, n8n, claude, groq, esp32</dd></div>
						<div><dt>portfolio</dt><dd><a href="#index/all" onclick={toIndex}>the project index, all fifteen projects</a></dd></div>
						<div><dt>links</dt><dd class="links"><a href={LINKS.github} target="_blank" rel="noopener">github</a><a href={LINKS.linkedin} target="_blank" rel="noopener">linkedin</a></dd></div>
					</dl>
				</div>
			</section>

			<section class="block contact" id="contact" aria-labelledby="contact-title">
				<div class="container">
					<div class="panel">
						<div>
							<p class="eyebrow">enquiry</p>
							<h2 id="contact-title">tell me what slows your business down</h2>
							<p class="lede">a 30 minute call is enough. you will get a straight answer on whether it is a website, an assistant, an automation or something else, and what a first step would look like.</p>
							<div class="actions">
								<button type="button" class="btn" onclick={(e) => contact(e.currentTarget)}>book a call</button>
								<a class="btn btn--secondary" href={LINKS.mailto}>email directly</a>
							</div>
						</div>
						<div>
							<ul class="ways">
								<li><span class="k">email</span><a href="mailto:{LINKS.email}">{LINKS.email}</a></li>
								<li><span class="k">linkedin</span><a href={LINKS.linkedin} target="_blank" rel="noopener">adam-scott-gemenez</a></li>
								<li><span class="k">github</span><a href={LINKS.github} target="_blank" rel="noopener">adxoxo</a></li>
								<li><span class="k">portfolio</span><a href="#index/all" onclick={toIndex}>the project index</a></li>
								<li><span class="k">availability</span><span>taking new work</span></li>
							</ul>
						</div>
					</div>
				</div>
			</section>
		{:else}
			<ProjectExplorer bind:this={explorer} {projects} {service} presentation={shown} onservice={selectService} onpresentation={selectPresentation} onopen={open} oncontact={contact} />
		{/if}
	</main>

	<footer class="site-footer">
		<div class="container">
			<a class="brand" href="#overview" onclick={(e) => { e.preventDefault(); setView('overview'); }}><span class="mark" aria-hidden="true"></span>adam</a>
			<ul>
				<li><button type="button" onclick={() => setView('overview')}>overview</button></li>
				<li><button type="button" onclick={() => jumpTo('work')}>work</button></li>
				<li><button type="button" onclick={() => jumpTo('process')}>process</button></li>
				<li><button type="button" onclick={() => jumpTo('about')}>about</button></li>
				<li><button type="button" onclick={() => jumpTo('contact')}>contact</button></li>
				<li><button type="button" onclick={() => setView('index')}>project index</button></li>
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

	/* ---------- hero: the headline, and beside it the lede with the two actions ---------- */
	.hero { padding: 40px 0 var(--section-gap); }
	.hero .container { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr); gap: 56px; align-items: end; }
	.hero h1 { font-size: clamp(2.4rem, 4.6vw, 4rem); line-height: 1.04; letter-spacing: -0.025em; margin: 18px 0 0; max-width: 13ch; }
	.hero h1:focus { outline: none; }
	.hero h1 .accent { color: var(--accent-deep); display: block; }
	/* the changing word has its own line and a green underline, the same box for every word */
	.hero h1 .line { display: block; }
	.hero h1 .line :global(.word) { box-shadow: inset 0 -0.09em 0 var(--accent); padding-bottom: 0.02em; }
	.hero-side { display: grid; gap: 20px; align-content: start; padding-bottom: 6px; }
	.hero .lede { max-width: 46ch; }
	.hero .actions { display: flex; flex-wrap: wrap; gap: 12px; }
	.quiet { font-size: 15px; color: var(--muted); max-width: 46ch; }
	@media (max-width: 900px) {
		.hero { padding-top: 16px; }
		.hero .container { grid-template-columns: minmax(0, 1fr); gap: 28px; }
		.hero h1 { max-width: 16ch; }
		.hero-side { padding-bottom: 0; }
	}
	/* phones: a tighter headline and lede so the first action is on the first
	   screen (320x700), and stacked full-width actions */
	@media (max-width: 640px) {
		.hero { padding-top: 8px; }
		.hero h1 { font-size: clamp(2rem, 8.5vw, 2.6rem); margin-top: 14px; }
		.hero .lede { font-size: 18px; line-height: 1.55; }
		.hero .actions { flex-direction: column; align-items: stretch; }
		.hero .actions .btn, .more .btn { white-space: normal; width: 100%; padding: 12px 18px; text-align: center; }
	}

	/* ---------- case studies: text row, then the workflow at full width ---------- */
	.work-lede { margin-top: 18px; }
	.cases { display: grid; gap: 64px; margin-top: 48px; }
	.case { display: grid; gap: 28px; border-top: 1px solid var(--border); padding-top: 40px; }
	.case-text { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.6fr); gap: 20px 56px; align-items: start; }
	.case-lead { display: grid; justify-items: start; gap: 4px; }
	.case-lead .kind { color: var(--accent-deep); }
	.case-text h3 { font-size: clamp(1.4rem, 2.2vw, 1.9rem); margin: 6px 0 10px; font-weight: 700; }
	.case-text dl { display: grid; gap: 12px; margin: 0; }
	.case-text dt { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; color: var(--accent); }
	.case-text dd { margin: 2px 0 0; font-size: 16px; }
	.shot { border: 1px solid var(--border); background: var(--surface); padding: 22px; display: grid; gap: 14px; }
	.shot-note { font-size: 12px; color: var(--muted); }
	/* the way into the full index, with one line on what it is */
	.more { margin-top: 48px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; }
	.more .note { font-size: 14px; line-height: 1.55; color: var(--muted); max-width: 52ch; }
	@media (max-width: 880px) {
		.case-text { grid-template-columns: 1fr; }
		.cases { gap: 48px; }
		.case { padding-top: 32px; gap: 22px; }
	}
	@media (max-width: 640px) { .case-text dt { font-size: 12px; } .shot-note { font-size: 13px; } .more { margin-top: 40px; display: grid; gap: 12px; } }
	@media (max-width: 480px) { .shot { padding: 14px; } }

	/* ---------- process: three steps in one row, one below the other on a narrow screen ---------- */
	.process { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 32px; margin-top: 40px; border-top: 1px solid var(--border); }
	.process li { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 16px; padding: 28px 0; border-bottom: 1px solid var(--border); }
	.process .n { font-family: var(--font-head); font-weight: 600; color: var(--accent); }
	.process h3 { font-size: 18px; margin-bottom: 4px; }
	.process p { font-size: 16px; }
	@media (max-width: 880px) {
		.process { grid-template-columns: 1fr; gap: 0; margin-top: 24px; }
		.process li { padding: 22px 0; }
	}

	/* ---------- about: the bio, and beside it the facts ---------- */
	.about { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
	.about .container { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 64px; align-items: start; }
	.about h2 { font-size: clamp(1.6rem, 2.6vw, 2.1rem); margin-top: 14px; }
	.bio { margin-top: 18px; display: grid; gap: 14px; max-width: 54ch; }
	.links { display: flex; flex-wrap: wrap; gap: 8px 22px; }
	.facts { display: grid; margin-top: 44px; border-top: 1px solid var(--border); }
	.facts div { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 16px; }
	.facts dt { color: var(--muted); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; padding-top: 4px; }
	.facts dd { margin: 0; }
	.facts a { min-height: 44px; display: inline-flex; align-items: center; font-weight: 500; }
	@media (max-width: 880px) { .about .container { grid-template-columns: 1fr; gap: 32px; } .facts { margin-top: 0; } }
	@media (max-width: 560px) { .facts div { grid-template-columns: 1fr; gap: 2px; } .facts dt { padding-top: 0; } }

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
	/* phones: the 96px label column would squeeze the email address, so label and value stack; the actions take the full width */
	@media (max-width: 640px) {
		.contact .panel > div { padding: 28px 18px; }
		.contact .actions { flex-direction: column; align-items: stretch; }
		.contact .actions .btn { white-space: normal; text-align: center; }
		.ways li { grid-template-columns: minmax(0, 1fr); gap: 0; font-size: 16px; }
		.ways a { min-height: 44px; }
	}

	/* ---------- footer ---------- */
	.site-footer { border-top: 1px solid var(--border); padding: 36px 0; font-size: 14px; color: var(--muted); }
	.site-footer .container { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 32px; }
	.site-footer .brand { font-size: 18px; }
	.site-footer ul { display: flex; flex-wrap: wrap; gap: 4px 22px; }
	.site-footer a, .site-footer button { color: var(--muted); text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; font-weight: 500; }
	.site-footer a:hover, .site-footer button:hover { color: var(--accent-deep); }
	.site-footer .right { margin-left: auto; }
	/* phones: the short footer words ("about") still get a 44px wide target */
	@media (max-width: 640px) { .site-footer a, .site-footer button { min-width: 44px; justify-content: center; } }
</style>
