<script lang="ts">
	import { tick } from 'svelte';
	import { LINKS, type Project } from './data';

	// One way to get in touch, in one native dialog: the calendly scheduler for
	// a 30 minute call, inline. There is no form and nothing is posted to this
	// site; the booking happens inside calendly's own frame. A direct link to
	// the same calendly page and the email address stay visible as fallbacks.
	// The parent mounts this component only while the dialog is open, so the
	// calendly script is added to the page on mount and removed on unmount.
	let {
		similarTo = null,
		onclose
	}: {
		similarTo?: Project | null;
		onclose: () => void;
	} = $props();

	const CALENDLY_URL = 'https://calendly.com/adamgemenez/30min';
	const WIDGET_SRC = 'https://assets.calendly.com/assets/external/widget.js';
	// the embedded page: no cookie banner inside the small frame, brand colours
	const WIDGET_URL = `${CALENDLY_URL}?hide_gdpr_banner=1&background_color=fafbf7&text_color=212c21&primary_color=3d5f40`;

	type Calendly = { initInlineWidget: (o: { url: string; parentElement: HTMLElement; prefill?: object; utm?: object }) => void };

	let dlg = $state<HTMLDialogElement>();
	let title = $state<HTMLHeadingElement>();
	let host = $state<HTMLDivElement>();
	let ready = $state(false);
	let failed = $state(false);

	// the email fallback carries the "build something similar" context
	const mailto = $derived(
		similarTo ? `${LINKS.mailto}&body=${encodeURIComponent(`i would like something similar to "${similarTo.title}" for my business. `)}` : LINKS.mailto
	);

	// open the native modal once mounted; focus starts on the title, so the
	// visitor reads what the dialog is before the scheduler takes over
	$effect(() => {
		dlg?.showModal();
		tick().then(() => title?.focus());
	});

	// the official script, added while the dialog is mounted and removed with
	// it. Its global survives a removal, so a second opening reuses it and
	// only initialises the widget again.
	$effect(() => {
		const parent = host;
		if (!parent) return;
		let cancelled = false;
		let script: HTMLScriptElement | null = null;
		const init = () => {
			if (cancelled) return;
			const calendly = (window as Window & { Calendly?: Calendly }).Calendly;
			if (!calendly?.initInlineWidget) {
				failed = true;
				return;
			}
			calendly.initInlineWidget({ url: WIDGET_URL, parentElement: parent, prefill: {}, utm: {} });
			ready = true; // calendly shows its own spinner inside the frame from here
		};
		if ((window as Window & { Calendly?: Calendly }).Calendly?.initInlineWidget) {
			init();
		} else {
			script = document.createElement('script');
			script.src = WIDGET_SRC;
			script.async = true;
			script.onload = init;
			script.onerror = () => {
				if (!cancelled) failed = true;
			};
			document.head.appendChild(script);
		}
		return () => {
			cancelled = true;
			script?.remove();
		};
	});
</script>

<dialog bind:this={dlg} aria-labelledby="cd-title" {onclose} onclick={(e) => e.target === dlg && dlg?.close()}>
	<div class="dlg">
		<div class="dlg-head">
			<p class="eyebrow">work with me</p>
			<button type="button" class="close" aria-label="close" onclick={() => dlg?.close()}>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l12 12M16 4L4 16" /></svg>
			</button>
		</div>
		<h2 id="cd-title" class="title" tabindex="-1" bind:this={title}>book a 30 minute call</h2>
		<p class="small muted">
			pick a time that suits you. the call goes into both calendars and the details come by email.
			{#if similarTo}we can start from "{similarTo.title}" and what a similar system would look like for your business.{/if}
		</p>
		<div class="scheduler" aria-busy={!ready && !failed}>
			{#if failed}
				<div class="form-result error" role="alert">
					the scheduler could not load here. open calendly in a new tab, or email <a href={mailto}>{LINKS.email}</a>.
				</div>
			{:else if !ready}
				<p class="loading small muted" role="status">loading the scheduler…</p>
			{/if}
			<div class="calendly" bind:this={host} data-url={CALENDLY_URL} hidden={failed}></div>
		</div>
		<div class="actions">
			<a class="btn btn--secondary" href={CALENDLY_URL} target="_blank" rel="noopener">open calendly in a new tab</a>
			<a class="textlink" href={mailto}>or email {LINKS.email}</a>
		</div>
	</div>
</dialog>

<style>
	/* the title follows the sticky head with the gap the head used to hold */
	.title { margin-top: -12px; }
	.scheduler { display: grid; gap: 12px; }
	/* calendly fills the box it is given: the two column layout above 650px,
	   the phone layout below it; the frame scrolls inside on a short screen */
	.calendly { height: clamp(560px, 72vh, 700px); border: 1px solid var(--border); background: var(--surface-2); }
	.calendly[hidden] { display: none; }
	.calendly :global(iframe) { display: block; width: 100%; height: 100%; border: 0; }
	.loading { min-height: 24px; }
	.actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
	@media (max-width: 640px) {
		.actions .btn { width: 100%; white-space: normal; text-align: center; }
	}
</style>
