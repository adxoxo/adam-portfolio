import { component$, sync$, useSignal } from '@qwik.dev/core';
import { CALENDLY_URL, EMAIL, MAILTO } from './state';
import { Icon } from './icons';

/** Opens the contact dialog inside the click, with no wait for code to load. */
export const openContact = sync$((_: Event, el: Element) => {
	const d = document.getElementById('contact-dialog') as HTMLDialogElement | null;
	if (!d) return;
	d.dataset.returnTo = (el as HTMLElement).id || '';
	if (!d.open) d.showModal();
});

/**
 * Two real routes to Adam: the existing Calendly booking page (opens on
 * calendly.com in a new tab, nothing loads from Calendly before that) and
 * email. There is no form, so the site never claims it delivered a message.
 */
export const ContactDialog = component$(() => {
	const copied = useSignal('');
	return (
		<dialog
			id="contact-dialog"
			class="cd"
			aria-labelledby="cd-title"
			aria-describedby="cd-desc"
			onClose$={(_, el) => {
				copied.value = '';
				const back = el.dataset.returnTo;
				if (back) document.getElementById(back)?.focus({ preventScroll: true });
			}}
			onClick$={(e, el) => {
				if (e.target === el) el.close();
			}}
		>
			<div class="cd-inner">
				<div class="cd-head">
					<h2 id="cd-title">work with me</h2>
					<form method="dialog">
						<button type="submit" class="x-btn" aria-label="close" autofocus>
							<Icon name="close" />
						</button>
					</form>
				</div>
				<p id="cd-desc">tell me what you are building and where it feels heavy. book a call or write an email, whichever is easier.</p>
				<div class="cd-opts">
					<div class="cd-opt">
						<a class="btn" href={CALENDLY_URL} target="_blank" rel="noopener">
							<Icon name="calendar" /> book a 30 minute call
						</a>
						<small>opens my calendly page in a new tab. you pick a time there.</small>
					</div>
					<div class="cd-opt">
						<a class="btn btn--ghost" href={MAILTO}>
							<Icon name="mail" /> email adam
						</a>
						<div class="cd-mail">
							<code>{EMAIL}</code>
							<button
								type="button"
								class="cd-copy"
								onClick$={async () => {
									try {
										await navigator.clipboard.writeText(EMAIL);
										copied.value = 'address copied';
									} catch {
										copied.value = 'copy did not work, select the address instead';
									}
								}}
							>
								copy address
							</button>
						</div>
						<small role="status">{copied.value || 'opens your own email app. the site does not send anything for you.'}</small>
					</div>
				</div>
			</div>
		</dialog>
	);
});
