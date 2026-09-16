<script lang="ts">
	// Two illustrative previews. Decorative and labelled as illustrations by
	// the caller's caption; they are not screenshots.
	let { variant }: { variant: 'site' | 'invoice' } = $props();
</script>

<div class="shot-inner" aria-hidden="true">
	{#if variant === 'site'}
		<div class="shot-bar"><i></i><i></i><i></i><span>offer.example/watch</span></div>
		<div class="mini-site">
			<div class="mini-nav"><span class="logo"></span><span class="l"></span><span class="l"></span><span class="cta"></span></div>
			<div class="mini-hero">
				<div class="lines"><i></i><i></i><i class="thin"></i><i class="thin"></i></div>
				<div class="video"><span class="dur">02:40</span></div>
			</div>
			<div class="mini-form"><i data-ph="your name"></i><i data-ph="email"></i><b>get the guide</b></div>
		</div>
		<div class="flow-strip"><b class="on">form sent</b> <span>&rarr;</span> <b>supabase</b> <span>&rarr;</span> <b>brevo email</b> <span>&rarr;</span> <b>manychat</b></div>
	{:else}
		<div class="shot-bar"><i></i><i></i><i></i><span>n8n workflow, job to invoice</span></div>
		<div class="inv">
			<div class="inv-steps">
				<div class="inv-step on"><span class="dot">1</span><div><div class="t">job marked done</div><div class="s">a webhook fires into n8n</div></div></div>
				<div class="inv-step on"><span class="dot">2</span><div><div class="t">invoice built</div><div class="s">customer, service, amount filled in</div></div></div>
				<div class="inv-step on"><span class="dot">3</span><div><div class="t">emailed to the customer</div><div class="s">from the same workflow</div></div></div>
				<div class="inv-step"><span class="dot">4</span><div><div class="t">follow-up scheduled</div><div class="s">sent by the workflow, not by hand</div></div></div>
			</div>
			<div class="doc">
				<div class="head"><b>invoice</b><span>no. 0142</span></div>
				<div class="row"><span>full detail, sedan</span><span>&nbsp;</span></div>
				<div class="row"><span>interior deep clean</span><span>&nbsp;</span></div>
				<div class="row total"><span>total</span><span>sample</span></div>
				<span class="stamp">sent automatically</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.shot-inner { background: var(--bg); border: 1px solid var(--border); font-size: 14px; line-height: 1.5; }
	.shot-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 11px; color: var(--muted); }
	.shot-bar i { width: 7px; height: 7px; background: var(--border); display: block; }
	.shot-bar span { margin-left: 6px; }
	/* website preview */
	.mini-site { padding: 18px 20px 20px; display: grid; gap: 14px; }
	.mini-nav { display: flex; align-items: center; gap: 12px; }
	.mini-nav .logo { width: 22px; height: 10px; background: var(--text); }
	.mini-nav .l { width: 34px; height: 6px; background: var(--border); }
	.mini-nav .cta { margin-left: auto; width: 54px; height: 16px; background: var(--accent-deep); }
	.mini-hero { display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px; align-items: center; }
	.mini-hero .lines { display: grid; gap: 8px; }
	.mini-hero .lines i { display: block; height: 10px; background: var(--text); width: 90%; }
	.mini-hero .lines i:nth-child(2) { width: 70%; }
	.mini-hero .lines i.thin { height: 6px; background: var(--border); width: 95%; }
	.mini-hero .lines i.thin + i.thin { width: 60%; }
	.video { aspect-ratio: 16 / 9; background: var(--surface); border: 1px solid var(--border); display: grid; place-items: center; position: relative; }
	.video::after { content: ""; width: 0; height: 0; border-left: 18px solid var(--accent-deep); border-top: 11px solid transparent; border-bottom: 11px solid transparent; }
	.video .dur { position: absolute; right: 8px; bottom: 6px; font-size: 10px; color: var(--muted); font-weight: 500; letter-spacing: 0.06em; }
	.mini-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; }
	.mini-form i { display: block; height: 30px; border: 1px solid var(--border); background: var(--surface-2); position: relative; }
	.mini-form i::after { content: attr(data-ph); position: absolute; left: 8px; top: 7px; font-size: 11px; color: var(--muted); font-style: normal; }
	.mini-form b { display: grid; place-items: center; height: 30px; padding: 0 12px; background: var(--accent-deep); color: var(--on-accent); font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; }
	.flow-strip { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); padding: 10px 12px; border-top: 1px solid var(--border); background: var(--surface); }
	.flow-strip b { font-weight: 500; color: var(--text); border: 1px solid var(--border); background: var(--bg); padding: 3px 8px; }
	.flow-strip b.on { border-color: var(--accent-deep); color: var(--accent-deep); }
	/* invoice flow preview */
	.inv { padding: 20px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; align-items: center; }
	.inv-steps { display: grid; }
	.inv-step { display: grid; grid-template-columns: 26px 1fr; gap: 12px; align-items: start; position: relative; padding-bottom: 18px; }
	.inv-step:last-child { padding-bottom: 0; }
	.inv-step .dot { width: 26px; height: 26px; border: 1px solid var(--border); background: var(--surface-2); display: grid; place-items: center; font-size: 11px; font-weight: 500; color: var(--muted); }
	.inv-step.on .dot { background: var(--accent-deep); border-color: var(--accent-deep); color: var(--on-accent); }
	.inv-step::before { content: ""; position: absolute; left: 12.5px; top: 26px; bottom: 0; width: 1px; background: var(--border); }
	.inv-step:last-child::before { display: none; }
	.inv-step .t { font-size: 14px; font-weight: 500; line-height: 1.3; padding-top: 3px; }
	.inv-step .s { font-size: 12px; color: var(--muted); }
	.doc { background: var(--surface-2); border: 1px solid var(--border); padding: 16px; font-size: 11px; display: grid; gap: 10px; }
	.doc .head { display: flex; justify-content: space-between; align-items: baseline; }
	.doc .head b { font-family: var(--font-head); font-weight: 600; font-size: 13px; }
	.doc .head span { color: var(--muted); }
	.doc .row { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 6px; color: var(--muted); }
	.doc .row.total { border: 0; color: var(--text); font-weight: 500; padding-top: 2px; }
	.doc .stamp { justify-self: end; border: 1px solid var(--accent-deep); color: var(--accent-deep); padding: 3px 8px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; font-size: 10px; }
	@media (max-width: 480px) { .inv { grid-template-columns: 1fr; } .mini-hero { grid-template-columns: 1fr; } .mini-form { grid-template-columns: 1fr; } }
</style>
