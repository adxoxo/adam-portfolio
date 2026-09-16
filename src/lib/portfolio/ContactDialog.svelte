<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { LINKS, SERVICES, type Project } from './data';

	// Two ways to get in touch, in one native dialog:
	//  - "send a message" posts {name, email, message} to /api/lead. The chosen
	//    need and the "build something similar" project are appended to the
	//    message as context lines, so the existing route keeps its contract.
	//  - "request a call" posts {name, email, date, time, note} to /api/schedule.
	//    It is a request for a preferred time; nothing is booked until adam
	//    confirms it by email.
	// Both routes answer {ok: true} once they accepted the request (the server
	// stores / forwards / logs as configured), so success wording only says
	// "received". The parent mounts this component only while the dialog is
	// open, so the fields start fresh each time.
	let {
		similarTo = null,
		onclose
	}: {
		similarTo?: Project | null;
		onclose: () => void;
	} = $props();

	type Mode = 'message' | 'call';
	type Status = 'idle' | 'sending' | 'sent' | 'error';

	// same rules as src/routes/api/lead/+server.ts and src/routes/api/schedule/+server.ts
	const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
	const MESSAGE_MAX = 3000; // leaves room for the context lines inside the lead route's 4000
	const NOTE_MAX = 2000;

	let dlg = $state<HTMLDialogElement>();
	let nameInput = $state<HTMLInputElement>();
	let emailInput = $state<HTMLInputElement>();
	let msgInput = $state<HTMLTextAreaElement>();
	let dateInput = $state<HTMLInputElement>();
	let timeInput = $state<HTMLInputElement>();
	let noteInput = $state<HTMLTextAreaElement>();
	let result = $state<HTMLDivElement>();

	let mode = $state<Mode>('message');
	// name and email are shared by both forms, so switching keeps them
	let name = $state('');
	let email = $state('');
	let need = $state(untrack(() => similarTo?.service ?? ''));
	let message = $state(untrack(() => (similarTo ? `i would like something similar to "${similarTo.title}" for my business. ` : '')));
	let date = $state('');
	let time = $state('');
	let note = $state('');
	let errors = $state<{ name?: string; email?: string; message?: string; date?: string; time?: string; note?: string }>({});
	let status = $state<Status>('idle');
	let failure = $state('');

	const needLabel = $derived(SERVICES.find((s) => s.id === need)?.title ?? '');
	const sending = $derived(status === 'sending');
	const today = new Date().toISOString().slice(0, 10);

	// the message adam receives: the visitor's text plus the context lines
	const fullMessage = $derived.by(() => {
		const lines = [message.trim()];
		const ctx: string[] = [];
		if (needLabel) ctx.push(`need: ${needLabel}`);
		if (similarTo) ctx.push(`similar to: ${similarTo.title} (${similarTo.id})`);
		if (ctx.length) lines.push('', '---', ...ctx);
		return lines.join('\n');
	});
	// fallback for the error state: the same text, ready to send by email
	const mailtoFallback = $derived.by(() => {
		const body = mode === 'call' ? `call request\npreferred date: ${date}\npreferred time: ${time}\n\n${note.trim()}` : fullMessage;
		return `${LINKS.mailto}&body=${encodeURIComponent(body)}`;
	});

	// open the native modal once mounted and put the cursor in the first field
	$effect(() => {
		dlg?.showModal();
		tick().then(() => nameInput?.focus());
	});

	async function switchMode(m: Mode) {
		if (m === mode) return;
		mode = m;
		status = 'idle';
		failure = '';
		errors = {};
		await tick();
		nameInput?.focus();
	}

	function validate(): boolean {
		const e: typeof errors = {};
		if (!name.trim()) e.name = 'please add your name.';
		else if (name.trim().length > 120) e.name = 'please keep the name under 120 characters.';
		if (!email.trim()) e.email = 'please add an email address for the reply.';
		else if (!EMAIL.test(email.trim()) || email.trim().length > 200) e.email = 'that does not look like an email address.';
		if (mode === 'message') {
			if (!message.trim()) e.message = 'please write a few sentences about the work.';
			else if (message.trim().length > MESSAGE_MAX) e.message = `please keep the message under ${MESSAGE_MAX} characters.`;
		} else {
			if (!date.trim()) e.date = 'please pick a preferred date.';
			else if (date.trim().length > 20) e.date = 'that does not look like a date.';
			if (!time.trim()) e.time = 'please pick a preferred time.';
			else if (time.trim().length > 10) e.time = 'that does not look like a time.';
			if (note.trim().length > NOTE_MAX) e.note = `please keep the note under ${NOTE_MAX} characters.`;
		}
		errors = e;
		if (e.name) nameInput?.focus();
		else if (e.email) emailInput?.focus();
		else if (e.message) msgInput?.focus();
		else if (e.date) dateInput?.focus();
		else if (e.time) timeInput?.focus();
		else if (e.note) noteInput?.focus();
		return Object.keys(e).length === 0;
	}

	function explain(error: string | undefined, fallback: string) {
		if (error === 'rate_limited') return 'too many requests from this connection in a short time. please wait a few minutes and try again, or use the email link.';
		if (error === 'invalid') return 'the server did not accept the request. please check the fields and try again.';
		return fallback;
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (sending) return;
		if (!validate()) return;
		status = 'sending';
		failure = '';
		const call = mode === 'call';
		const payload = call
			? { name: name.trim(), email: email.trim(), date: date.trim(), time: time.trim(), note: note.trim() }
			: { name: name.trim(), email: email.trim(), message: fullMessage };
		try {
			const res = await fetch(call ? '/api/schedule' : '/api/lead', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
			if (res.ok && body?.ok) {
				status = 'sent';
			} else {
				status = 'error';
				failure = explain(body?.error, call ? 'the call request could not be delivered right now. please try again, or use the email link.' : 'the message could not be delivered right now. please try again, or use the email link.');
			}
		} catch {
			status = 'error';
			failure = 'no connection to the server. please check your network and try again, or use the email link.';
		}
		await tick();
		result?.focus();
	}
</script>

<dialog bind:this={dlg} aria-labelledby="cd-title" {onclose} onclick={(e) => e.target === dlg && dlg?.close()}>
	<form class="dlg form" novalidate onsubmit={submit} aria-busy={sending} data-mode={mode}>
		<div class="dlg-head">
			<div>
				<p class="eyebrow">work with me</p>
				<h2 id="cd-title" class="title">{mode === 'call' ? 'request a call' : 'tell me about the work'}</h2>
			</div>
			<button type="button" class="close" aria-label="close" onclick={() => dlg?.close()}>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l12 12M16 4L4 16" /></svg>
			</button>
		</div>
		<div class="modes" role="group" aria-label="how to get in touch">
			<button type="button" aria-pressed={mode === 'message'} disabled={sending} onclick={() => switchMode('message')}>send a message</button>
			<button type="button" aria-pressed={mode === 'call'} disabled={sending} onclick={() => switchMode('call')}>request a call</button>
		</div>
		{#if status === 'sent'}
			<div class="form-result" role="status" tabindex="-1" bind:this={result}>
				{#if mode === 'call'}
					<b>received.</b> thanks, {name.trim()}. this is a request for {date} at {time}, not a booking yet: adam confirms the time by email to {email.trim()}, or suggests another one.
				{:else}
					<b>received.</b> thanks, {name.trim()}. your request was accepted; the reply goes to {email.trim()}.
				{/if}
			</div>
			<div class="actions">
				<button type="button" class="btn" onclick={() => dlg?.close()}>close</button>
				{#if mode === 'call'}
					<button type="button" class="textlink" onclick={() => switchMode('message')}>send a message as well</button>
				{:else}
					<a class="textlink" href={LINKS.mailto}>or email {LINKS.email}</a>
				{/if}
			</div>
		{:else}
			{#if mode === 'call'}
				<p class="small muted">pick a time that suits you. adam confirms it by email, or suggests another one; the slot is not booked automatically.</p>
			{:else}
				<p class="small muted">a few sentences are enough. what the business does, what is slowing it down, and anything you already use.</p>
			{/if}
			<div class="two">
				<div class="field">
					<label for="cf-name">your name</label>
					<input id="cf-name" name="name" type="text" autocomplete="name" maxlength="120" required bind:value={name} bind:this={nameInput} aria-invalid={errors.name ? 'true' : undefined} aria-describedby={errors.name ? 'cf-name-err' : undefined} disabled={sending} />
					{#if errors.name}<span class="err" id="cf-name-err">{errors.name}</span>{/if}
				</div>
				<div class="field">
					<label for="cf-email">email</label>
					<input id="cf-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="200" required bind:value={email} bind:this={emailInput} aria-invalid={errors.email ? 'true' : undefined} aria-describedby={errors.email ? 'cf-email-err' : undefined} disabled={sending} />
					{#if errors.email}<span class="err" id="cf-email-err">{errors.email}</span>{/if}
				</div>
			</div>
			{#if mode === 'call'}
				<div class="two">
					<div class="field">
						<label for="cf-date">preferred date</label>
						<input id="cf-date" name="date" type="date" min={today} required bind:value={date} bind:this={dateInput} aria-invalid={errors.date ? 'true' : undefined} aria-describedby={errors.date ? 'cf-date-err' : undefined} disabled={sending} />
						{#if errors.date}<span class="err" id="cf-date-err">{errors.date}</span>{/if}
					</div>
					<div class="field">
						<label for="cf-time">preferred time</label>
						<input id="cf-time" name="time" type="time" required bind:value={time} bind:this={timeInput} aria-invalid={errors.time ? 'true' : undefined} aria-describedby={errors.time ? 'cf-time-err' : undefined} disabled={sending} />
						{#if errors.time}<span class="err" id="cf-time-err">{errors.time}</span>{/if}
					</div>
				</div>
				<div class="field">
					<label for="cf-note">what is it about <span class="muted">(optional)</span></label>
					<textarea id="cf-note" name="note" class="short" maxlength={NOTE_MAX} bind:value={note} bind:this={noteInput} aria-invalid={errors.note ? 'true' : undefined} aria-describedby={errors.note ? 'cf-note-err' : undefined} disabled={sending}></textarea>
					{#if errors.note}<span class="err" id="cf-note-err">{errors.note}</span>{/if}
				</div>
				<p class="form-note">a request, not a booking: the time is confirmed by adam by email.</p>
			{:else}
				<div class="field">
					<label for="cf-need">what do you need</label>
					<select id="cf-need" name="need" bind:value={need} disabled={sending}>
						<option value="">not sure yet</option>
						<option value="websites">a website or landing page</option>
						<option value="ai">an ai assistant or tool</option>
						<option value="automation">an automation</option>
						<option value="apps">a custom app or dashboard</option>
						<option value="devices">a connected device</option>
					</select>
				</div>
				<div class="field">
					<label for="cf-msg">message</label>
					<textarea id="cf-msg" name="message" maxlength={MESSAGE_MAX} required bind:value={message} bind:this={msgInput} aria-invalid={errors.message ? 'true' : undefined} aria-describedby={errors.message ? 'cf-msg-err' : undefined} disabled={sending}></textarea>
					{#if errors.message}<span class="err" id="cf-msg-err">{errors.message}</span>{/if}
				</div>
				<p class="form-note">for project enquiries. the reply comes by email.</p>
			{/if}
			{#if status === 'error'}
				<div class="form-result error" role="alert" tabindex="-1" bind:this={result}>
					{failure} <a href={mailtoFallback}>email this to {LINKS.email}</a>
				</div>
			{/if}
			<div class="actions">
				<button type="submit" class="btn" disabled={sending}>{sending ? 'sending…' : status === 'error' ? 'try again' : mode === 'call' ? 'request the call' : 'send message'}</button>
				<a class="textlink" href={LINKS.mailto}>or email {LINKS.email}</a>
			</div>
		{/if}
	</form>
</dialog>

<style>
	.title { margin-top: 10px; }
	.form-result:focus { outline: 2px solid var(--accent-deep); outline-offset: 2px; }
	.modes { display: inline-flex; border: 1px solid var(--border); background: var(--surface); justify-self: start; }
	.modes button { min-height: 44px; padding: 0 16px; font-size: 13px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); transition: background-color 0.15s ease, color 0.15s ease; }
	.modes button:hover { color: var(--text); }
	.modes button[aria-pressed="true"] { background: var(--accent-deep); color: var(--on-accent); }
	.modes button:focus-visible { outline-offset: -2px; }
	.modes button:disabled { cursor: default; }
	.field .short { min-height: 88px; }
	@media (max-width: 400px) { .modes { display: flex; } .modes button { flex: 1; padding: 0 8px; } }
</style>
