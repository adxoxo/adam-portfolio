<script lang="ts">
	import type { PageData } from './$types';
	import { view, setR, beginReveal, animateTo } from '$lib/state/app.svelte';
	import { featured, archived, CLUSTER_LABEL } from '$lib/data/projects';
	import SystemMap from '$lib/components/SystemMap.svelte';
	import ProjectPanel from '$lib/components/ProjectPanel.svelte';
	import LoomEmbed from '$lib/components/LoomEmbed.svelte';

	let { data }: { data: PageData } = $props();
	const feats = $derived(featured(data.projects));
	const arch = $derived(archived(data.projects));

	// reveal-swipe control -------------------------------------------------
	let slider = $state<HTMLDivElement>();
	let knob = $state<HTMLDivElement>();
	let dragging = false;
	let moved = false;
	let downX = 0;

	function onDown(e: PointerEvent) {
		e.preventDefault();
		knob?.setPointerCapture(e.pointerId);
		dragging = true;
		moved = false;
		downX = e.clientX;
		beginReveal();
	}
	function onMove(e: PointerEvent) {
		if (!dragging || !slider || !knob) return;
		if (Math.abs(e.clientX - downX) > 3) moved = true;
		const rect = slider.getBoundingClientRect();
		const usable = rect.width - knob.offsetWidth;
		setR((e.clientX - rect.left - knob.offsetWidth / 2) / usable);
	}
	function onUp(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		try {
			knob?.releasePointerCapture(e.pointerId);
		} catch {
			/* ignore */
		}
		if (!moved) animateTo(view.r < 0.5 ? 1 : 0); // tap toggles
		else animateTo(view.r >= 0.5 ? 1 : 0); // drag snaps to the nearer end
	}
	function onKey(e: KeyboardEvent) {
		if (['ArrowRight', 'ArrowUp', 'End'].includes(e.key)) {
			e.preventDefault();
			animateTo(1);
		} else if (['ArrowLeft', 'ArrowDown', 'Home'].includes(e.key)) {
			e.preventDefault();
			animateTo(0);
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			animateTo(view.r >= 0.5 ? 0 : 1);
		}
	}

	// lock page scroll while the map is up
	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = view.mode === 'map' ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	// contact form -> /api/lead --------------------------------------------
	let sending = $state(false);
	let sent = $state(false);
	let sendError = $state('');

	async function submitLead(e: SubmitEvent) {
		e.preventDefault();
		const formEl = e.currentTarget as HTMLFormElement;
		const fd = new FormData(formEl);
		sending = true;
		sendError = '';
		try {
			const res = await fetch('/api/lead', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name: fd.get('name'),
					email: fd.get('email'),
					message: fd.get('message')
				})
			});
			const j = await res.json();
			if (j.ok) {
				sent = true;
				formEl.reset();
			} else {
				sendError = j.error === 'rate_limited' ? 'too many messages, try again later.' : 'check the fields and try again.';
			}
		} catch {
			sendError = 'could not send, try again.';
		} finally {
			sending = false;
		}
	}
</script>

<svelte:head>
	<title>adam, systems that make things lighter</title>
	<meta
		name="description"
		content="adam, ai engineer and full-stack developer. i build systems that make things lighter."
	/>
</svelte:head>

<div class="app" class:map={view.mode === 'map'} class:revealing={view.revealing} style:--r={view.r}>
	<!-- nav -->
	<nav class="nav" aria-label="primary">
		<div class="nav-inner">
			<div class="brand-group">
				<a class="brand" href="#top">adam</a>
				<span class="avail"
					><span class="dot" aria-hidden="true"></span><span class="mono">available for new work</span
					></span
				>
			</div>
			<div class="reveal-wrap" title="drag or tap to switch between site and map">
				<span class="end label" class:on={view.r < 0.5}>site</span>
				<div class="mode-slider" bind:this={slider}>
					<div class="fill" aria-hidden="true"></div>
					<div
						class="mode-knob"
						bind:this={knob}
						role="slider"
						tabindex="0"
						aria-label="switch between site and map"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={Math.round(view.r * 100)}
						onpointerdown={onDown}
						onpointermove={onMove}
						onpointerup={onUp}
						onpointercancel={onUp}
						onkeydown={onKey}
					>
						<span aria-hidden="true"></span><span aria-hidden="true"></span>
					</div>
				</div>
				<span class="end label" class:on={view.r >= 0.5}>map</span>
			</div>
			<div class="nav-right">
				<a class="nav-link label" href="https://github.com/adxoxo" target="_blank" rel="noopener"
					>github</a
				>
			</div>
		</div>
	</nav>

	<!-- site view -->
	<div class="site-view" id="top">
		<header class="hero">
			<div class="wrap">
				<div class="hero-grid">
					<div><h1>systems that make things lighter</h1></div>
					<div class="hero-side">
						<p>
							i build systems. ai, full-stack, embedded, whatever the problem needs. i do it
							because i love it, and the good ones make life lighter, not just work.
						</p>
						<div class="cta-row">
							<a class="btn" href="#contact">work with me</a>
							<a class="btn btn--ghost" href="#work">see the work</a>
						</div>
					</div>
				</div>
			</div>
		</header>

		<section class="section" id="work">
			<div class="wrap">
				<div class="sec-head">
					<span class="label">selected work</span>
					<span class="mono" style="color:var(--ink-soft)">four systems, one way of thinking</span>
				</div>
				<div class="featured-list">
					{#each feats as p, i}
						<article class="fcard" class:flip={i % 2 === 1}>
							<div class="fcard-figure">
								{#if p.loom}
									<LoomEmbed id={p.loom} title={p.title} />
								{:else}
									<div class="schematic">
										{#each p.schematic as step, j}
											<span class="node-chip {j === p.schematic.length - 1 ? 'accent' : ''}">{step}</span>
											{#if j < p.schematic.length - 1}<span class="arrow">-&gt;</span>{/if}
										{/each}
									</div>
									<span class="fig-cap mono">fig. {p.title} architecture</span>
								{/if}
							</div>
							<div class="fcard-body">
								<div class="fbody-top">
									<div class="chips">
										<span class="chip mono">{CLUSTER_LABEL[p.cluster]}</span>
										<span class="chip mono">{p.year}</span>
									</div>
									<h3>{p.title}</h3>
									<p>{p.summary}</p>
									<div class="stack-line">
										{#each p.stack as s}<span class="chip mono">{s}</span>{/each}
									</div>
								</div>
								<div class="outcome">
									<h4 class="mono">outcome</h4>
									<p>{p.outcomes[0]}</p>
									{#if p.live || p.github}
										<div class="card-links">
											{#if p.live}
												<a class="repo-link" href={p.live} target="_blank" rel="noopener"
													>visit site &#8599;</a
												>
											{/if}
											{#if p.github}
												<a class="repo-link" href={p.github} target="_blank" rel="noopener"
													>view repository &#8599;</a
												>
											{/if}
										</div>
									{/if}
								</div>
							</div>
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section class="section">
			<div class="wrap archive-grid">
				<div>
					<h2>archive</h2>
					<p class="archive-note">
						pulled from github once, then cached. the site reads the cache, not github.
					</p>
				</div>
				<div class="archive-list">
					{#each arch as p}
						<div class="arow">
							<div class="arow-title">
								<span class="sq" aria-hidden="true"></span><span>{p.title}</span>
							</div>
							<div class="arow-meta">
								<span class="mono">{p.stack.join(', ')}</span><span class="mono">{p.year}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="section" id="contact">
			<div class="wrap contact-grid">
				<div class="contact-copy">
					<h2>let's talk</h2>
					<p>
						tell me what you are building and where it feels heavy. if we are on the same wavelength,
						i will show you what the lighter version looks like.
					</p>
				</div>
				<form class="form" onsubmit={submitLead}>
					<div class="field">
						<label for="c-name">name</label>
						<input id="c-name" name="name" type="text" placeholder="your name" autocomplete="name" required />
					</div>
					<div class="field">
						<label for="c-email">email</label>
						<input id="c-email" name="email" type="email" placeholder="you@company.com" autocomplete="email" required />
					</div>
					<div class="field">
						<label for="c-msg">message</label>
						<textarea id="c-msg" name="message" rows="4" placeholder="what you are working on" required></textarea>
					</div>
					<button class="btn" type="submit" style="align-self:flex-start" disabled={sending}>
						{sending ? 'sending' : sent ? 'sent' : 'send'}
					</button>
					{#if sent}<p class="mono" style="color:var(--accent)">thanks, i will get back to you.</p>{/if}
					{#if sendError}<p class="mono" style="color:var(--ink-soft)">{sendError}</p>{/if}
				</form>
			</div>
		</section>

		<footer class="footer">
			<div class="wrap footer-inner">
				<div class="brand">adam</div>
				<div class="socials">
					<a href="https://github.com/adxoxo" target="_blank" rel="noopener">github</a>
					<a href="https://www.threads.net/@ad_yuuu" target="_blank" rel="noopener">threads</a>
					<a href="mailto:adamgemenez@gmail.com">email</a>
				</div>
				<span class="mono" style="color:var(--ink-soft)">davao city, working with foreign clients</span>
			</div>
		</footer>
	</div>

	<SystemMap projects={data.projects} />
	<ProjectPanel />
</div>
