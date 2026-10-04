import { createContextId } from '@qwik.dev/core';
import type { ViewProject } from '~/lib/data/presentation';

export type Mode = 'site' | 'map';

/** Serializable page state shared by the nav, map and dialogs. */
export interface SiteState {
	mode: Mode;
	/** id of the project shown in the project dialog, '' when closed */
	detailId: string;
	/** element id that opened the project dialog, for focus return */
	returnFocus: string;
}

export const SiteStateCtx = createContextId<SiteState>('site.state');
export const ProjectsCtx = createContextId<{ list: ViewProject[] }>('site.projects');

export const CALENDLY_URL = 'https://calendly.com/adamgemenez/30min';
export const EMAIL = 'adamgemenez@gmail.com';
export const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("let's talk")}`;
export const SITE_URL = 'https://portfolio.aquryu.space';
