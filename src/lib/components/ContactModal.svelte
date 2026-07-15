<script lang="ts">
	import { contact, closeContact, setContactView } from '$lib/state/app.svelte';

	let sending = $state(false);
	let sent = $state(false);
	let err = $state('');

	async function book(e: SubmitEvent) {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;
		const fd = new FormData(form);
		sending = true;
		err = '';
		try {
			const res = await fetch('/api/schedule', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name: fd.get('name'),
					email: fd.get('email'),
					date: fd.get('date'),
					time: fd.get('time'),
					note: fd.get('note')
				})
			});
			const j = await res.json();
			if (j.ok) {
				sent = true;
				form.reset();
			} else {
				err = j.error === 'rate_limited' ? 'too many requests, try again later.' : 'check the fields and try again.';
			}
		} catch {
			err = 'could not send, try again.';
		} finally {
			sending = false;
		}
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeContact();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if contact.open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="overlay" onclick={(e) => { if (e.target === e.currentTarget) closeContact(); }}>
		<div class="modal" role="dialog" aria-modal="true" aria-label="contact">
			<button class="mclose" onclick={closeContact} aria-label="close">&times;</button>
			{#if contact.view === 'menu'}
				<h2>let's talk</h2>
				<p style="margin:12px 0 16px">
					tell me what you are building and where it feels heavy. reach out however is easiest, or
					book a time.
				</p>
				<div class="mrow">
					<a class="btn" href="mailto:adamgemenez@gmail.com?subject=let's%20talk">email me</a>
					<button class="btn btn--ghost" onclick={() => setContactView('book')}>schedule a call</button>
				</div>
			{:else}
				<button class="back" onclick={() => setContactView('menu')}>&#8592; back</button>
				<h2>schedule a call</h2>
				<p style="margin:10px 0 6px">pick a time that works. i will confirm by email.</p>
				<form class="form" onsubmit={book}>
					<div class="field">
						<label for="b-name">name</label>
						<input id="b-name" name="name" required placeholder="your name" />
					</div>
					<div class="field">
						<label for="b-email">email</label>
						<input id="b-email" name="email" type="email" required placeholder="you@company.com" />
					</div>
					<div class="frow">
						<div class="field">
							<label for="b-date">preferred date</label>
							<input id="b-date" name="date" type="date" required />
						</div>
						<div class="field">
							<label for="b-time">time</label>
							<input id="b-time" name="time" type="time" required />
						</div>
					</div>
					<div class="field">
						<label for="b-note">what is it about</label>
						<textarea id="b-note" name="note" rows="3" placeholder="a sentence is fine"></textarea>
					</div>
					<button class="btn" type="submit" disabled={sending}>
						{sending ? 'sending' : sent ? 'sent' : 'request booking'}
					</button>
					{#if sent}<p class="ok">request sent. i will confirm the slot by email.</p>{/if}
					{#if err}<p class="mono" style="color:var(--ink-soft)">{err}</p>{/if}
				</form>
			{/if}
		</div>
	</div>
{/if}
