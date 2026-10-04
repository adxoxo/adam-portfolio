// Circuit board layout for the project map. Pure and deterministic: the same
// project list always gives the same board. Placement comes from the cluster and
// the CMS sort order, never from the old map_x / map_y percentages.
//
// Geometry rules (checked by the QA script against the rendered paths):
// - every node and cluster is an axis-aligned rectangle,
// - every trace is a polyline of horizontal and vertical segments only,
// - nodes sit in grid slots inside their cluster box, so they cannot overlap,
// - traces run in the gaps between rows and in the box padding, never over a node.

import type { Cluster } from '~/lib/data/projects';

export type Variant = 'wide' | 'tall2' | 'tall1';
export type Pt = [number, number];

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface MapItem {
	id: string;
	title: string;
	cluster: Cluster;
	meta: string;
	selected: boolean;
	muted: boolean;
}

export interface MapNode extends MapItem {
	rect: Rect;
	delay: number;
}

export interface MapCluster {
	id: Cluster;
	label: string;
	count: number;
	rect: Rect;
	delay: number;
}

export interface Trace {
	id: string;
	kind: 'cluster' | 'node';
	cluster: Cluster;
	d: string;
	length: number;
	delay: number;
	duration: number;
}

export interface Via {
	x: number;
	y: number;
}

export interface Pad {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface Pin {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	on: boolean;
}

export interface CircuitLayout {
	variant: Variant;
	width: number;
	height: number;
	header: number;
	chip: Rect;
	pins: Pin[];
	clusters: MapCluster[];
	nodes: MapNode[];
	traces: Trace[];
	vias: Via[];
	pads: Pad[];
}

interface Spec {
	nodeW: number;
	nodeH: number;
	gx: number;
	gy: number;
	header: number;
	padBus: number;
	padOther: number;
	padBottom: number;
}

const r = (n: number) => Math.round(n * 10) / 10;

/** Removes repeated and collinear points so each path is the minimal polyline. */
function simplify(points: Pt[]): Pt[] {
	const out: Pt[] = [];
	for (const p of points) {
		const last = out[out.length - 1];
		if (last && last[0] === p[0] && last[1] === p[1]) continue;
		if (out.length >= 2) {
			const a = out[out.length - 2];
			const b = out[out.length - 1];
			if ((a[0] === b[0] && b[0] === p[0]) || (a[1] === b[1] && b[1] === p[1])) {
				out[out.length - 1] = p;
				continue;
			}
		}
		out.push(p);
	}
	return out;
}

function toPath(points: Pt[]): { d: string; length: number } {
	const pts = simplify(points.map(([x, y]) => [r(x), r(y)] as Pt));
	let length = 0;
	for (let i = 1; i < pts.length; i++) {
		length += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
	}
	const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
	return { d, length: Math.round(length) };
}

// Small deterministic hash so pulse timing differs per node without randomness.
function hash(s: string): number {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return (h >>> 0) / 4294967295;
}

interface Box {
	cluster: Cluster;
	label: string;
	items: MapItem[];
	cols: number;
	rows: number;
	w: number;
	h: number;
	busSide: 'left' | 'right';
}

function measure(spec: Spec, cluster: Cluster, label: string, items: MapItem[], cols: number, busSide: Box['busSide']): Box {
	const c = Math.max(1, Math.min(cols, items.length || 1));
	const rows = Math.max(1, Math.ceil(items.length / c));
	return {
		cluster,
		label,
		items,
		cols: c,
		rows,
		busSide,
		w: spec.padBus + c * spec.nodeW + (c - 1) * spec.gx + spec.padOther,
		h: spec.header + rows * (spec.nodeH + spec.gy) + spec.padBottom
	};
}

interface Placed {
	cluster: MapCluster;
	nodes: MapNode[];
	port: Pt;
	nodeTraces: { id: string; points: Pt[] }[];
	junctions: Pt[];
	pads: Pad[];
}

/** Places a measured box at (x, y) and routes its internal bus. */
function place(spec: Spec, box: Box, x: number, y: number, clusterIndex: number): Placed {
	const busX = box.busSide === 'left' ? x + spec.padBus / 2 : x + box.w - spec.padBus / 2;
	const portY = y + spec.header / 2;
	const port: Pt = [box.busSide === 'left' ? x : x + box.w, portY];
	const rowTop = (row: number) => y + spec.header + spec.gy + row * (spec.nodeH + spec.gy);
	const nodes: MapNode[] = [];
	const nodeTraces: { id: string; points: Pt[] }[] = [];
	const junctions: Pt[] = [port];
	const pads: Pad[] = [];
	box.items.forEach((item, i) => {
		const row = Math.floor(i / box.cols);
		const slot = i % box.cols;
		// fill from the bus side, so the first project sits nearest the bus
		const col = box.busSide === 'left' ? slot : box.cols - 1 - slot;
		const nx = box.busSide === 'left' ? x + spec.padBus + col * (spec.nodeW + spec.gx) : x + spec.padOther + col * (spec.nodeW + spec.gx);
		const ny = rowTop(row);
		const rect = { x: r(nx), y: r(ny), w: spec.nodeW, h: spec.nodeH };
		const cx = nx + spec.nodeW / 2;
		const channel = ny - spec.gy / 2;
		nodes.push({ ...item, rect, delay: r(0.35 + clusterIndex * 0.12 + row * 0.07 + slot * 0.04) });
		nodeTraces.push({
			id: item.id,
			points: [port, [busX, portY], [busX, channel], [cx, channel], [cx, ny]]
		});
		junctions.push([busX, channel]);
		pads.push({ x: r(cx - 6), y: r(ny - 3), w: 12, h: 6 });
	});
	return {
		cluster: {
			id: box.cluster,
			label: box.label,
			count: box.items.length,
			rect: { x: r(x), y: r(y), w: r(box.w), h: r(box.h) },
			delay: r(0.15 + clusterIndex * 0.12)
		},
		nodes,
		port,
		nodeTraces,
		junctions,
		pads
	};
}

function chipPins(chip: Rect, step: number, len: number, on: Pt[]): Pin[] {
	const pins: Pin[] = [];
	const isOn = (x: number, y: number) => on.some(([px, py]) => Math.abs(px - x) < 0.5 && Math.abs(py - y) < 0.5);
	for (let y = chip.y + step; y < chip.y + chip.h - step / 2; y += step) {
		pins.push({ x1: chip.x - len, y1: y, x2: chip.x, y2: y, on: isOn(chip.x, y) });
		pins.push({ x1: chip.x + chip.w, y1: y, x2: chip.x + chip.w + len, y2: y, on: isOn(chip.x + chip.w, y) });
	}
	for (let x = chip.x + step; x < chip.x + chip.w - step / 2; x += step) {
		pins.push({ x1: x, y1: chip.y - len, x2: x, y2: chip.y, on: false });
		pins.push({ x1: x, y1: chip.y + chip.h, x2: x, y2: chip.y + chip.h + len, on: false });
	}
	return pins;
}

function finish(variant: Variant, header: number, width: number, height: number, chip: Rect, pinStep: number, placed: Placed[], clusterRoutes: { cluster: Cluster; points: Pt[] }[]): CircuitLayout {
	const traces: Trace[] = [];
	const viaSet = new Map<string, Via>();
	const addVia = ([x, y]: Pt) => viaSet.set(`${r(x)}:${r(y)}`, { x: r(x), y: r(y) });
	const routeOf = new Map(clusterRoutes.map((c) => [c.cluster, c.points]));
	for (const c of clusterRoutes) {
		const { d, length } = toPath(c.points);
		const idx = placed.findIndex((p) => p.cluster.id === c.cluster);
		traces.push({ id: `bus-${c.cluster}`, kind: 'cluster', cluster: c.cluster, d, length, delay: r(0.1 + idx * 0.12), duration: r(Math.min(3.2, Math.max(1.6, length / 220))) });
		simplify(c.points).slice(1).forEach(addVia);
	}
	for (const p of placed) {
		const head = routeOf.get(p.cluster.id) ?? [];
		p.junctions.forEach(addVia);
		for (const t of p.nodeTraces) {
			// the pulse travels the whole way: chip pin to the cluster port to the node
			const { d, length } = toPath([...head, ...t.points]);
			const h = hash(t.id);
			traces.push({
				id: t.id,
				kind: 'node',
				cluster: p.cluster.id,
				d,
				length,
				delay: r(h * 3.5),
				duration: r(Math.min(5.5, Math.max(2.4, length / 200)) + h * 0.8)
			});
		}
	}
	const on = clusterRoutes.map((c) => c.points[0]);
	return {
		variant,
		header,
		width: Math.round(width),
		height: Math.round(height),
		chip,
		pins: chipPins(chip, pinStep, 9, on),
		clusters: placed.map((p) => p.cluster),
		nodes: placed.flatMap((p) => p.nodes),
		traces,
		vias: [...viaSet.values()],
		pads: placed.flatMap((p) => p.pads)
	};
}

const WIDE: Spec = { nodeW: 184, nodeH: 64, gx: 20, gy: 26, header: 40, padBus: 30, padOther: 16, padBottom: 16 };

/** Desktop board: two cluster columns around a central chip. */
function wide(groups: { cluster: Cluster; label: string; items: MapItem[] }[]): CircuitLayout {
	const s = WIDE;
	const margin = 36;
	const stackGap = 48;
	const chip: Rect = { x: 0, y: 0, w: 188, h: 132 };
	const channel = chip.w + 2 * 56;
	// left column gets the first and third cluster, right column the second and fourth:
	// with the default order that is ai + automation left, full-stack + embedded right.
	const left = groups.filter((_, i) => i % 2 === 0).map((g) => measure(s, g.cluster, g.label, g.items, 2, 'right'));
	const right = groups.filter((_, i) => i % 2 === 1).map((g) => measure(s, g.cluster, g.label, g.items, 3, 'left'));
	const colH = (col: Box[]) => col.reduce((h, b) => h + b.h, 0) + Math.max(0, col.length - 1) * stackGap;
	const leftW = Math.max(0, ...left.map((b) => b.w));
	const rightW = Math.max(0, ...right.map((b) => b.w));
	const innerH = Math.max(colH(left), colH(right), chip.h + 80);
	const width = margin * 2 + leftW + channel + rightW;
	const height = margin * 2 + innerH;
	chip.x = margin + leftW + (channel - chip.w) / 2;
	chip.y = margin + (innerH - chip.h) / 2;
	const cy = chip.y + chip.h / 2;
	const pinStep = 22;
	const placed: Placed[] = [];
	const routes: { cluster: Cluster; points: Pt[] }[] = [];
	const layoutColumn = (col: Box[], side: 'left' | 'right') => {
		let y = margin + (innerH - colH(col)) / 2;
		col.forEach((box, i) => {
			// boxes hug the channel so traces stay short
			const x = side === 'left' ? margin + leftW - box.w : margin + leftW + channel;
			const order = groups.findIndex((g) => g.cluster === box.cluster);
			const p = place(s, box, x, y, order);
			placed.push(p);
			// upper box takes the pin above centre, lower box the pin below it
			const pinY = cy + (i === 0 && col.length > 1 ? -pinStep : col.length > 1 ? pinStep : 0);
			const pinX = side === 'left' ? chip.x : chip.x + chip.w;
			const midX = side === 'left' ? (x + box.w + chip.x) / 2 : (chip.x + chip.w + x) / 2;
			routes.push({ cluster: box.cluster, points: [[pinX, pinY], [midX, pinY], [midX, p.port[1]], p.port] });
			y += box.h + stackGap;
		});
	};
	layoutColumn(left, 'left');
	layoutColumn(right, 'right');
	placed.sort((a, b) => groups.findIndex((g) => g.cluster === a.cluster.id) - groups.findIndex((g) => g.cluster === b.cluster.id));
	routes.sort((a, b) => groups.findIndex((g) => g.cluster === a.cluster) - groups.findIndex((g) => g.cluster === b.cluster));
	return finish('wide', s.header, width, height, chip, pinStep, placed, routes);
}

/** Phone and tablet board: chip on top, clusters stacked on a left trunk. */
function tall(groups: { cluster: Cluster; label: string; items: MapItem[] }[], variant: 'tall1' | 'tall2'): CircuitLayout {
	const width = variant === 'tall1' ? 340 : 680;
	const cols = variant === 'tall1' ? 1 : 2;
	const trunkX = 14;
	const boxX = 30;
	const boxW = width - boxX - 10;
	const base = { gx: 18, gy: 22, header: 38, padBus: 26, padOther: 12, padBottom: 12, nodeH: 64 };
	const nodeW = Math.floor((boxW - base.padBus - base.padOther - (cols - 1) * base.gx) / cols);
	const s: Spec = { ...base, nodeW };
	const chip: Rect = { x: 0, y: 22, w: Math.min(236, width - 96), h: 92 };
	chip.x = Math.round((width - chip.w) / 2);
	const pinStep = 23;
	const pinY = chip.y + pinStep * 2;
	let y = chip.y + chip.h + 44;
	const placed: Placed[] = [];
	const routes: { cluster: Cluster; points: Pt[] }[] = [];
	groups.forEach((g, i) => {
		const box = measure(s, g.cluster, g.label, g.items, cols, 'left');
		const p = place(s, box, boxX, y, i);
		placed.push(p);
		routes.push({ cluster: g.cluster, points: [[chip.x, pinY], [trunkX, pinY], [trunkX, p.port[1]], p.port] });
		y += box.h + 28;
	});
	return finish(variant, s.header, width, y + 4, chip, pinStep, placed, routes);
}

export const CLUSTER_ORDER: Cluster[] = ['ai', 'fullstack', 'automation', 'embedded'];

export function layoutCircuit(items: MapItem[], labels: Record<Cluster, string>) {
	const groups = CLUSTER_ORDER.map((cluster) => ({ cluster, label: labels[cluster], items: items.filter((p) => p.cluster === cluster) })).filter(
		(g) => g.items.length > 0
	);
	return {
		wide: wide(groups),
		tall2: tall(groups, 'tall2'),
		tall1: tall(groups, 'tall1')
	};
}
