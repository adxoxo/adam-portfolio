// Focused mobile checks against a running server: the list / map presentation
// and its history, touch targets and text sizes, the hero on a small screen,
// the demo disclosure, dialogs on short and reduced viewports, the menu, and
// the scroll lock. Same environment as tests/smoke.cjs; /api/lead and
// /api/schedule are intercepted in every context before navigation.
//   BASE_URL=http://127.0.0.1:8788 node tests/mobile.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_DIR || 'playwright');

const url = (process.env.BASE_URL || 'http://127.0.0.1:8788').replace(/\/$/, '') + '/';
const origin = new URL(url).origin;
const shots = process.env.SHOTS_DIR || path.join(require('os').tmpdir(), 'adam-portfolio-shots');
fs.mkdirSync(shots, { recursive: true });

let failures = 0;
const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) failures++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rect = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height, docTop: r.top + scrollY }; }, sel);
const hash = (page) => page.evaluate(() => location.hash);
// wait until the url hash is the expected one (Back / Forward settle asynchronously)
async function waitHash(page, want, ms = 3000) {
	for (let t = 0; t < ms / 50; t++) { if ((await hash(page)) === want) return true; await sleep(50); }
	return false;
}

// a fresh context: touch emulation below 500px, both api routes intercepted,
// console errors and requests outside the origin collected
async function open(browser, vp, extra = {}) {
	const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.width < 500, ...extra });
	const page = await ctx.newPage();
	const errors = [];
	page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
	page.on('pageerror', (e) => errors.push(String(e)));
	const external = [];
	page.on('request', (r) => { if (!r.url().startsWith(origin)) external.push(r.url()); });
	const leadPosts = [];
	const schedulePosts = [];
	await page.route('**/api/lead', (route) => { leadPosts.push(route.request().postDataJSON()); route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
	await page.route('**/api/schedule', (route) => { schedulePosts.push(route.request().postDataJSON()); route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
	return { ctx, page, errors, external, leadPosts, schedulePosts };
}
async function load(page, h = '') {
	await page.goto(url + h);
	await page.waitForSelector('.pill');
	await page.evaluate(() => document.fonts.ready);
	await sleep(350);
}

// root overflow plus the actual bounds of every visible descendant: an element
// that sticks out of the viewport width is a defect even when overflow-x: hidden
// on the body would hide the scrollbar
async function fits(page, label) {
	const m = await page.evaluate(() => {
		const w = document.documentElement.clientWidth;
		const out = [...document.querySelectorAll('.pf *')].filter((el) => {
			if (el.closest('dialog') || el.closest('.visually-hidden') || el.classList.contains('skip') || el.closest('.rotor')) return false;
			const cs = getComputedStyle(el);
			if (cs.display === 'none' || cs.visibility === 'hidden') return false;
			const r = el.getBoundingClientRect();
			return r.width > 0 && r.height > 0 && (r.left < -1 || r.right > w + 1);
		}).map((el) => el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : ''));
		return { sw: document.documentElement.scrollWidth, cw: w, out: [...new Set(out)].slice(0, 5) };
	});
	check(m.sw <= m.cw && m.out.length === 0, `${label}: no horizontal overflow and nothing outside the viewport (${m.sw} <= ${m.cw}${m.out.length ? '; outside: ' + m.out.join(' ') : ''})`);
}
// the open dialog: its content fits its width and nothing laid out sticks out sideways
async function dialogFits(page, label) {
	const m = await page.evaluate(() => {
		const d = document.querySelector('dialog[open]');
		const box = d.getBoundingClientRect();
		const out = [...d.querySelectorAll('*')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1); }).map((el) => el.tagName.toLowerCase() + '.' + [...el.classList].join('.'));
		return { sw: d.scrollWidth, cw: d.clientWidth, sl: d.scrollLeft, out: out.slice(0, 4), vw: innerWidth, vh: innerHeight, box: { top: box.top, bottom: box.bottom, left: box.left, right: box.right } };
	});
	check(m.sw <= m.cw && m.sl === 0 && m.out.length === 0 && m.box.left >= 0 && m.box.right <= m.vw && m.box.top >= 0 && m.box.bottom <= m.vh, `${label}: dialog fits its width and the viewport (scrollWidth ${m.sw} <= ${m.cw}${m.out.length ? ', outside: ' + m.out.join(' ') : ''}; box ${Math.round(m.box.top)}..${Math.round(m.box.bottom)} of ${m.vh})`);
}
// the close control sits inside the visible dialog box (not scrolled away)
async function closeVisible(page, label) {
	const m = await page.evaluate(() => {
		const d = document.querySelector('dialog[open]');
		const b = d.getBoundingClientRect(), c = d.querySelector('.close').getBoundingClientRect();
		return { ok: c.top >= b.top - 1 && c.bottom <= b.bottom + 1 && c.right <= b.right + 1 && c.width >= 44 && c.height >= 44, c: `${Math.round(c.top)}..${Math.round(c.bottom)}`, d: `${Math.round(b.top)}..${Math.round(b.bottom)}`, st: d.scrollTop };
	});
	check(m.ok, `${label}: close control inside the dialog box (close ${m.c}, dialog ${m.d}, scrollTop ${m.st})`);
}
// every element matching the selectors has a 44x44 effective box
async function targets(page, sels, label) {
	const small = await page.evaluate((list) => list.flatMap((s) => [...document.querySelectorAll(s)].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44); }).map((el) => `${s} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`)), sels);
	check(small.length === 0, `${label}: targets are >= 44x44 (${small.join('; ') || 'all fine'})`);
}
// computed font sizes at or above a minimum
async function textAtLeast(page, sels, min, label) {
	const small = await page.evaluate(([list, m]) => list.flatMap((s) => [...document.querySelectorAll(s)].filter((el) => el.getBoundingClientRect().height > 0 && parseFloat(getComputedStyle(el).fontSize) < m).map((el) => `${s} ${getComputedStyle(el).fontSize}`)), [sels, min]);
	check(small.length === 0, `${label}: text >= ${min}px (${[...new Set(small)].join('; ') || 'all fine'})`);
}

async function phone(browser, vp) {
	console.log(`\n== ${vp.name} ${vp.width}x${vp.height}`);
	const { ctx, page, errors, external, leadPosts } = await open(browser, vp);
	await load(page);

	// overview: the hero's primary action on the first screen, readable text, 44px controls
	await fits(page, 'overview');
	// the brand word: one unwrapped line (line rects of the text, not the box), not
	// clipped by its own box, next to the portrait, inside the pill, and rigid (no
	// shrink, no wrap) so a browser with wider font metrics cannot break it
	const brand = await page.evaluate(() => {
		const pill = document.querySelector('.pill').getBoundingClientRect();
		const a = document.querySelector('.pill .brand'), w = a.querySelector('.word'), i = a.querySelector('.pic');
		const b = a.getBoundingClientRect(), r = w.getBoundingClientRect(), p = i.getBoundingClientRect();
		const range = document.createRange(); range.selectNodeContents(w);
		const cs = getComputedStyle(w), as = getComputedStyle(a);
		const inside = (x, box) => x.left >= box.left - 1 && x.right <= box.right + 1 && x.top >= box.top - 1 && x.bottom <= box.bottom + 1;
		return { text: w.textContent, lines: range.getClientRects().length, visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0, unclipped: w.scrollWidth <= w.clientWidth + 1 && inside(r, b) && inside(b, pill), beside: r.left >= p.right && Math.abs((r.top + r.bottom) / 2 - (p.top + p.bottom) / 2) < 4, rigid: as.flexShrink === '0' && as.whiteSpace === 'nowrap' && cs.flexShrink === '0', w: Math.round(r.width) };
	});
	check(brand.text === 'adam' && brand.visible && brand.lines === 1 && brand.unclipped && brand.beside && brand.rigid, `brand word "adam" visible on one line, unclipped, beside the portrait, inside the pill, non-shrinking (${brand.w}px, ${brand.lines} line${brand.rigid ? '' : ', shrinkable'})`);
	const cta = await rect(page, '.hero .actions .btn');
	check(cta.docTop >= 0 && cta.docTop + cta.height <= vp.height, `primary hero action inside the first screen (ends at ${Math.round(cta.docTop + cta.height)} of ${vp.height})`);
	const words = await page.evaluate(() => [...document.querySelectorAll('.rotor .word')].map((w) => ({ t: w.textContent, lines: w.getClientRects().length, right: w.getBoundingClientRect().right })));
	check(words.length === 5 && words.every((w) => w.lines === 1 && w.right <= vp.width), `all five headline words fit on one line (${words.map((w) => w.t).join(', ')})`);
	await textAtLeast(page, ['.hero .lede', '.svc-row .desc', '.case-text dd', '.bio p', '.facts dd', '.process p', '.ways li', '#contact .lede'], 16, 'overview body text');
	await textAtLeast(page, ['.svc-row .who', '.svc-row .eg', '.quiet', '.shot-note', '.facts dt', '.ways .k', '.site-footer'], 12, 'overview supporting text');
	// the service row's button covers the whole row through its ::before, so the row is the target
	await targets(page, ['.quiet button', '.hero .actions .btn', '.demo-caption .textlink', '.svc-row', '.case .textlink', '.more .btn', '#contact .btn', '.ways a', '.links a', '.site-footer a', '.site-footer button', '.pill a', '.pill button'], 'overview controls');
	check(await page.evaluate(() => { const r = document.querySelector('.svc-row'); const b = r.getBoundingClientRect(); const el = document.elementFromPoint(b.left + b.width * 0.8, b.top + b.height * 0.8); return el?.closest('h3 button') !== null || el?.closest('.svc-row h3') !== null; }), 'a tap on the far side of a service row hits its button');
	const quietGap = await page.evaluate(() => { const b = [...document.querySelectorAll('.quiet button')]; let min = 99; for (let i = 1; i < b.length; i++) { const a = b[i - 1].getBoundingClientRect(), c = b[i].getBoundingClientRect(); if (Math.abs(a.top - c.top) < 2) min = Math.min(min, c.left - a.right); } return min; });
	check(quietGap >= 8, `jump links on one line are at least 8px apart (${quietGap}px)`);

	// demo: readable, stable across steps with the business details closed and open
	const demoBox = () => page.evaluate(() => { const r = document.querySelector('.demo').getBoundingClientRect(); const s = document.querySelector('.steps').getBoundingClientRect(); return [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height), Math.round(s.y + scrollY)].join(','); });
	check(await page.evaluate(() => getComputedStyle(document.querySelector('.lead-details')).display !== 'none' && !document.querySelector('.lead-details').open && getComputedStyle(document.querySelector('aside.lead-panel')).display === 'none'), 'business details start closed behind the disclosure');
	await textAtLeast(page, ['.chat-log .msg', '.card-booked'], 16, 'demo messages');
	await targets(page, ['.steps button', '.demo-foot .next', '.lead-details summary'], 'demo controls');
	const d0 = await demoBox();
	let stable = true;
	for (const i of [1, 2, 0, 1, 2]) { await page.locator('.steps button').nth(i).click(); await sleep(400); if ((await demoBox()) !== d0) stable = false; }
	await page.locator('.demo-foot .next').click(); await sleep(400);
	if ((await demoBox()) !== d0) stable = false;
	check(stable, `demo frame and controls identical across every step with the details closed (${d0})`);
	await page.locator('.lead-details summary').click(); await sleep(300);
	const d1 = await demoBox();
	check(d1 !== d0 && (await page.evaluate(() => document.querySelector('.lead-details').open)), 'opening the disclosure is the only thing that changes the frame');
	const rows = await page.evaluate(() => [...document.querySelectorAll('.lead-panel--mobile .lead-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
	check(rows.length === 4 && rows.every((t) => t.length > 0), `all four business rows are readable when open (${rows.map((r) => r.slice(0, 18)).join(' | ')})`);
	let stableOpen = true;
	for (const i of [1, 2, 0, 2]) { await page.locator('.steps button').nth(i).click(); await sleep(400); if ((await demoBox()) !== d1) stableOpen = false; }
	check(stableOpen, `demo frame and controls identical across every step with the details open (${d1})`);
	const clipped = await page.evaluate(() => [...document.querySelectorAll('.lead-panel--mobile, .lead-panel--mobile *')].some((el) => el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflowY !== 'visible'));
	check(!clipped, 'open business details are not clipped');
	await page.locator('.lead-details summary').click(); await sleep(300);
	check((await demoBox()) === d0, 'closing the disclosure restores the frame');
	await fits(page, 'overview after the demo');
	await page.screenshot({ path: path.join(shots, `mobile-overview-${vp.name}.png`) });

	// index: rows by default, the select filters, every row is one readable button
	await page.locator('.pill .switch button').nth(1).click();
	await page.waitForSelector('.rows');
	await sleep(300);
	check((await hash(page)) === '#index/all' && (await page.locator('.rows .row').count()) === 15 && (await page.locator('svg.map, .tree').count()) === 0, 'index opens as the list with 15 rows, no map rendered');
	await fits(page, 'index list');
	const first = await rect(page, '.rows .row');
	check(first.docTop < vp.height + 200, `the first project row starts near the first screen (${Math.round(first.docTop)}px)`);
	const rowGeom = await page.evaluate(() => [...document.querySelectorAll('.rows .row')].map((b) => { const t = b.querySelector('.row-title'), s = b.querySelector('.row-summary'); return { h: b.getBoundingClientRect().height, w: b.getBoundingClientRect().width, tfs: parseFloat(getComputedStyle(t).fontSize), sfs: parseFloat(getComputedStyle(s).fontSize), clip: t.scrollWidth > t.clientWidth + 1 || s.scrollWidth > s.clientWidth + 1, name: b.getAttribute('aria-labelledby') === t.id, pad: parseFloat(getComputedStyle(b).paddingTop) }; }));
	check(rowGeom.every((g) => g.h >= 44 && g.tfs >= 16 && g.sfs >= 16 && !g.clip && g.name && g.pad >= 12), `every row: >= 44px, 16px title and summary, unclipped, named by its title (${rowGeom.length} rows)`);
	const rowGap = await page.evaluate(() => { const r = [...document.querySelectorAll('.rows .row')]; return r[1].getBoundingClientRect().top - r[0].getBoundingClientRect().bottom; });
	check(rowGap >= 8, `rows are at least 8px apart (${rowGap}px)`);
	await textAtLeast(page, ['.rows .row-svc', '.rows .row-open', '.index-head .n', '.svc-select label'], 12, 'index metadata');
	await targets(page, ['#svc-select', '.pres button', '.rows .row', '.index-top .btn'], 'index controls');
	for (const [svc, n] of [['websites', 3], ['ai', 3], ['automation', 3], ['apps', 3], ['devices', 3]]) {
		await page.focus('#svc-select'); await page.selectOption('#svc-select', svc);
		await sleep(150);
		const titles = await page.locator('.rows .row .row-svc').allInnerTexts();
		check((await page.locator('.rows .row').count()) === n && titles.every((t) => t === titles[0]) && (await hash(page)) === `#index/${svc}` && (await page.evaluate(() => document.activeElement?.id === 'svc-select')), `select ${svc}: ${n} rows of one service, hash #index/${svc}, select keeps focus`);
	}
	await page.focus('#svc-select'); await page.selectOption('#svc-select', 'all');
	await sleep(150);

	// the complete phone path: row -> case study -> build something similar -> contact prefilled -> intercepted post
	await page.locator('.rows .row[data-project="grece"]').click();
	await page.waitForSelector('dialog[open] #pd-title');
	await sleep(250);
	check((await page.locator('dialog[open] #pd-title').innerText()).includes('grece hydroponics') && (await page.evaluate(() => document.activeElement?.id === 'pd-title')), 'a row opens its case study and focuses the title');
	await dialogFits(page, 'case dialog');
	await closeVisible(page, 'case dialog at the top');
	await textAtLeast(page, ['dialog[open] .summary', 'dialog[open] section p', 'dialog[open] section li', 'dialog[open] .meta dd', 'dialog[open] summary'], 16, 'case dialog text');
	await targets(page, ['dialog[open] .close', 'dialog[open] .svc', 'dialog[open] summary', 'dialog[open] .nav button', 'dialog[open] .dlg-foot .btn'], 'case dialog controls');
	await page.evaluate(() => { const d = document.querySelector('dialog[open]'); d.scrollTop = d.scrollHeight; });
	await sleep(200);
	await closeVisible(page, 'case dialog at the bottom');
	await page.screenshot({ path: path.join(shots, `mobile-case-bottom-${vp.name}.png`) });
	await page.keyboard.press('Escape');
	await sleep(200);
	check(await page.evaluate(() => document.activeElement?.getAttribute('data-project') === 'grece'), 'escape returns focus to the row');
	await page.locator('.rows .row[data-project="grece"]').click();
	await page.waitForSelector('dialog[open] .dlg-foot .btn');
	await page.locator('dialog[open] .dlg-foot .btn').click();
	await page.waitForSelector('dialog[open] form');
	await sleep(250);
	check((await page.locator('#cf-need').inputValue()) === 'devices' && (await page.locator('#cf-msg').inputValue()).includes('grece hydroponics') && (await page.evaluate(() => document.activeElement?.id === 'cd-title')), 'contact prefilled with the service and the project, focus on the title');
	await dialogFits(page, 'contact dialog');
	await textAtLeast(page, ['dialog[open] input', 'dialog[open] select', 'dialog[open] textarea'], 16, 'form inputs');
	await textAtLeast(page, ['dialog[open] label', 'dialog[open] .form-note', 'dialog[open] .small'], 14, 'form labels and notes');
	await targets(page, ['dialog[open] .close', 'dialog[open] .modes button', 'dialog[open] button[type="submit"]', 'dialog[open] .actions .textlink'], 'contact controls');
	await page.fill('#cf-name', 'mobile test');
	await page.fill('#cf-email', 'mobile@example.com');
	await page.locator('dialog[open] button[type="submit"]').click();
	await page.waitForSelector('dialog[open] .form-result');
	const sent = leadPosts[leadPosts.length - 1];
	check(leadPosts.length === 1 && sent.name === 'mobile test' && /need: connected devices/.test(sent.message) && /similar to: grece hydroponics \(grece\)/.test(sent.message), `one intercepted post with the context lines (${JSON.stringify(sent)})`);
	check(await page.evaluate(() => document.activeElement?.classList.contains('form-result')), 'success panel takes focus');
	await page.keyboard.press('Escape');
	await sleep(200);
	check(await page.evaluate(() => document.activeElement?.getAttribute('data-project') === 'grece'), 'after the contact dialog, focus returns to the original row');

	// the optional map: a native tree that scrolls with the page
	await page.locator('.pres button', { hasText: 'map' }).click();
	await page.waitForSelector('.tree');
	await sleep(250);
	check((await hash(page)) === '#index/all/map' && (await page.locator('.rows').count()) === 0, 'map chosen: #index/all/map, the list is gone');
	await fits(page, 'index tree');
	await targets(page, ['.tree button'], 'tree buttons');
	await textAtLeast(page, ['.tree-project', '.tree-hub .hub-t', '.tree-root'], 16, 'tree labels');
	const treeMeta = await page.evaluate(() => { const t = document.querySelector('.tree'); const cs = getComputedStyle(t); const long = [...document.querySelectorAll('.tree-project')].every((b) => b.scrollWidth <= b.clientWidth + 1); return { touch: cs.touchAction, transform: [...document.querySelectorAll('.tree, .tree *')].every((el) => getComputedStyle(el).transform === 'none'), long, legend: document.querySelector('.legend')?.innerText || '' }; });
	check(treeMeta.touch === 'auto' && treeMeta.transform && treeMeta.long && /tap/.test(treeMeta.legend) && !/drag to pan/.test(treeMeta.legend), 'tree: native touch, no transforms, unclipped titles, touch instructions');
	const before = await rect(page, '.tree-project[data-project="vault"]');
	const cdp = await ctx.newCDPSession(page);
	await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(vp.width / 2), y: Math.round(vp.height * 0.7), yDistance: -300, speed: 900 });
	await sleep(500);
	const after = await rect(page, '.tree-project[data-project="vault"]');
	const sy = await page.evaluate(() => scrollY);
	check(sy > 100 && Math.abs(after.docTop - before.docTop) < 1 && Math.abs(after.left - before.left) < 1, `a touch drag over the tree scrolls the page (${Math.round(sy)}px) without moving a node in the document`);
	await page.screenshot({ path: path.join(shots, `mobile-tree-${vp.name}.png`), fullPage: true });
	await page.locator('.tree-project[data-project="vault"]').click();
	await page.waitForSelector('dialog[open] #pd-title');
	check((await page.locator('dialog[open] #pd-title').innerText()).includes('aquryu vault'), 'a tree button opens its case study');
	await page.keyboard.press('Escape');
	await sleep(200);
	check(await page.evaluate(() => document.activeElement?.getAttribute('data-project') === 'vault'), 'focus returns to the tree button');

	// menu: fits, every action reachable, escape closes and returns focus
	await page.evaluate(() => scrollTo(0, 0));
	await page.locator('.pill .menu-btn').click();
	await sleep(150);
	const menu = await page.evaluate(() => { const m = document.getElementById('pill-menu'); const r = m.getBoundingClientRect(); const items = [...m.querySelectorAll('button')].map((b) => { const q = b.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight && q.height >= 44; }); return { fits: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, items }; });
	check(menu.fits && menu.items.length === 3 && menu.items.every(Boolean), 'menu fits the screen with three 44px actions in view');
	await page.keyboard.press('Escape');
	await sleep(100);
	check((await page.locator('#pill-menu').count()) === 0 && (await page.evaluate(() => document.activeElement?.classList.contains('menu-btn'))), 'escape closes the menu and focuses its button');

	check(external.length === 0, `no requests outside ${origin} (${external.slice(0, 3).join(', ') || 'none'})`);
	check(errors.length === 0, `no console errors (${errors.slice(0, 3).join(' | ') || 'none'})`);
	await ctx.close();
}

// history: one entry per visitor navigation, none for a repeat or a resize,
// Back / Forward restore the service, the presentation and the view
async function history(browser) {
	console.log('\n== history at 390x844');
	const { ctx, page, errors } = await open(browser, { width: 390, height: 844 });
	await load(page);
	const len = () => page.evaluate(() => history.length);
	const l0 = await len();
	await page.locator('.pill .switch button').nth(1).click();
	await page.waitForSelector('.rows');
	await sleep(200);
	check((await hash(page)) === '#index/all' && (await len()) === l0 + 1, 'overview -> index: #index/all, one new entry');
	await page.focus('#svc-select'); await page.selectOption('#svc-select', 'ai');
	await sleep(200);
	check((await hash(page)) === '#index/ai' && (await len()) === l0 + 2, 'service ai: #index/ai, one new entry');
	await page.locator('.pres button', { hasText: 'map' }).click();
	await page.waitForSelector('.tree');
	await sleep(200);
	check((await hash(page)) === '#index/ai/map' && (await len()) === l0 + 3, 'map: #index/ai/map, one new entry');
	await page.locator('.pres button', { hasText: 'map' }).click();
	await sleep(200);
	check((await hash(page)) === '#index/ai/map' && (await len()) === l0 + 3 && (await page.locator('.tree').count()) === 1, 'choosing map again adds no entry');
	await page.focus('#svc-select'); await page.selectOption('#svc-select', 'websites');
	await sleep(200);
	check((await hash(page)) === '#index/websites/map' && (await len()) === l0 + 4 && (await page.locator('.tree .tree-project').count()) === 3, 'service change keeps the explicit map: #index/websites/map, one new entry');
	await page.goBack();
	check(await waitHash(page, '#index/ai/map'), 'back: #index/ai/map');
	await page.waitForSelector('.tree');
	await sleep(200);
	check((await page.locator('.tree .tree-project').count()) === 3 && (await page.locator('.tree-hub[aria-pressed="true"]').getAttribute('data-svc')) === 'ai' && (await page.locator('#svc-select').inputValue()) === 'ai', 'back restores the ai map');
	await page.goBack();
	check(await waitHash(page, '#index/ai'), 'back: #index/ai');
	await page.waitForSelector('.rows');
	await sleep(200);
	check((await page.locator('.rows .row').count()) === 3 && (await page.locator('.tree').count()) === 0, 'back restores the ai list');
	await page.goBack();
	check(await waitHash(page, '#index/all'), 'back: #index/all');
	await sleep(200);
	check((await page.locator('.rows .row').count()) === 15, 'back restores all 15 rows');
	await page.goBack();
	await sleep(400);
	check((await hash(page)) === '' && (await page.locator('#hero-title').count()) === 1 && !(await page.evaluate(() => document.querySelector('.pf').classList.contains('dark'))), `back: the light overview (${await hash(page)})`);
	await page.goForward();
	check(await waitHash(page, '#index/all'), 'forward: #index/all');
	await page.waitForSelector('.rows');
	await sleep(200);
	check((await page.locator('.rows .row').count()) === 15 && (await page.evaluate(() => document.querySelector('.pf').classList.contains('dark'))), 'forward restores the dark list');
	await page.goForward();
	check(await waitHash(page, '#index/ai'), 'forward: #index/ai');
	await page.goForward();
	check(await waitHash(page, '#index/ai/map'), 'forward: #index/ai/map');
	await page.waitForSelector('.tree');
	check((await page.locator('.tree .tree-project').count()) === 3, 'forward restores the ai map');
	check((await len()) === l0 + 4, `no entry was added by back or forward (${await len()} = ${l0} + 4)`);
	// reload keeps an explicit presentation
	await page.reload();
	await page.waitForSelector('.tree');
	await sleep(300);
	check((await hash(page)) === '#index/ai/map' && (await page.locator('.tree .tree-project').count()) === 3, 'reload keeps #index/ai/map and the tree');
	// a legacy or unknown suffix is replaced, not pushed, and never loops
	await page.evaluate(() => { location.hash = '#index/ai/nope'; });
	await sleep(400);
	check((await hash(page)) === '#index/ai' && (await page.locator('.rows').count()) === 1, 'an unknown suffix is canonicalised to #index/ai with the list');
	const l1 = await len();
	await page.evaluate(() => { location.hash = '#index/ai/nope'; });
	await sleep(400);
	check((await hash(page)) === '#index/ai' && (await len()) === l1 + 1, 'the same unknown suffix again: one entry from the browser, none from the page, no loop');
	await page.evaluate(() => { location.hash = '#index/nope'; });
	await sleep(400);
	check((await hash(page)) === '#index/all' && (await page.locator('.rows .row').count()) === 15, 'an unknown service is canonicalised to #index/all');
	await page.evaluate(() => { location.hash = '#about'; });
	// the scroll is smooth, so poll for the section
	let near = false;
	for (let t = 0; t < 30 && !near; t++) { await sleep(150); near = await page.evaluate(() => Math.abs(document.getElementById('about')?.getBoundingClientRect().top) < 140); }
	check((await hash(page)) === '#about' && !(await page.evaluate(() => document.querySelector('.pf').classList.contains('dark'))) && near, '#about lands on the light overview at the about section');
	check(errors.length === 0, `no console errors (${errors.slice(0, 3).join(' | ') || 'none'})`);
	await ctx.close();
}

// resize across 960px: the automatic presentation follows, an explicit one stays, no history entry either way
async function resize(browser) {
	console.log('\n== resize across 960px');
	const { ctx, page, errors } = await open(browser, { width: 1100, height: 800 });
	await load(page, '#index');
	await page.waitForSelector('svg.map');
	await sleep(300);
	const l0 = await page.evaluate(() => history.length);
	check((await hash(page)) === '#index/all' && (await page.locator('.pres button[aria-pressed="true"]').textContent()).trim() === 'map', '1100px: the map by default');
	await page.setViewportSize({ width: 800, height: 800 });
	await page.waitForSelector('.rows');
	await sleep(300);
	check((await hash(page)) === '#index/all' && (await page.locator('svg.map').count()) === 0 && (await page.locator('.rows .row').count()) === 15 && (await page.evaluate(() => history.length)) === l0, '800px: the list, same hash, no history entry');
	await page.setViewportSize({ width: 1100, height: 800 });
	await page.waitForSelector('svg.map');
	await sleep(300);
	check((await hash(page)) === '#index/all' && (await page.locator('.rows').count()) === 0 && (await page.evaluate(() => document.querySelector('svg.map .stage').getAttribute('transform'))) === 'translate(0 0) scale(1)' && (await page.evaluate(() => history.length)) === l0, 'back at 1100px: the map, fitted, no history entry');
	await page.locator('.ctrl button[aria-label="zoom in"]').click();
	await page.setViewportSize({ width: 800, height: 800 });
	await page.waitForSelector('.rows');
	await page.locator('.pres button', { hasText: 'map' }).click();
	await page.waitForSelector('.tree');
	await sleep(200);
	check((await hash(page)) === '#index/all/map' && (await page.locator('.tree').count()) === 1, '800px: map chosen explicitly shows the tree');
	await page.setViewportSize({ width: 1100, height: 800 });
	await page.waitForSelector('svg.map');
	await sleep(300);
	check((await page.evaluate(() => document.querySelector('svg.map .stage').getAttribute('transform'))) === 'translate(0 0) scale(1)', 'a zoom made before the breakpoint is reset when the svg map returns');
	await page.locator('.pres button', { hasText: 'list' }).click();
	await page.waitForSelector('.rows');
	await sleep(200);
	check((await hash(page)) === '#index/all/list' && (await page.locator('.rows .row').count()) === 15, '1100px: the list can be chosen on a wide screen (#index/all/list)');
	await page.setViewportSize({ width: 800, height: 800 });
	await sleep(300);
	await page.setViewportSize({ width: 1100, height: 800 });
	await sleep(300);
	check((await hash(page)) === '#index/all/list' && (await page.locator('.rows').count()) === 1 && (await page.locator('svg.map').count()) === 0, 'an explicit list survives a resize across 960px in both directions');
	check(errors.length === 0, `no console errors (${errors.slice(0, 3).join(' | ') || 'none'})`);
	await ctx.close();
}

// dialogs on short and reduced viewports: close control reachable at the top and the
// bottom, fields and errors reachable, submit reachable, background locked
async function dialogs(browser, vp) {
	console.log(`\n== dialogs at ${vp.name} ${vp.width}x${vp.height}`);
	const { ctx, page, errors, leadPosts } = await open(browser, vp);
	await load(page);
	await page.evaluate(() => scrollTo(0, 260));
	await sleep(150);
	const y0 = await page.evaluate(() => scrollY);
	await page.locator('.hero .actions .btn').first().click();
	await page.waitForSelector('dialog[open] form');
	await sleep(250);
	await dialogFits(page, 'contact');
	await closeVisible(page, 'contact at the top');
	const dlg = () => page.evaluate(() => { const d = document.querySelector('dialog[open]'); return { top: d.getBoundingClientRect().top, bottom: d.getBoundingClientRect().bottom, sh: d.scrollHeight, ch: d.clientHeight }; });
	const inDialog = (sel) => page.evaluate((s) => { const d = document.querySelector('dialog[open]').getBoundingClientRect(); const r = document.querySelector(s).getBoundingClientRect(); return r.top >= d.top - 1 && r.bottom <= d.bottom + 1 && r.height > 0; }, sel);
	// the last field: bring it into view (as a tap does) and focus it; it sits inside the dialog and below the sticky head
	await page.evaluate(() => document.getElementById('cf-msg').scrollIntoView({ block: 'nearest' }));
	await page.focus('#cf-msg');
	await sleep(200);
	const belowHead = (sel) => page.evaluate((s) => { const h = document.querySelector('dialog[open] .dlg-head').getBoundingClientRect(); const r = document.querySelector(s).getBoundingClientRect(); return r.top >= h.bottom - 1; }, sel);
	check((await page.evaluate(() => document.activeElement?.id === 'cf-msg')) && (await inDialog('#cf-msg')) && (await belowHead('#cf-msg')), 'the message field is focused, inside the visible dialog and not under the sticky head');
	await closeVisible(page, 'contact with the last field focused');
	// validation: the first invalid field is focused and its error visible
	await page.locator('dialog[open] button[type="submit"]').click();
	await sleep(250);
	check((await page.evaluate(() => document.activeElement?.id === 'cf-name')) && (await inDialog('#cf-name')) && (await inDialog('#cf-name-err')), 'empty submit: focus and the error message inside the visible dialog');
	check(leadPosts.length === 0, 'nothing was posted');
	// the submit action: reachable by scroll inside the dialog
	await page.evaluate(() => document.querySelector('dialog[open] button[type="submit"]').scrollIntoView({ block: 'nearest' }));
	await sleep(150);
	check(await inDialog('dialog[open] button[type="submit"]'), 'submit action reachable inside the visible dialog');
	await closeVisible(page, 'contact scrolled to the submit');
	await page.evaluate(() => { const d = document.querySelector('dialog[open]'); d.scrollTop = d.scrollHeight; });
	await sleep(150);
	await closeVisible(page, 'contact at the bottom');
	const g = await dlg();
	check(g.top >= 0 && g.bottom <= vp.height, `dialog inside the viewport (${Math.round(g.top)}..${Math.round(g.bottom)} of ${vp.height})`);
	await page.screenshot({ path: path.join(shots, `mobile-contact-bottom-${vp.name}.png`) });
	// background scroll lock: wheel and touch on the backdrop, keyboard scrolling
	await page.mouse.move(4, vp.height - 4);
	await page.mouse.wheel(0, 500);
	await sleep(200);
	if (vp.width < 500) { const cdp = await ctx.newCDPSession(page); await cdp.send('Input.synthesizeScrollGesture', { x: 4, y: vp.height - 6, yDistance: -400, speed: 800 }); await sleep(300); }
	check((await page.evaluate(() => scrollY)) === y0, `the page behind the dialog did not scroll (${y0})`);
	await page.keyboard.press('Escape');
	await sleep(200);
	check((await page.evaluate(() => scrollY)) === y0 && (await page.evaluate(() => document.activeElement?.textContent.trim() === 'work with me')), 'after close: page position kept, focus back on the opener');
	// the case dialog with the loom poster: the embed close control (iframe stubbed) is 44px and the close stays in view
	await page.route('https://www.loom.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stub</title>' }));
	await page.locator('.demo-caption .textlink').click();
	await page.waitForSelector('dialog[open] #pd-title');
	await sleep(250);
	await dialogFits(page, 'case');
	await closeVisible(page, 'case at the top');
	await page.locator('dialog[open] .media[data-kind="embed"] button.btn').click();
	await page.waitForSelector('dialog[open] iframe');
	await sleep(250);
	await targets(page, ['dialog[open] .close-embed'], 'embed close control');
	await dialogFits(page, 'case with the embed open');
	await page.locator('dialog[open] .close-embed').click();
	await sleep(200);
	check((await page.locator('dialog[open] iframe').count()) === 0 && (await page.evaluate(() => document.activeElement?.classList.contains('btn'))), 'closing the embed removes the iframe and focuses the load button');
	await page.evaluate(() => { const d = document.querySelector('dialog[open]'); d.scrollTop = d.scrollHeight; });
	await sleep(150);
	await closeVisible(page, 'case at the bottom');
	await page.keyboard.press('Escape');
	await sleep(200);
	check(errors.length === 0, `no console errors (${errors.slice(0, 3).join(' | ') || 'none'})`);
	await ctx.close();
}

// tablet and wide phone: list default, layout of the controls, menu, dialogs
async function tablet(browser, vp) {
	console.log(`\n== ${vp.name} ${vp.width}x${vp.height}`);
	const { ctx, page, errors } = await open(browser, vp);
	await load(page, '#index');
	await page.waitForSelector('.rows');
	await sleep(300);
	await fits(page, 'index list');
	check((await page.locator('.rows .row').count()) === 15 && (await page.locator('svg.map').count()) === 0, 'index defaults to the list');
	const tools = await page.evaluate(() => { const t = document.querySelector('.head-tools').getBoundingClientRect(); const n = document.querySelector('.index-head .n').getBoundingClientRect(); const p = document.querySelector('.pres').getBoundingClientRect(); return { fits: t.left >= 0 && t.right <= innerWidth, sameRow: Math.abs(n.top - p.top) < 30 }; });
	check(tools.fits && tools.sameRow, 'count and list / map control fit on one row');
	await targets(page, ['#svc-select', '.pres button', '.rows .row', '.pill a', '.pill button'], 'index controls');
	await page.locator('.pres button', { hasText: 'map' }).click();
	await page.waitForSelector('.tree');
	await fits(page, 'index tree');
	await targets(page, ['.tree button'], 'tree buttons');
	await page.screenshot({ path: path.join(shots, `mobile-tree-${vp.name}.png`) });
	if (vp.width <= 900) {
		await page.locator('.pill .menu-btn').click();
		await sleep(150);
		const mb = await page.locator('#pill-menu').boundingBox();
		check(mb && mb.x >= 0 && mb.x + mb.width <= vp.width && mb.y + mb.height <= vp.height, 'menu fits the screen');
		await page.keyboard.press('Escape');
		await sleep(100);
	}
	await page.locator('.tree-project[data-project="standup"]').click();
	await page.waitForSelector('dialog[open] #pd-title');
	await sleep(200);
	await dialogFits(page, 'case dialog');
	await closeVisible(page, 'case dialog');
	await page.evaluate(() => { const d = document.querySelector('dialog[open]'); d.scrollTop = d.scrollHeight; });
	await sleep(150);
	await closeVisible(page, 'case dialog at the bottom');
	await page.keyboard.press('Escape');
	await sleep(200);
	check(await page.evaluate(() => document.activeElement?.getAttribute('data-project') === 'standup'), 'focus returns to the tree button');
	check(errors.length === 0, `no console errors (${errors.slice(0, 3).join(' | ') || 'none'})`);
	await ctx.close();
}

// browser zoom stays enabled; a 200% zoom on a laptop is a 640px-wide layout
async function zoom(browser) {
	console.log('\n== zoom');
	const { ctx, page, errors } = await open(browser, { width: 640, height: 450 });
	await load(page);
	const meta = await page.evaluate(() => document.querySelector('meta[name="viewport"]')?.content || '');
	check(/width=device-width/.test(meta) && !/user-scalable\s*=\s*(no|0)/.test(meta) && !/maximum-scale\s*=\s*1(\.0)?\b/.test(meta), `viewport meta allows zoom (${meta})`);
	await fits(page, 'overview at a 200% zoom equivalent (640px)');
	await page.locator('.pill .switch button').nth(1).click();
	await page.waitForSelector('.rows');
	await sleep(200);
	await fits(page, 'index at a 200% zoom equivalent');
	await page.locator('.rows .row').first().click();
	await page.waitForSelector('dialog[open] #pd-title');
	await sleep(200);
	await dialogFits(page, 'case dialog at a 200% zoom equivalent');
	await closeVisible(page, 'case dialog at a 200% zoom equivalent');
	await page.keyboard.press('Escape');
	check(errors.length === 0, `no console errors (${errors.slice(0, 3).join(' | ') || 'none'})`);
	await ctx.close();
}

// reduced motion on a phone: static headline, no transitions on the tree, no pulses anywhere
async function reducedMotion(browser) {
	console.log('\n== reduced motion at 390x844');
	const { ctx, page, errors } = await open(browser, { width: 390, height: 844 }, { reducedMotion: 'reduce' });
	await load(page);
	await sleep(2200);
	check(await page.evaluate(() => document.querySelector('.rotor').dataset.running === 'false' && document.querySelector('.rotor .word.current').textContent === 'systems'), 'headline word is a static "systems"');
	await load(page, '#index/all/map');
	await page.waitForSelector('.tree');
	const anim = await page.evaluate(() => [...document.querySelectorAll('.pf *')].filter((el) => { const cs = getComputedStyle(el); return parseFloat(cs.animationDuration) > 0.01 || parseFloat(cs.transitionDuration) > 0.01; }).length);
	check(anim === 0 && (await page.locator('.pulse').count()) === 0, `no running animation or transition over 0.01s and no pulses (${anim})`);
	check(errors.length === 0, `no console errors (${errors.slice(0, 3).join(' | ') || 'none'})`);
	await ctx.close();
}

(async () => {
	const browser = await chromium.launch({ args: ['--no-sandbox'] });
	try {
		for (const vp of [{ name: 'narrow', width: 320, height: 700 }, { name: 'phone-360', width: 360, height: 800 }, { name: 'phone-390', width: 390, height: 844 }, { name: 'phone-430', width: 430, height: 932 }]) await phone(browser, vp);
		await history(browser);
		await resize(browser);
		for (const vp of [{ name: 'narrow', width: 320, height: 700 }, { name: 'landscape', width: 844, height: 390 }, { name: 'keyboard-proxy', width: 390, height: 420 }, { name: 'phone-430', width: 430, height: 932 }]) await dialogs(browser, vp);
		for (const vp of [{ name: 'tablet', width: 768, height: 1024 }, { name: 'landscape', width: 844, height: 390 }]) await tablet(browser, vp);
		await zoom(browser);
		await reducedMotion(browser);
	} finally {
		await browser.close();
	}
	console.log(failures ? `\n${failures} check(s) failed` : '\nall mobile checks passed');
	console.log(`screenshots in ${shots}`);
	process.exit(failures ? 1 : 0);
})();
