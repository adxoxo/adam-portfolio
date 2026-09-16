<script lang="ts">
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { CHAT_MESSAGES, CHAT_STEPS } from './data';

	let { onopencase }: { onopencase: (opener: HTMLElement) => void } = $props();

	let step = $state(0);
	const current = $derived(CHAT_STEPS[step]);
	const visible = $derived(CHAT_MESSAGES.slice(0, current.messages));
	let log = $state<HTMLDivElement>();

	// The frame never changes size (see the fixed heights below), so a longer
	// conversation scrolls inside the log. After each step, bring the newest
	// message into view.
	async function go(i: number) {
		step = i;
		await tick();
		log?.scrollTo({ top: log.scrollHeight, behavior: prefersReducedMotion.current ? 'auto' : 'smooth' });
	}
	const dur = $derived(prefersReducedMotion.current ? 0 : 220);
</script>

<div class="demo" aria-label="interactive demo: a website assistant that qualifies a visitor and books a call">
	<div class="demo-bar">
		<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
		<span class="url">yourbusiness.com/services</span>
		<span class="tag">interactive demo</span>
	</div>
	<div class="demo-body">
		<div class="chat">
			<div class="chat-head">
				<span class="avatar" aria-hidden="true"><span class="mark"></span></span>
				website assistant
				<span class="state">{current.state}</span>
			</div>
			<!-- the log scrolls inside a fixed frame, so keyboard users need to be able to focus it -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div class="chat-log" role="region" bind:this={log} aria-live="polite" tabindex="0" aria-label="conversation, scrolls">
				{#each visible as m (m.id)}
					{#if m.who === 'card'}
						<div class="card-booked" in:fade={{ duration: dur }}>
							<span class="title">call booked</span>
							<span class="line"><span>thursday, 10:00</span><span>20 min</span></span>
							<span class="line"><span>with adam</span><span>video call</span></span>
						</div>
					{:else}
						<div class="msg" class:visitor={m.who === 'visitor'} in:fade={{ duration: dur }}>
							<span class="who">{m.who}</span>{m.text}
						</div>
					{/if}
				{/each}
			</div>
			<!-- a disabled-looking strip: the composer is part of the picture, not a working input -->
			<div class="chat-input" aria-hidden="true"><span class="field">message input disabled in this demo</span><b>send</b></div>
		</div>
		{#snippet leadRows()}
			<div class="lead-row">
				<span class="k">intent score</span>
				<span class="meter" aria-hidden="true"><i style:width="{current.score * 10}%"></i></span>
				<span class="v">{current.score} / 10</span>
			</div>
			<div class="lead-row">
				<span class="k">stage</span>
				<span class="stages">
					{#each ['greeting', 'qualifying', 'closing'] as s, i (s)}
						<span data-on={i <= current.stage}>{s}</span>
					{/each}
				</span>
			</div>
			<!-- every step's value is laid out in the same cell and only the current one is visible,
			     so the panel is as tall as its tallest state and never changes size with the step -->
			<div class="lead-row"><span class="k">path</span><span class="v stack">{#each CHAT_STEPS as s, i (s.label)}<span class:on={i === step} aria-hidden={i !== step}>{s.path}</span>{/each}</span></div>
			<div class="lead-row"><span class="k">next action</span><span class="v stack">{#each CHAT_STEPS as s, i (s.label)}<span class:on={i === step} aria-hidden={i !== step}>{s.next}</span>{/each}</span></div>
		{/snippet}
		<aside class="lead-panel" aria-label="lead panel">
			<h4>what the business sees</h4>
			{@render leadRows()}
		</aside>
		<!-- phones: the same panel behind a native disclosure, closed by default, so the conversation comes first -->
		<details class="lead-details">
			<summary>what the business sees</summary>
			<div class="lead-panel lead-panel--mobile">{@render leadRows()}</div>
		</details>
	</div>
	<div class="demo-foot">
		<div class="steps" role="group" aria-label="preview steps">
			{#each CHAT_STEPS as s, i (s.label)}
				<button type="button" aria-pressed={step === i} onclick={() => go(i)}>{i + 1} {s.label}</button>
			{/each}
		</div>
		<button type="button" class="btn btn--secondary btn--small next" onclick={() => go((step + 1) % CHAT_STEPS.length)}>
			{step === CHAT_STEPS.length - 1 ? 'start over' : 'next step'}
		</button>
		<p class="demo-note">choose a step to preview the conversation</p>
	</div>
</div>
<p class="demo-caption">
	<span>the flow behind the aq chatbot.</span>
	<button type="button" class="textlink" onclick={(e) => onopencase(e.currentTarget)}>open the case study</button>
</p>

<style>
	/* the whole frame has a reserved footprint per breakpoint: bar + body + foot.
	   The body rows are fixed heights, the log and the lead panel scroll inside.
	   The simulated screen (bar, chat, dashboard) is drawn in neutral greys so it
	   reads as a picture; only the footer controls use the live green design. */
	.demo { --dg-bg: #F4F5F2; --dg-surface: #E8EAE5; --dg-surface-2: #FBFBFA; --dg-border: #D2D6CE; --dg-strong: #AEB4AA; --dg-text: #3B423B; --dg-muted: #626A61; --dg-fill: #9CA49A; --dg-on: #5A625A;
		border: 1px solid var(--border); background: var(--dg-surface); box-shadow: 0 1px 0 var(--border); color: var(--dg-text); }
	.demo-bar { display: flex; align-items: center; gap: 14px; height: 44px; padding: 0 14px; border-bottom: 1px solid var(--dg-border); font-size: 12px; color: var(--dg-muted); }
	.dots { display: flex; gap: 5px; }
	.dots i { width: 8px; height: 8px; background: var(--dg-strong); display: block; }
	.url { flex: 1; min-width: 0; background: var(--dg-bg); border: 1px solid var(--dg-border); padding: 4px 10px; font-weight: 500; letter-spacing: 0.02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.tag { font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; font-size: 11px; color: var(--accent-deep); border: 1px solid var(--accent-deep); background: var(--bg); padding: 2px 8px; white-space: nowrap; }
	.demo-body { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); height: 392px; }
	.chat { background: var(--dg-bg); border-right: 1px solid var(--dg-border); display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 46px minmax(0, 1fr) 54px; min-height: 0; }
	.chat-head { padding: 0 16px; border-bottom: 1px solid var(--dg-border); display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; }
	.avatar { width: 26px; height: 26px; background: var(--dg-on); display: grid; place-items: center; }
	.avatar .mark { width: 12px; background: #fff; }
	.state { margin-left: auto; font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dg-muted); }
	.chat-log { padding: 14px 16px; display: grid; gap: 10px; align-content: start; overflow-y: auto; overscroll-behavior: contain; min-height: 0; scrollbar-width: thin; }
	.chat-log:focus-visible { outline-offset: -2px; }
	.msg { max-width: 88%; padding: 10px 14px; font-size: 14px; line-height: 1.5; border: 1px solid var(--dg-border); background: var(--dg-surface-2); justify-self: start; }
	.msg.visitor { justify-self: end; background: var(--dg-surface); }
	.who { display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dg-muted); margin-bottom: 4px; font-weight: 500; }
	.card-booked { justify-self: start; max-width: 88%; border: 1px solid var(--dg-on); background: var(--dg-surface-2); padding: 12px 14px; font-size: 14px; display: grid; gap: 4px; }
	.card-booked .title { font-family: var(--font-head); font-weight: 600; font-size: 15px; color: var(--dg-on); }
	.card-booked .line { display: flex; justify-content: space-between; gap: 12px; color: var(--dg-muted); font-size: 13px; }
	/* the composer is disabled demonstration content: dashed, flat, no pointer, no live send */
	.chat-input { border-top: 1px dashed var(--dg-strong); padding: 0 12px; display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--dg-muted); background: var(--dg-surface); cursor: default; user-select: none; }
	.chat-input .field { flex: 1; min-width: 0; border: 1px dashed var(--dg-strong); padding: 8px 10px; background: var(--dg-bg); font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.chat-input b { font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dg-muted); border: 1px dashed var(--dg-strong); background: transparent; padding: 8px 10px; }
	.lead-panel { padding: 16px; display: grid; gap: 14px; align-content: start; font-size: 13px; overflow-y: auto; min-height: 0; background: var(--dg-surface); }
	.lead-panel h4 { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--font-body); font-weight: 500; color: var(--dg-muted); }
	.lead-row { display: grid; gap: 4px; }
	.lead-row .k { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dg-muted); font-weight: 500; }
	.lead-row .v { font-weight: 500; }
	.stack { display: grid; }
	.stack > span { grid-area: 1 / 1; visibility: hidden; }
	.stack > span.on { visibility: visible; }
	.lead-details { display: none; }
	.meter { height: 8px; background: var(--dg-bg); border: 1px solid var(--dg-border); position: relative; display: block; }
	.meter i { position: absolute; inset: 0; right: auto; background: var(--dg-fill); transition: width 0.4s ease; }
	/* stage chips are static status data: flat, no button look; the reached stages are the darker grey */
	.stages { display: flex; flex-wrap: wrap; gap: 4px; }
	.stages span { flex: 1; text-align: center; font-size: 10px; letter-spacing: 0.03em; text-transform: uppercase; padding: 5px 1px; color: var(--dg-muted); background: var(--dg-bg); border-bottom: 2px solid var(--dg-border); }
	.stages span[data-on="true"] { background: var(--dg-on); color: #fff; border-bottom-color: var(--dg-on); }
	/* footer: the real controls, in the live design */
	.demo-foot { display: grid; grid-template-columns: auto 1fr; grid-template-rows: 44px auto; align-items: center; gap: 8px 10px; padding: 10px 14px; border-top: 1px solid var(--border); background: var(--bg); color: var(--text); }
	.steps { display: inline-flex; gap: 6px; }
	.steps button { min-width: 44px; min-height: 44px; padding: 0 12px; font-size: 12px; font-weight: 500; letter-spacing: 0.04em; color: var(--accent-deep); background: var(--surface-2); border: 1px solid var(--border-strong); box-shadow: 0 1px 0 var(--border-strong); cursor: pointer; white-space: nowrap; transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
	.steps button:hover { background: var(--surface); border-color: var(--accent); color: var(--accent-deep); }
	.steps button:focus-visible { outline: 2px solid var(--accent-deep); outline-offset: 2px; }
	.steps button[aria-pressed="true"] { background: var(--accent-deep); color: var(--on-accent); border-color: var(--accent-deep); box-shadow: none; }
	.steps button[aria-pressed="true"]:hover { color: var(--on-accent); background: var(--accent-deep); }
	.next { justify-self: end; min-width: 132px; }
	.demo-note { grid-column: 1 / -1; font-size: 12px; color: var(--muted); }
	.demo-caption { margin-top: 12px; font-size: 14px; color: var(--muted); display: flex; gap: 8px 16px; flex-wrap: wrap; align-items: center; }
	.demo-caption .textlink { min-height: 32px; }
	/* touch sizes: the caption link grows to 44px where the hero stacks (the desktop hero is centred on its column and would shift) */
	@media (max-width: 960px) { .demo-caption .textlink { min-height: 44px; } }
	@media (max-width: 560px) {
		/* one column: the conversation in a fixed 360px frame, the business panel
		   below it behind a disclosure. The frame only changes height when the
		   visitor opens or closes that disclosure, never with the step. */
		.demo-body { grid-template-columns: minmax(0, 1fr); grid-template-rows: 360px auto; height: auto; }
		.chat { border-right: 0; border-bottom: 1px solid var(--dg-border); }
		.msg, .card-booked { font-size: 16px; max-width: 92%; }
		.who { font-size: 13px; }
		.tag, .state { font-size: 12px; }
		.card-booked .title { font-size: 16px; }
		.card-booked .line { font-size: 14px; }
		.chat-input { font-size: 13px; }
		.lead-panel:not(.lead-panel--mobile) { display: none; }
		.lead-details { display: block; background: var(--dg-surface); }
		.lead-details summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; padding: 0 16px; font-size: 14px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dg-text); cursor: pointer; list-style: none; }
		.lead-details summary::-webkit-details-marker { display: none; }
		.lead-details summary::after { content: "+"; font-family: var(--font-head); font-size: 20px; color: var(--dg-on); }
		.lead-details[open] summary::after { content: "\2212"; }
		.lead-details summary:focus-visible { outline: 2px solid var(--accent-deep); outline-offset: -2px; }
		.lead-panel--mobile { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding: 4px 16px 16px; font-size: 15px; overflow: visible; border-top: 1px solid var(--dg-border); }
		.lead-panel--mobile .stages { gap: 6px; }
		.lead-panel--mobile .stages span { flex: 1 1 auto; padding: 6px 8px; }
		.lead-panel--mobile .k { font-size: 13px; }
		.lead-panel--mobile .stages span { font-size: 12px; }
		.demo-foot { grid-template-columns: 1fr; grid-template-rows: 44px 44px auto; }
		.demo-note { font-size: 13px; }
		.steps { width: 100%; }
		.steps button { flex: 1; padding: 0 6px; font-size: 13px; white-space: normal; line-height: 1.15; }
		.next { justify-self: stretch; }
		.demo-caption { font-size: 15px; }
	}
	@media (max-width: 380px) {
		/* the three labels may wrap to two lines inside the fixed 44px row instead of touching the button edge */
		.steps button { padding: 0 4px; letter-spacing: 0; }
		.steps { gap: 4px; }
	}
</style>
