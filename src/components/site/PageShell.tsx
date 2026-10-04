import { component$, Slot, useContextProvider, useStore, useStyles$ } from '@qwik.dev/core';
import styles from '~/styles/site.css?inline';
import { SiteStateCtx, type SiteState } from './state';
import { Nav } from './Nav';
import { Footer } from './Footer';
import { ContactDialog } from './ContactDialog';

/** Same look as the portfolio for the policy pages: nav, content, footer, contact. */
export const PageShell = component$(() => {
	useStyles$(styles);
	const state = useStore<SiteState>({ mode: 'site', detailId: '', returnFocus: '' });
	useContextProvider(SiteStateCtx, state);
	return (
		<div class="app" data-mode="site">
			<a class="skip" href="#content">
				skip to content
			</a>
			<Nav variant="page" />
			<main class="policy" id="top">
				<div class="wrap" id="content" tabIndex={-1}>
					<Slot />
					<p class="back">
						<a class="text-link" href="/">
							back to the portfolio
						</a>
					</p>
				</div>
			</main>
			<Footer variant="page" />
			<ContactDialog />
		</div>
	);
});
