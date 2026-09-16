<script lang="ts">
	import type { FlowVariant } from './data';

	// Code-native workflow diagrams for the two sourced case studies. Plain
	// ordered lists with CSS arrows: a row when the container is wide enough,
	// a column otherwise (container query, so the same component works on the
	// overview and inside the 760px dialog).
	//
	// Both flows are private client builds, so the data here stays at the level
	// of what the customer and the team receive: the stages, who acts at each
	// one, and the alternate route. The internal rules (case sorting, branch
	// conditions, what the photos must show), the follow-up and escalation
	// timings and the slot handling are deliberately not part of the public
	// bundle. Do not add per-step notes that describe how a stage is decided.
	let { variant }: { variant: FlowVariant } = $props();

	type Who = 'auto' | 'human' | 'customer';
	interface Step {
		label: string;
		who: Who;
	}
	interface Flow {
		title: string;
		steps: Step[];
		alt?: { title: string; when: string; steps: Step[] };
		rail: string[];
	}

	const FLOWS: Record<FlowVariant, Flow> = {
		enquiry: {
			title: 'from web enquiry to proposal, or to a technician booking',
			steps: [
				{ label: 'web enquiry', who: 'customer' },
				{ label: 'whatsapp intro + form link', who: 'auto' },
				{ label: 'project details + photos', who: 'customer' },
				{ label: 'photo review', who: 'human' },
				{ label: 'proposal pdf by whatsapp', who: 'auto' },
				{ label: 'installation dates', who: 'customer' }
			],
			alt: {
				title: 'alternate route: technician booking',
				when: 'the case needs a technician',
				steps: [
					{ label: 'booking link by whatsapp', who: 'auto' },
					{ label: 'customer books a call', who: 'customer' },
					{ label: 'technician call', who: 'human' }
				]
			},
			rail: ['the team board follows every stage', 'automatic follow-ups with a resume link', 'escalation to a person', 'full history stored']
		},
		booking: {
			title: 'from a booked workshop to signed, paid and invoiced',
			steps: [
				{ label: 'workshop slot', who: 'customer' },
				{ label: 'company details', who: 'customer' },
				{ label: 'offer + signature', who: 'customer' },
				{ label: 'payment', who: 'customer' },
				{ label: 'invoice + booking confirmation', who: 'auto' },
				{ label: 'crm + calendar updated', who: 'auto' }
			],
			rail: ['german and english', 'resumable steps with reminders', 'preferred dates confirmed by the team']
		}
	};
	const flow = $derived(FLOWS[variant]);
	const WHO: Record<Who, string> = { auto: 'automatic', human: 'a person', customer: 'customer' };
</script>

<div class="flow" data-variant={variant}>
	<p class="flow-title">{flow.title}</p>
	<ol class="lane" aria-label="main route">
		{#each flow.steps as s, i (s.label)}
			<li class="step" data-who={s.who}>
				<span class="num">{String(i + 1).padStart(2, '0')}</span>
				<span class="who">{WHO[s.who]}</span>
				<span class="label">{s.label}</span>
			</li>
		{/each}
	</ol>
	{#if flow.alt}
		<div class="alt">
			<p class="alt-title"><span class="turn" aria-hidden="true">&#8627;</span> {flow.alt.title} <span class="when">when {flow.alt.when}</span></p>
			<ol class="lane alt-lane" aria-label={flow.alt.title}>
				{#each flow.alt.steps as s, i (s.label)}
					<li class="step" data-who={s.who}>
						<span class="num">{String.fromCharCode(97 + i)}</span>
						<span class="who">{WHO[s.who]}</span>
						<span class="label">{s.label}</span>
					</li>
				{/each}
			</ol>
		</div>
	{/if}
	<ul class="rail" aria-label="running alongside">
		{#each flow.rail as r (r)}<li>{r}</li>{/each}
	</ul>
	<p class="legend"><span data-who="auto">automatic</span><span data-who="human">a person decides</span><span data-who="customer">the customer</span></p>
</div>

<style>
	.flow { container-type: inline-size; display: grid; gap: 14px; font-size: 13px; line-height: 1.45; }
	.flow-title { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500; color: var(--muted); }
	.lane { display: grid; gap: 22px 0; }
	.step { position: relative; display: grid; gap: 4px; align-content: start; border: 1px solid var(--border); background: var(--surface-2); padding: 12px 14px 12px 40px; min-width: 0; }
	.step::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--accent); }
	.step[data-who="human"]::before { background: var(--accent-deep); }
	.step[data-who="human"] { border-color: var(--accent-deep); }
	.step[data-who="customer"]::before { background: var(--border-strong); }
	.num { position: absolute; left: 13px; top: 12px; font-family: var(--font-head); font-weight: 600; font-size: 12px; color: var(--muted); }
	.who { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; color: var(--accent); }
	.step[data-who="human"] .who { color: var(--accent-deep); }
	.step[data-who="customer"] .who { color: var(--muted); }
	.label { font-family: var(--font-head); font-weight: 600; font-size: 14px; line-height: 1.25; overflow-wrap: anywhere; }
	/* arrows: down in a column, right in a row */
	.step + .step::after { content: "\2193"; position: absolute; left: 50%; top: -22px; transform: translateX(-50%); width: 22px; height: 22px; display: grid; place-items: center; font-size: 16px; color: var(--accent); }
	.alt { border: 1px dashed var(--accent-deep); padding: 12px 14px 14px; display: grid; gap: 10px; }
	.alt-title { font-size: 13px; font-weight: 500; color: var(--accent-deep); display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
	.turn { font-size: 18px; line-height: 1; }
	.when { font-weight: 400; color: var(--muted); }
	.rail { display: flex; flex-wrap: wrap; gap: 6px; }
	.rail li { font-size: 12px; color: var(--muted); border: 1px solid var(--border); background: var(--bg); padding: 4px 9px; }
	.rail li::before { content: "\00B7  "; color: var(--accent); }
	.legend { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 12px; color: var(--muted); }
	.legend span::before { content: ""; display: inline-block; width: 10px; height: 10px; margin-right: 6px; vertical-align: -1px; background: var(--accent); }
	.legend span[data-who="human"]::before { background: var(--accent-deep); }
	.legend span[data-who="customer"]::before { background: var(--border-strong); }
	@container (min-width: 860px) {
		.lane { grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 0 22px; }
		.step + .step::after { content: "\2192"; left: -22px; top: 50%; transform: translateY(-50%); }
		.alt-lane { grid-auto-columns: minmax(0, 1fr); max-width: 66%; }
	}
	/* phones: readable stage labels and supporting text, a little less air between the stages */
	@media (max-width: 640px) {
		.flow { font-size: 14px; gap: 12px; }
		.flow-title, .alt-title, .rail li, .legend { font-size: 14px; }
		.label { font-size: 16px; }
		.who { font-size: 13px; }
		.num { font-size: 13px; }
		.lane { gap: 20px 0; }
		.step + .step::after { top: -20px; height: 20px; }
		.step { padding: 10px 12px 10px 38px; }
	}
</style>
