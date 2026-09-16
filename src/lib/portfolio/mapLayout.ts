// Pure layout for the project map. Everything is computed in SVG user units,
// so the map scales with its container through the viewBox and no DOM
// measurement is needed. Text widths are estimated from character counts.
// Every layout takes the project list it should draw, so the map follows the
// list the server returned (approved content plus database media).
import { PROJECTS, SERVICES, projectsOf, type Project, type Service, type ServiceId } from './data';

export interface MapNode {
	id: string;
	kind: 'root' | 'hub' | 'project';
	x: number; // centre
	y: number;
	w: number;
	h: number;
	label: string;
	svc?: ServiceId;
	count?: number;
	featured?: boolean;
	projectId?: string;
}
export interface MapWire {
	id: string;
	d: string;
	svc: ServiceId | 'root';
}
export interface MapLayout {
	w: number;
	h: number;
	nodes: MapNode[];
	wires: MapWire[];
}
interface Link {
	a: string;
	b: string;
	svc: ServiceId | 'root';
	side: number; // which way a curved wire bows, 0 = elbow
}

const ROOT = { w: 128, h: 44 };
const HUB_H = 36;
const PROJ_H = 34;

// Work Sans 13px averages ~7.1px per character, Sora 600 13px ~8px
const projW = (p: Project) => Math.round(p.title.length * 7.1 + 30 + (p.media ? 12 : 0));
const hubW = (s: Service) => Math.round(s.short.length * 8 + 62);
const r = (n: number) => Math.round(n * 10) / 10;
const rad = (deg: number) => (deg * Math.PI) / 180;

function rootNode(x: number, y: number): MapNode {
	return { id: 'root', kind: 'root', x, y, w: ROOT.w, h: ROOT.h, label: 'adam' };
}
function hubNode(s: Service, x: number, y: number, list: Project[]): MapNode {
	return { id: 'hub:' + s.id, kind: 'hub', x, y, w: hubW(s), h: HUB_H, label: s.short, svc: s.id, count: projectsOf(s.id, list).length };
}
function projNode(p: Project, x: number, y: number): MapNode {
	return { id: 'p:' + p.id, kind: 'project', x, y, w: projW(p), h: PROJ_H, label: p.title, svc: p.service, featured: !!p.media, projectId: p.id };
}

// all services: a radial map around adam. hubs sit on a ring, each service's
// projects fan outward from its hub. Side fans spread vertically, the top and
// bottom fans spread horizontally, because the pills are wide and short.
function radial(list: Project[]): MapLayout {
	const R1 = 150;
	// angle of each hub on the ring, plus how far its fan reaches (x, y) and how wide it opens
	// (c = the direction the fan opens towards, when it differs from the hub angle)
	const fans: Record<ServiceId, { a: number; c?: number; rx: number; ry: number; fan: number }> = {
		websites: { a: -90, rx: 250, ry: 130, fan: 46 },
		ai: { a: -18, rx: 150, ry: 130, fan: 46 },
		automation: { a: 54, c: 40, rx: 250, ry: 130, fan: 52 },
		apps: { a: 126, c: 140, rx: 250, ry: 130, fan: 52 },
		devices: { a: 198, rx: 150, ry: 130, fan: 46 }
	};
	const nodes: MapNode[] = [rootNode(0, 0)];
	const links: Link[] = [];
	for (const s of SERVICES) {
		const { a, c = a, rx, ry, fan } = fans[s.id];
		const hub = hubNode(s, Math.cos(rad(a)) * R1 * 1.25, Math.sin(rad(a)) * R1, list);
		nodes.push(hub);
		links.push({ a: 'root', b: hub.id, svc: 'root', side: 1 });
		const ps = projectsOf(s.id, list);
		ps.forEach((p, i) => {
			const pa = c + (i - (ps.length - 1) / 2) * fan;
			const n = projNode(p, hub.x + Math.cos(rad(pa)) * rx, hub.y + Math.sin(rad(pa)) * ry);
			nodes.push(n);
			links.push({ a: hub.id, b: n.id, svc: s.id, side: i % 2 ? -1 : 1 });
		});
	}
	return frame(nodes, links, 24);
}

// one service: adam on the left, the hub in the middle, the projects fanned
// on the right. Tidy and readable, with the same node ids as the radial map.
function focused(svc: ServiceId, list: Project[]): MapLayout {
	const s = SERVICES.find((x) => x.id === svc)!;
	const ps = projectsOf(svc, list);
	const hub = hubNode(s, 270, 0, list);
	const nodes = [rootNode(0, 0), hub];
	const links: Link[] = [{ a: 'root', b: hub.id, svc: 'root', side: 1 }];
	ps.forEach((p, i) => {
		const t = i - (ps.length - 1) / 2;
		const n = projNode(p, 560 - Math.abs(t) * 26, t * 74);
		nodes.push(n);
		links.push({ a: hub.id, b: n.id, svc, side: t < 0 ? -1 : 1 });
	});
	return frame(nodes, links, 24);
}

// narrow screens: one trunk, hubs on the trunk, projects branch off it
function tree(svc: ServiceId | 'all', list: Project[]): MapLayout {
	const W = 400, spine = 22, indent = 44, gap = 10;
	const nodes: MapNode[] = [];
	const links: Link[] = [];
	let y = ROOT.h / 2;
	nodes.push(rootNode(spine + ROOT.w / 2, y));
	y += ROOT.h / 2 + 26;
	const services = svc === 'all' ? SERVICES : SERVICES.filter((s) => s.id === svc);
	for (const s of services) {
		const hub = hubNode(s, 0, y + HUB_H / 2, list);
		hub.x = spine + hub.w / 2 + 12;
		nodes.push(hub);
		links.push({ a: 'root', b: hub.id, svc: 'root', side: 0 });
		y += HUB_H + gap;
		for (const p of projectsOf(s.id, list)) {
			const w = Math.min(projW(p), W - indent - 8);
			const n = projNode(p, indent + w / 2, y + PROJ_H / 2);
			n.w = w;
			nodes.push(n);
			links.push({ a: hub.id, b: n.id, svc: s.id, side: 0 });
			y += PROJ_H + gap;
		}
		y += 22;
	}
	return { w: W, h: Math.round(y), nodes, wires: wiresFrom(nodes, links, spine) };
}

// gently bowed curve between two centres
function bow(a: MapNode, b: MapNode, side: number): string {
	const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
	const dx = b.x - a.x, dy = b.y - a.y;
	const k = 0.16 * side;
	return `M ${r(a.x)} ${r(a.y)} Q ${r(mx - dy * k)} ${r(my + dx * k)} ${r(b.x)} ${r(b.y)}`;
}
// elbow down the trunk and across to the node
function elbow(a: MapNode, b: MapNode, spine: number): string {
	return `M ${spine} ${r(a.y + a.h / 2)} V ${r(b.y)} H ${r(b.x - b.w / 2)}`;
}
function wiresFrom(nodes: MapNode[], links: Link[], spine = 0): MapWire[] {
	const byId = new Map(nodes.map((n) => [n.id, n]));
	return links.map((l) => {
		const a = byId.get(l.a)!, b = byId.get(l.b)!;
		return { id: 'w:' + l.b, d: l.side === 0 ? elbow(a, b, spine) : bow(a, b, l.side), svc: l.svc };
	});
}

// shift everything so the bounding box starts at (0,0) with a margin. The wide
// layouts keep a free column on the right for the zoom / motion controls.
const CONTROLS_COLUMN = 64;
function frame(nodes: MapNode[], links: Link[], m: number): MapLayout {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	for (const n of nodes) {
		minX = Math.min(minX, n.x - n.w / 2);
		maxX = Math.max(maxX, n.x + n.w / 2);
		minY = Math.min(minY, n.y - n.h / 2);
		maxY = Math.max(maxY, n.y + n.h / 2);
	}
	const shifted = nodes.map((n) => ({ ...n, x: r(n.x + m - minX), y: r(n.y + m - minY) }));
	return { w: Math.round(maxX - minX + 2 * m + CONTROLS_COLUMN), h: Math.round(maxY - minY + 2 * m), nodes: shifted, wires: wiresFrom(shifted, links) };
}

export function layoutFor(svc: ServiceId | 'all', narrow: boolean, list: Project[] = PROJECTS): MapLayout {
	if (narrow) return tree(svc, list);
	return svc === 'all' ? radial(list) : focused(svc, list);
}

// self-check used by tests/layout-check.mjs: overlapping node pairs
export function overlaps(l: MapLayout): [string, string][] {
	const out: [string, string][] = [];
	for (let i = 0; i < l.nodes.length; i++)
		for (let j = i + 1; j < l.nodes.length; j++) {
			const a = l.nodes[i], b = l.nodes[j];
			if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 6 && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + 6) out.push([a.id, b.id]);
		}
	return out;
}
