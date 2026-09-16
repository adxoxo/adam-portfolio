<script lang="ts">
	type View = 'overview' | 'index';
	let {
		view,
		onview,
		onjump,
		oncontact
	}: {
		view: View;
		onview: (v: View) => void;
		onjump: (section: 'about' | 'contact') => void;
		oncontact: (opener: HTMLElement) => void;
	} = $props();

	let menuOpen = $state(false);
	let menuBtn = $state<HTMLButtonElement>();
	let nav = $state<HTMLElement>();

	function closeMenu() {
		menuOpen = false;
	}
	function pick(fn: () => void) {
		closeMenu();
		fn();
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) {
			closeMenu();
			menuBtn?.focus();
		}
	}
	function onDocClick(e: MouseEvent) {
		// composedPath is captured at dispatch, so it still holds the nav when the
		// clicked icon was swapped out of the DOM by the toggle itself
		if (menuOpen && nav && !e.composedPath().includes(nav)) closeMenu();
	}
</script>

<svelte:window onkeydown={onKeydown} onclick={onDocClick} />

<nav class="pill" aria-label="site" bind:this={nav}>
	<a class="brand" href="#overview" aria-label="adam, home" onclick={(e) => { e.preventDefault(); pick(() => onview('overview')); }}>
		<img class="pic" src="/adam.jpg" alt="" width="32" height="32" decoding="async" />
		<span class="mark" aria-hidden="true"></span>
		<span class="word">adam</span>
	</a>
	<span class="divider" aria-hidden="true"></span>
	<div class="switch" role="group" aria-label="site view">
		<button type="button" aria-pressed={view === 'overview'} onclick={() => pick(() => onview('overview'))}>overview</button>
		<button type="button" aria-pressed={view === 'index'} onclick={() => pick(() => onview('index'))}>
			<span class="long">project index</span><span class="short">index</span>
		</button>
	</div>
	<span class="divider wide" aria-hidden="true"></span>
	<div class="links">
		<a href="#about" onclick={(e) => { e.preventDefault(); pick(() => onjump('about')); }}>about</a>
		<a href="#contact" onclick={(e) => { e.preventDefault(); pick(() => onjump('contact')); }}>contact</a>
	</div>
	<button type="button" class="cta" onclick={(e) => pick(() => oncontact(e.currentTarget))}>work with me</button>
	<button
		type="button"
		class="menu-btn"
		bind:this={menuBtn}
		aria-expanded={menuOpen}
		aria-controls="pill-menu"
		aria-label="menu"
		onclick={() => (menuOpen = !menuOpen)}
	>
		{#if menuOpen}
			<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" /></svg>
		{:else}
			<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 5h16M2 10h16M2 15h16" /></svg>
		{/if}
	</button>
	{#if menuOpen}
		<div class="menu" id="pill-menu">
			<button type="button" onclick={() => pick(() => onjump('about'))}>about</button>
			<button type="button" onclick={() => pick(() => onjump('contact'))}>contact</button>
			<button type="button" class="btn" onclick={(e) => pick(() => oncontact(e.currentTarget))}>work with me</button>
		</div>
	{/if}
</nav>

<style>
	.pill {
		position: fixed; top: calc(14px + var(--safe-top)); left: 50%; transform: translateX(-50%); z-index: 70;
		display: flex; align-items: center; gap: 10px;
		max-width: calc(100vw - 24px);
		background: var(--pill-bg); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
		border: 1px solid var(--border); border-radius: 999px; padding: 5px 6px 5px 6px;
		box-shadow: 0 10px 30px -14px var(--shadow), 0 1px 0 var(--surface-2) inset;
		transition: background-color 0.35s ease, border-color 0.35s ease;
	}
	.brand { gap: 8px; font-size: 18px; padding: 0 8px 0 2px; border-radius: 999px; }
	.pic { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; object-position: 50% 22%; border: 1px solid var(--border); display: block; flex: none; }
	.brand .mark { width: 12px; }
	.divider { width: 1px; height: 22px; background: var(--border); flex: none; }
	.switch { display: inline-flex; background: var(--surface); box-shadow: inset 0 0 0 1px var(--border); border-radius: 999px; }
	.switch button { min-height: 44px; padding: 0 14px; border-radius: 999px; font-size: 13px; font-weight: 500; color: var(--muted); white-space: nowrap; transition: background-color 0.15s ease, color 0.15s ease; }
	.switch button:hover { color: var(--text); }
	.switch button[aria-pressed="true"] { background: var(--accent-deep); color: var(--on-accent); }
	.switch button:focus-visible { outline-offset: -2px; }
	.switch .short { display: none; }
	.links { display: flex; gap: 2px; }
	.links a { color: var(--text); text-decoration: none; font-weight: 500; font-size: 14px; min-height: 44px; padding: 0 10px; display: inline-flex; align-items: center; border-radius: 999px; }
	.links a:hover { color: var(--accent-deep); background: var(--surface); }
	.cta { min-height: 44px; padding: 0 20px; border-radius: 999px; background: var(--accent-deep); color: var(--on-accent); font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; flex: none; transition: opacity 0.2s ease; }
	.cta:hover { opacity: 0.85; }
	.menu-btn { display: none; width: 44px; height: 44px; border-radius: 50%; align-items: center; justify-content: center; border: 1px solid var(--border); flex: none; background: var(--surface); }
	.menu-btn svg { width: 20px; height: 20px; }
	/* the menu never grows past the screen below the pill: on a short landscape
	   screen it scrolls inside, so every action stays reachable */
	.menu { position: absolute; top: calc(100% + 8px); left: 0; right: 0; max-height: calc(100vh - var(--pill-h) - 14px - var(--safe-top) - 24px); overflow-y: auto; overscroll-behavior: contain; background: var(--pill-bg); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: 22px; padding: 10px; display: grid; gap: 4px; box-shadow: 0 16px 40px -18px var(--shadow); }
	@supports (height: 1dvh) { .menu { max-height: calc(100dvh - var(--pill-h) - 14px - var(--safe-top) - 24px); } }
	.menu button { min-height: 48px; text-align: left; padding: 0 14px; font-size: 16px; font-weight: 500; border-radius: 12px; }
	.menu button:hover { background: var(--surface); }
	.menu .btn { justify-content: center; margin-top: 6px; border-radius: 999px; text-align: center; }
	@media (max-width: 900px) {
		.links, .cta, .divider.wide { display: none; }
		.menu-btn { display: inline-flex; }
	}
	@media (max-width: 480px) {
		.pill { gap: 6px; padding: 4px 4px; top: 10px; max-width: calc(100vw - 20px); }
		.brand { font-size: 16px; gap: 6px; }
		.brand .mark { display: none; }
		.pic { width: 30px; height: 30px; }
		.switch .long { display: none; }
		.switch .short { display: inline; }
		.switch button { padding: 0 12px; }
	}
	@media (max-width: 340px) { .divider { display: none; } }
</style>
