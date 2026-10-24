import { $, component$, sync$, useContext, useOnDocument, useSignal } from '@qwik.dev/core';
import { SiteStateCtx } from './state';
import { openContact } from './ContactDialog';
import { goToSection, toggleView } from './runtime/switch';

const preventPlainClick = sync$((event: MouseEvent) => {
	if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
});

// Runs inside the keydown, so it can stop the map's own Escape handler: Escape
// closes the open pill first and only then leaves the map.
const escapeClosesPill = sync$((event: KeyboardEvent) => {
	if (event.key !== 'Escape') return;
	const pill = document.querySelector<HTMLElement>('.pill[data-open="true"]');
	if (!pill || document.querySelector('dialog[open]')) return;
	event.stopImmediatePropagation();
	pill.querySelector<HTMLElement>('.pill-more')?.click();
});

const Svg = component$<{ d: string }>(({ d }) => (
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d={d} />
	</svg>
));

/** Floating capsule. Home: photo link, one site/map switch, More. Other pages:
 *  photo link, back link, More. More opens a second row with section and
 *  contact links; the contact link opens the existing contact dialog. */
export const Nav = component$<{ variant: 'home' | 'page' }>(({ variant }) => {
	const state = useContext(SiteStateCtx);
	const open = useSignal(false);
	const home = variant === 'home';
	const map = state.mode === 'map';

	useOnDocument('keydown', escapeClosesPill);
	useOnDocument(
		'pointerdown',
		$((event: Event) => {
			if (open.value && !(event.target as Element | null)?.closest('.pill')) open.value = false;
		})
	);

	return (
		<div class="pill" data-open={open.value ? 'true' : 'false'}>
			<nav class="pill-bar" aria-label="main">
				<a
					class="pill-id"
					href={home ? '#top' : '/'}
					aria-label="Adam Scott Gemenez, home"
					onClick$={
						home
							? [
									preventPlainClick,
									$((event: MouseEvent) => {
										if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
										open.value = false;
										goToSection(state, 'top');
									})
								]
							: undefined
					}
				>
					<span class="pill-photo">
						<img src="/brand/portrait-192.webp" alt="" width={48} height={48} decoding="async" />
					</span>
				</a>
				{home ? (
					<button
						type="button"
						class="pill-switch"
						id="view-switch"
						role="switch"
						aria-checked={map}
						aria-label="Project map view"
						onClick$={() => {
							open.value = false;
							toggleView(state);
						}}
					>
						<span class="sw-thumb" aria-hidden="true" />
						<span class="sw-opt" aria-hidden="true">
							<Svg d="M2.5 7.5 8 3l5.5 4.5M4 6.5V13h8V6.5" />
							<span class="sw-txt">Home</span>
						</span>
						<span class="sw-opt" aria-hidden="true">
							<Svg d="M4.5 4.5h7v7h-7zM6.5 2v2.5M9.5 2v2.5M6.5 11.5V14M9.5 11.5V14M2 6.5h2.5M2 9.5h2.5M11.5 6.5H14M11.5 9.5H14" />
							<span class="sw-txt">Map</span>
						</span>
					</button>
				) : (
					<a class="pill-back" href="/">
						<Svg d="M13 8H3M7 4 3 8l4 4" />
						<span>Back</span>
						<span class="wide-only"> to portfolio</span>
					</a>
				)}
				<button
					type="button"
					class="pill-more"
					id="pill-more-btn"
					aria-expanded={open.value}
					aria-controls="pill-extra"
					aria-label="More"
					onClick$={() => (open.value = !open.value)}
				>
					<Svg d="M8 3v10M3 8h10" />
				</button>
			</nav>
			<div class="pill-extra" id="pill-extra" inert={!open.value}>
				<div class="pill-clip">
					<div class="pill-row">
						<a
							href={home ? '#experience' : '/#experience'}
							onClick$={
								home
									? [
											preventPlainClick,
											$((event: MouseEvent) => {
												if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
												open.value = false;
												goToSection(state, 'experience');
											})
										]
									: undefined
							}
						>
							Experience
						</a>
						<button
							type="button"
							id="nav-contact"
							onClick$={[
								openContact,
								$(() => {
									// the row collapses, so the dialog returns focus to the More button
									const dialog = document.getElementById('contact-dialog');
									if (dialog) dialog.dataset.returnTo = 'pill-more-btn';
									open.value = false;
								})
							]}
						>
							Get in touch
						</button>
					</div>
				</div>
			</div>
		</div>
	);
});
