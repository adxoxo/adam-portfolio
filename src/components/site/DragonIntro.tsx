import { component$, useSignal, useVisibleTask$ } from '@qwik.dev/core';

/** Hidden in server HTML. A failed client task cannot cover the page. */
export const DragonIntro = component$(() => {
	const root = useSignal<HTMLElement>();
	useVisibleTask$(async ({ cleanup }) => {
		if (!root.value) return;
		const { attachDragonIntro } = await import('./runtime/dragon-intro');
		cleanup(attachDragonIntro(root.value));
	}, { strategy: 'document-ready' });
	return (
		<div class="dragon-intro" ref={root} hidden aria-hidden="true">
			<img src="/brand/dragon-mark.webp" alt="" width={96} height={120} decoding="async" />
		</div>
	);
});
