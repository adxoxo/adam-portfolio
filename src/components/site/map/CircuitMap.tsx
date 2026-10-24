import { $, component$, sync$, useContext } from '@qwik.dev/core';
import { CLUSTER_LABEL } from '~/lib/data/projects';
import { LEADFLOW_LABEL } from '~/lib/data/leadflow';
import type { ViewProject } from '~/lib/data/presentation';
import { projectPath, slugForId } from '~/lib/seo';
import { SiteStateCtx, type SiteState } from '../state';
import { openProject } from '../runtime/dialogs';
import { Icon } from '../icons';
import { CLUSTER_ORDER, layoutCircuit, type CircuitLayout, type MapItem, type Rect } from './layout';

const pct = (r: Rect, L: CircuitLayout) => ({
	left: `${(r.x / L.width) * 100}%`,
	top: `${(r.y / L.height) * 100}%`,
	width: `${(r.w / L.width) * 100}%`,
	height: `${(r.h / L.height) * 100}%`
});

function toItem(p: ViewProject): MapItem {
	// company work names the company in the metadata line; the green outline still marks selected work
	const company = p.labels.includes(LEADFLOW_LABEL);
	const tag = company ? (p.year ? 'Lead Flow' : LEADFLOW_LABEL) : p.selected ? 'selected work' : p.labels[0] ?? '';
	return {
		id: p.id,
		title: p.title,
		cluster: p.cluster,
		meta: [p.year, tag].filter(Boolean).join(', '),
		selected: p.selected,
		muted: p.labels.includes('past project') || p.labels.includes('design concept')
	};
}

const preventPlainProjectClick = sync$((event: MouseEvent) => {
	if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) event.preventDefault();
});

/** Replays the press effect on a node, then opens its project dialog. */
function openNode(state: SiteState, el: HTMLElement, projectId: string, openerId: string) {
	el.classList.remove('hit');
	void el.offsetWidth;
	el.classList.add('hit');
	return openProject(state, projectId, openerId);
}

/** One electrical packet: halo, green body and a white leading core on the same
 *  trace path. The shared custom properties sit on the group. The negative delay
 *  starts each packet mid-run at its own phase, so the board shows staggered
 *  packets at once. */
const Packet = component$<{ t: CircuitLayout['traces'][number] }>(({ t }) => {
	const phase = -Math.round(t.duration * ((t.delay * 2.718 + 0.37) % 1) * 100) / 100;
	return (
		<g class="pkt" style={{ '--len': t.length, '--dur': `${t.duration}s`, '--delay': `${phase}s` }}>
			<path class="pulse pulse-halo" d={t.d} />
			<path class="pulse pulse-body" d={t.d} />
			<path class="pulse pulse-core" d={t.d} />
		</g>
	);
});

const Board = component$<{ L: CircuitLayout; total: number }>(({ L, total }) => {
	const state = useContext(SiteStateCtx);
	const byCluster = CLUSTER_ORDER.map((c) => ({
		cluster: L.clusters.find((x) => x.id === c),
		nodes: L.nodes.filter((n) => n.cluster === c),
		traces: L.traces.filter((t) => t.kind === 'node' && t.cluster === c)
	})).filter((g) => g.cluster);
	return (
		<div class="board" data-v={L.variant} data-bw={L.width} data-bh={L.height} style={{ '--bw': L.width, '--bh': L.height }}>
			<svg viewBox={`0 0 ${L.width} ${L.height}`} aria-hidden="true" focusable="false">
				{L.clusters.map((c) => (
					<g key={c.id} style={{ '--d': `${c.delay}s` }}>
						<rect class="c-frame" x={c.rect.x} y={c.rect.y} width={c.rect.w} height={c.rect.h} />
						<rect class="c-head" x={c.rect.x + 1} y={c.rect.y + 1} width={c.rect.w - 2} height={L.header - 2} />
					</g>
				))}
				{L.traces.map((t) => (
					<path key={t.id} class={t.kind === 'cluster' ? 'trace bus' : 'trace'} data-t={t.id} d={t.d} style={{ '--len': t.length, '--d': `${t.delay * 0.5}s` }} />
				))}
				{L.pins.map((p, i) => (
					<line key={i} class={p.on ? 'pin on' : 'pin'} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
				))}
				<rect class="chip-body" x={L.chip.x} y={L.chip.y} width={L.chip.w} height={L.chip.h} />
				<rect class="chip-rim" x={L.chip.x + 6} y={L.chip.y + 6} width={L.chip.w - 12} height={L.chip.h - 12} />
				<circle class="chip-dot" cx={L.chip.x + 14} cy={L.chip.y + 14} r={2.5} />
				{L.pads.map((p, i) => (
					<rect key={i} class="pad" x={p.x} y={p.y} width={p.w} height={p.h} />
				))}
				{L.vias.map((v, i) => (
					<circle key={i} class="via" cx={v.x} cy={v.y} r={3.5} />
				))}
				<g class="pulses" data-c="bus">
					{L.traces
						.filter((t) => t.kind === 'cluster')
						.map((t) => (
							<Packet key={t.id} t={t} />
						))}
				</g>
				{byCluster.map((g) => (
					<g key={g.cluster!.id} class="pulses" data-c={g.cluster!.id}>
						{g.traces.map((t) => (
							<Packet key={t.id} t={t} />
						))}
					</g>
				))}
			</svg>
			<div class="chip-node" style={pct(L.chip, L)}>
				<img src="/brand/dragon-field.webp" alt="" width={160} height={200} loading="lazy" />
				<div>
					<strong>Adam</strong>
					<span>
						<b>{total}</b> projects
					</span>
				</div>
			</div>
			<div data-zone="bus" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
			{byCluster.map((g) => {
				const c = g.cluster!;
				const labelId = `map-${L.variant}-${c.id}`;
				return (
					<div key={c.id} role="group" aria-labelledby={labelId}>
						<div data-zone={c.id} style={{ position: 'absolute', pointerEvents: 'none', ...pct(c.rect, L) }} />
						<p
							id={labelId}
							class="c-label"
							data-c={c.id}
							style={{ ...pct({ x: c.rect.x + (L.variant === 'wide' && c.rect.x < L.chip.x ? 0 : 26), y: c.rect.y, w: c.rect.w - 30, h: L.header }, L), '--d': `${c.delay}s` }}
						>
							{c.label} <b>{c.count}</b>
						</p>
						{g.nodes.map((n) => {
							const id = `map-${L.variant}-${n.id}`;
							const slug = slugForId(n.id);
							const cls = ['cnode', n.selected && 'sel', n.muted && 'muted'];
							const style = { ...pct(n.rect, L), '--d': `${n.delay}s` };
							// decorative ring clip for the moving gold outline of selected work
							const gold = n.selected && <span class="gold" aria-hidden="true" />;
							// projects with a case page are real links, so crawlers and modified
							// clicks reach the page; a plain click opens the same dialog
							return slug ? (
								<a
									key={n.id}
									id={id}
									class={cls}
									href={projectPath(slug)}
									data-id={n.id}
									data-c={n.cluster}
									style={style}
									onClick$={[
										preventPlainProjectClick,
										$((event: MouseEvent, el: HTMLAnchorElement) => {
											if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
											return openNode(state, el, n.id, id);
										})
									]}
								>
									<span class="t">{n.title}</span>
									<span class="m">{n.meta}</span>
									{gold}
								</a>
							) : (
								<button
									key={n.id}
									type="button"
									id={id}
									class={cls}
									data-id={n.id}
									data-c={n.cluster}
									style={style}
									onClick$={(_, el) => openNode(state, el, n.id, id)}
								>
									<span class="t">{n.title}</span>
									<span class="m">{n.meta}</span>
									{gold}
								</button>
							);
						})}
					</div>
				);
			})}
		</div>
	);
});

/** Dark circuit board of every project: Adam is the central chip, each cluster
 *  is a box of rectangular nodes, and every trace runs straight or at 90 degrees. */
export const CircuitMap = component$<{ projects: ViewProject[] }>(({ projects }) => {
	const items = projects.map(toItem);
	const boards = layoutCircuit(items, CLUSTER_LABEL);
	const counts = CLUSTER_ORDER.map((c) => ({ c, n: items.filter((i) => i.cluster === c).length })).filter((x) => x.n > 0);
	const selected = items.filter((i) => i.selected).length;
	return (
		<div class="map-view" id="map-view" role="region" aria-labelledby="map-h">
			<h2 id="map-h" class="sr-only">
				Project map, {projects.length} projects
			</h2>
			<div class="map-grid" aria-hidden="true" />
			<div class="map-top">
				<p class="map-title">
					Project map <b>{projects.length}</b> projects
				</p>
				<nav class="jump" aria-label="Jump to a cluster">
					{counts.map(({ c, n }) => (
						<button key={c} type="button" data-jump={c}>
							{CLUSTER_LABEL[c]} <b>{n}</b>
						</button>
					))}
				</nav>
			</div>
			<div class="map-port" tabIndex={0} aria-label="Project board. Scroll or drag to pan">
				<div class="map-pad">
					<Board L={boards.tall1} total={projects.length} />
					<Board L={boards.tall2} total={projects.length} />
					<Board L={boards.wide} total={projects.length} />
				</div>
			</div>
			<details class="legend">
				<summary>
					Legend <b>{projects.length}</b>
				</summary>
				<ul>
					<li>
						<i class="lg-node" />
						Selected work, {selected}
					</li>
					<li>
						<i class="lg-node plain" />
						Other project, {projects.length - selected}
					</li>
					<li>
						<i class="lg-node dash" />
						Past project or design concept
					</li>
					<li>
						<i class="lg-via" />
						Via, where a trace changes layer or joins a bus
					</li>
					<li>
						<i class="lg-pulse" />
						Current, moving from Adam to a project
					</li>
				</ul>
			</details>
			<p class="map-hint">Drag to pan. Ctrl or Cmd and scroll to zoom. Esc returns home.</p>
			<div class="map-ctl">
				<button type="button" data-zoom="out" aria-label="Zoom out">
					<Icon name="minus" />
				</button>
				<button type="button" data-zoom="in" aria-label="Zoom in">
					<Icon name="plus" />
				</button>
				<button type="button" class="fit" data-zoom="fit" title="Fit the board to the screen">
					Fit <span data-zoom-level>100%</span>
				</button>
			</div>
		</div>
	);
});
