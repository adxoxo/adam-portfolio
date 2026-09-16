// Checks that no two map nodes overlap in any layout, and that the database
// overlay keeps the approved titles. Run: node tests/layout-check.mjs
// (copies the pure modules to a scratch dir so node can strip the types)
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const here = new URL('.', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'layout-'));
const src = (f) => readFileSync(join(here, '../src/lib/portfolio', f), 'utf8').replace("from './data'", "from './data.ts'");
writeFileSync(join(dir, 'data.ts'), src('data.ts'));
writeFileSync(join(dir, 'mapLayout.ts'), src('mapLayout.ts'));
writeFileSync(join(dir, 'merge.ts'), src('merge.ts'));
const { layoutFor, overlaps } = await import(join(dir, 'mapLayout.ts'));
const { withProjectMedia } = await import(join(dir, 'merge.ts'));
const { PROJECTS } = await import(join(dir, 'data.ts'));
let bad = 0;

// the overlay: old ids map onto approved projects, titles never change, media and links come through
const rows = [
	{ id: 'tq_chatbot', title: 'tq chatbot', loom_id: 'loom-aq', github_url: 'https://github.com/adxoxo/chatbot-closer' },
	{ id: 'carwash', title: 'invoice automation (old)', live_url: 'https://example.invalid/carwash' },
	{ id: 'booking_invoice', title: 'booking-to-invoice flow', github_url: 'https://github.com/example/private' },
	{ id: 'almanac', title: 'almanac', live_url: 'https://almanac.example' },
	{ id: 'goatedtracking', cover_image: 'https://example.invalid/goat.png' },
	{ id: 'vault', github_url: 'https://github.com/adxoxo/aquryu-vault-renamed', live_url: 'javascript:alert(1)', loom_id: '../evil' },
	{ id: 'standup', github_url: '   ', cover_image: 'not a url' }
];
const merged = withProjectMedia(rows, PROJECTS);
const by = (id) => merged.find((p) => p.id === id);
const expect = (ok, msg) => { console.log((ok ? 'ok   ' : 'FAIL ') + msg); if (!ok) bad++; };
expect(merged.length === PROJECTS.length && merged.every((p, i) => p.title === PROJECTS[i].title), 'overlay keeps the fifteen approved titles and order');
expect(by('aq_chatbot').media?.kind === 'embed' && by('aq_chatbot').media.id === 'loom-aq', 'tq_chatbot row supplies the aq chatbot loom id');
expect(by('invoice_automation').live === 'https://example.invalid/carwash' && by('invoice_automation').media?.kind === 'illustration', 'carwash row supplies a live url, the illustration stays');
expect(by('booking_invoice').github === 'https://github.com/example/private' && by('booking_invoice').flow === 'booking', 'a row fills an empty github link without touching the workflow diagram');
expect(by('goat').media?.kind === 'image' && by('goat').media.src === 'https://example.invalid/goat.png', 'goatedtracking row supplies a cover image');
expect(!merged.some((p) => p.id === 'almanac'), 'a row with no approved project is ignored');
expect(withProjectMedia([], PROJECTS).every((p, i) => p === PROJECTS[i]), 'no rows: the approved list is returned unchanged');
expect(by('vault').github === 'https://github.com/adxoxo/aquryu-vault-renamed', 'a managed github url replaces the approved one (admin edits win)');
expect(by('vault').live === undefined && by('vault').media === undefined, 'a javascript: live url and a malformed loom id are dropped');
expect(by('standup').github === PROJECTS.find((p) => p.id === 'standup').github && by('standup').media === undefined, 'an empty github url falls back to the approved link, a non-url cover is dropped');
expect(by('booking_invoice').github === 'https://github.com/example/private', 'an approved project without a public repo takes the managed url when one is set');

for (const svc of ['all', 'websites', 'ai', 'automation', 'apps', 'devices'])
	for (const narrow of [false, true]) {
		const l = layoutFor(svc, narrow, merged);
		const o = overlaps(l);
		if (o.length) bad++;
		console.log(`${svc.padEnd(11)} ${narrow ? 'narrow' : 'wide  '} ${l.w}x${l.h} nodes=${l.nodes.length} overlaps=${JSON.stringify(o)}`);
	}
if (bad) { console.error('FAIL'); process.exit(1); }
console.log('ok: overlay and layouts');
