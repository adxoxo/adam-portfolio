<script lang="ts">
	import type { PageData } from './$types';
	import { view, detail, contact, setR, beginReveal, animateTo, openContact } from '$lib/state/app.svelte';
	import HeroCanvas from '$lib/components/HeroCanvas.svelte';
	import Socials from '$lib/components/Socials.svelte';
	import Services from '$lib/components/Services.svelte';
	import Featured from '$lib/components/Featured.svelte';
	import Archive from '$lib/components/Archive.svelte';
	import SystemMap from '$lib/components/SystemMap.svelte';
	import ProjectDetail from '$lib/components/ProjectDetail.svelte';
	import ContactModal from '$lib/components/ContactModal.svelte';

	let { data }: { data: PageData } = $props();

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
		setR((e.clientX - rect.left - knob.offsetWidth / 2) / (rect.width - knob.offsetWidth));
	}
	function onUp(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		try {
			knob?.releasePointerCapture(e.pointerId);
		} catch {
			/* ignore */
		}
		if (!moved) animateTo(view.r < 0.5 ? 1 : 0);
		else animateTo(view.r >= 0.5 ? 1 : 0);
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

	const wipe = $derived(((1 - view.r) * 100).toFixed(2) + '%');

	// lock page scroll while the map, a project detail, or the contact modal is up
	$effect(() => {
		if (typeof document === 'undefined') return;
		const lock = view.mode === 'map' || !!detail.project || contact.open;
		document.body.style.overflow = lock ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:head>
	<title>adam, systems that make things lighter</title>
	<meta
		name="description"
		content="adam, ai engineer and full-stack developer. i build systems that make things lighter."
	/>
</svelte:head>

<div class="app" class:map={view.mode === 'map'} class:revealing={view.revealing} style:--r={view.r} style:--wipe={wipe}>
	<nav class="pill">
		<a class="brand" href="#top">adam</a>
		<div class="divider"></div>
		<div class="reveal" title="drag or tap to switch site and map">
			<button class="end" class:on={view.r < 0.5} onclick={() => animateTo(0)}>site</button>
			<div class="slider" bind:this={slider}>
				<div class="fill"></div>
				<div
					class="knob"
					bind:this={knob}
					role="slider"
					tabindex="0"
					aria-label="switch site and map"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.round(view.r * 100)}
					onpointerdown={onDown}
					onpointermove={onMove}
					onpointerup={onUp}
					onpointercancel={onUp}
					onkeydown={onKey}
				>
					<span></span><span></span>
				</div>
			</div>
			<button class="end" class:on={view.r >= 0.5} onclick={() => animateTo(1)}>map</button>
		</div>
		<div class="divider"></div>
		<button class="pill-cta" onclick={openContact}>work with me</button>
	</nav>

	<div class="site-view" id="top">
		<header class="hero">
			<HeroCanvas />
			<div class="wrap">
				<div class="hero-grid">
					<div>
						<span class="avail"><span class="dot"></span><span class="mono">available for new work</span></span>
						<h1>systems that make things lighter</h1>
					</div>
					<div class="hero-side">
						<p class="sub">
							i build systems. ai, full-stack, embedded, whatever the problem needs. i do it because
							i love it, and the good ones make life lighter, not just work.
						</p>
						<div class="cta-row">
							<button class="btn" onclick={openContact}>work with me</button>
							<a class="btn btn--ghost" href="#work">see adam's work</a>
						</div>
						<Socials />
					</div>
				</div>
			</div>
		</header>

		<Services />

		<section class="section" id="work">
			<div class="wrap">
				<div class="sec-head">
					<span class="label">selected work</span>
					<span class="mono" style="color:var(--ink-soft)">tap any to open it</span>
				</div>
				<Featured projects={data.projects} />
			</div>
		</section>

		<section class="section">
			<div class="wrap">
				<div class="sec-head">
					<h2>archive</h2>
					<span class="mono" style="color:var(--ink-soft)">newest first, click to open the repo</span>
				</div>
			</div>
			<Archive projects={data.projects} />
		</section>

		<footer class="footer">
			<div class="wrap in">
				<Socials />
			</div>
		</footer>
	</div>

	<SystemMap projects={data.projects} />
	<ProjectDetail />
	<ContactModal />
</div>
