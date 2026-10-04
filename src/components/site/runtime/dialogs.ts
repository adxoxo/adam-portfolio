// Native <dialog> helpers. showModal() gives the focus trap, Escape, and makes
// everything behind the dialog inert. Browser-only, called from handlers.

import type { SiteState } from '../state';

function nextFrame() {
	return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/** Opens the shared project dialog once its content for `id` has rendered. */
export async function openProject(state: SiteState, id: string, openerId: string) {
	const dlg = document.getElementById('project-dialog') as HTMLDialogElement | null;
	if (!dlg) return;
	state.returnFocus = openerId;
	state.detailId = id;
	for (let i = 0; i < 90 && !dlg.querySelector(`[data-project="${CSS.escape(id)}"]`); i++) await nextFrame();
	if (!dlg.open) dlg.showModal();
	dlg.querySelector<HTMLElement>('[autofocus]')?.focus();
	dlg.scrollTop = 0;
}

/** Runs on the dialog `close` event: stop media, unmount content, return focus. */
export function afterProjectClose(state: SiteState, dlg: HTMLDialogElement) {
	dlg.querySelectorAll('video').forEach((v) => v.pause());
	const back = state.returnFocus;
	state.detailId = '';
	if (back) document.getElementById(back)?.focus({ preventScroll: true });
}

export function closeOnBackdrop(e: Event, dlg: HTMLDialogElement) {
	if (e.target === dlg) dlg.close();
}
