import { component$ } from '@qwik.dev/core';

// Minimal geometric glyphs (24px grid, square caps and miter joins to match the
// square architecture). Decorative: every control that uses one has a text label.

const S = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'square', 'stroke-linejoin': 'miter' } as const;

export type IconName =
	| 'play'
	| 'pause'
	| 'sound'
	| 'muted'
	| 'full'
	| 'close'
	| 'plus'
	| 'minus'
	| 'ext'
	| 'mail'
	| 'calendar'
	| 'up'
	| 'retry'
	| 'download';

export const Icon = component$<{ name: IconName }>(({ name }) => (
	<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		{name === 'play' && <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />}
		{name === 'pause' && <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none" />}
		{name === 'sound' && <path {...S} d="M4 9.5h4L13 5v14l-5-4.5H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" />}
		{name === 'muted' && <path {...S} d="M4 9.5h4L13 5v14l-5-4.5H4zM16.5 9.5l5 5M21.5 9.5l-5 5" />}
		{name === 'full' && <path {...S} d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />}
		{name === 'close' && <path {...S} d="M5.5 5.5l13 13M18.5 5.5l-13 13" />}
		{name === 'plus' && <path {...S} d="M12 5v14M5 12h14" />}
		{name === 'minus' && <path {...S} d="M5 12h14" />}
		{name === 'ext' && <path {...S} d="M8 6h10v10M18 6L6 18" />}
		{name === 'mail' && <path {...S} d="M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5" />}
		{name === 'calendar' && <path {...S} d="M4 6h16v14H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4" />}
		{name === 'up' && <path {...S} d="M12 19V5M6 11l6-6 6 6" />}
		{name === 'retry' && <path {...S} d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4" />}
		{name === 'download' && <path {...S} d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />}
	</svg>
));
