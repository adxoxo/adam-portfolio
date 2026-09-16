// Browser checks for the public page against a running server (the wrangler
// dev worker or `npm run preview`). See tests/README.md for the environment.
//   BASE_URL=http://127.0.0.1:8788 node tests/smoke.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_DIR || 'playwright');

const url = (process.env.BASE_URL || 'http://127.0.0.1:8788').replace(/\/$/, '') + '/';
const origin = new URL(url).origin;
const shots = process.env.SHOTS_DIR || path.join(require('os').tmpdir(), 'adam-portfolio-shots');
fs.mkdirSync(shots, { recursive: true });

const VIEWPORTS = [
	{ name: 'desktop', width: 1440, height: 1000 },
	{ name: 'tablet', width: 768, height: 1024 },
	{ name: 'mobile', width: 390, height: 844 },
	{ name: 'narrow', width: 320, height: 700 }
];

// The two client workflows (booking, enquiry) are public only at the level of
// customer-visible stages. None of the internal detail that was redacted may come
// back: case-sorting categories and branch conditions, what the photos must show,
// follow-up and escalation timings, slot holds, the payment-trigger chain and the
// booking timer. Checked in the server html, the client chunks and every open dialog.
const PRIVATE = /\b(24|48|72)h\b|meter cabinet|storage location|held during checkout|slot is held|released on time|to be checked|to-be-checked|special case|cannot be priced|unpriceable|rejected photo|one event that triggers|check attendance|second cancellation/i;

let failures = 0;
function check(ok, msg) {
	console.log((ok ? '  ok   ' : '  FAIL ') + msg);
	if (!ok) failures++;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function noOverflow(page, label) {
	const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
	check(o.sw <= o.cw, `${label}: no horizontal overflow (${o.sw} <= ${o.cw})`);
}

// The open dialog is the modal's only scroll container, and it may only scroll
// vertically: its content fits its width, nothing has scrolled it sideways, and
// no laid-out descendant sticks out of its box (that catches overflow that a
// hidden or clipped box would not report through scrollWidth).
async function dialogFits(page, label) {
	const m = await page.evaluate(() => {
		const d = document.querySelector('dialog[open]');
		const box = d.getBoundingClientRect();
		const out = [...d.querySelectorAll('*')].filter((el) => {
			const r = el.getBoundingClientRect();
			return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1);
		}).map((el) => el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : ''));
		return { sw: d.scrollWidth, cw: d.clientWidth, sl: d.scrollLeft, out: out.slice(0, 4) };
	});
	check(m.sw <= m.cw && m.sl === 0 && m.out.length === 0, `${label}: dialog content fits its width (scrollWidth ${m.sw} <= clientWidth ${m.cw}, scrollLeft ${m.sl}${m.out.length ? ', outside: ' + m.out.join(' ') : ''})`);
}

async function run(browser, vp) {
	console.log(`\n== ${vp.name} ${vp.width}x${vp.height}`);
	const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.width < 500 });
	const page = await ctx.newPage();
	const errors = [];
	page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
	page.on('pageerror', (e) => errors.push(String(e)));
	const external = [];
	page.on('request', (r) => { if (!r.url().startsWith(origin)) external.push(r.url()); });
	// the contact form is always intercepted: nothing may reach the real /api/lead
	const leadPosts = [];
	await page.route('**/api/lead', (route) => { leadPosts.push(route.request().postDataJSON()); route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
	await page.route('**/api/schedule', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));

	const res = await page.goto(url);
	check(res.status() === 200, `home responds 200 (${res.status()})`);
	await page.waitForSelector('.pill');
	await sleep(300);

	// server-rendered heading: present in the raw html, before any script runs
	const raw = await (await ctx.request.get(url)).text();
	check(/id="hero-title"/.test(raw) && raw.includes('built around') && raw.includes('how your business works.'), 'hero h1 is in the server html');
	check(!/design preview|drafted for this design preview|preview only/i.test(raw), 'no preview or draft wording in the server html');
	// privacy: the server html carries the overview diagrams and the serialised project data;
	// the modulepreloaded chunks carry data.ts and WorkflowDiagram.svelte for the client
	check(!PRIVATE.test(raw), `no internal workflow detail in the server html (${raw.match(PRIVATE)?.[0] || 'clean'})`);
	const chunks = [...new Set([...raw.matchAll(/(\/_app\/immutable\/[^"' )]+\.js)/g)].map((m) => m[1]))];
	let bundleHit = '';
	for (const c of chunks) {
		const hit = (await (await ctx.request.get(origin + c)).text()).match(PRIVATE);
		if (hit) { bundleHit = `${c}: ${hit[0]}`; break; }
	}
	check(chunks.length > 0 && !bundleHit, `no internal workflow detail in the ${chunks.length} client chunks${bundleHit ? ' (' + bundleHit + ')' : ''}`);

	// pill, portrait, no overflow
	const pill = await page.locator('.pill').boundingBox();
	check(pill && pill.x >= 0 && pill.x + pill.width <= vp.width, `pill fits the viewport (${Math.round(pill.width)}px wide)`);
	const pic = await page.evaluate(() => { const i = document.querySelector('.pill img'); return i && i.complete && i.naturalWidth > 0; });
	check(pic, 'pill portrait loaded');
	await noOverflow(page, 'overview');
	const small = await page.evaluate(() => [...document.querySelectorAll('.pill a, .pill button')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.height && (r.height < 44 || r.width < 44); }).map((el) => el.textContent.trim() || el.getAttribute('aria-label')));
	check(small.length === 0, `pill targets are >= 44px (${small.join(', ') || 'all fine'})`);

	// approved hero copy; the visible first word rotates (tests/headline.cjs), the accessible name stays the sentence
	check((await page.getByRole('heading', { level: 1, name: 'systems built around how your business works.', exact: true }).count()) === 1, 'hero h1 accessible name is "systems built around how your business works."');
	check(await page.evaluate(() => { const w = [...document.querySelectorAll('.rotor .word')].find((e) => parseFloat(getComputedStyle(e).opacity) > 0.95); return w && ['systems', 'websites', 'automations', 'marketing', 'workflows'].includes(w.textContent); }), 'hero shows one of the five approved words');
	check((await page.locator('.hero .lede').innerText()).trim() === 'i build custom software, connect your tools, and use ai to automate complex workflows, from customer conversations to everyday operations.', 'hero subheadline is the approved one');
	check((await page.title()) === 'adam, systems built around how your business works', 'document title');
	check((await page.locator('link[rel="canonical"]').getAttribute('href')) === 'https://portfolio.aquryu.space/', 'canonical link present');
	check((await page.locator('link[rel="icon"]').count()) === 1, 'favicon link present');

	// chat demo: stable footprint across the three steps and the wrap back
	const docBox = async (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; }, sel);
	const h0 = await docBox('.demo'), s0 = await docBox('.steps'), c0 = await docBox('.hero .actions .btn');
	const stepBtns = page.locator('.steps button');
	for (const i of [1, 2, 0, 1, 2]) {
		await stepBtns.nth(i).click();
		await sleep(450);
		const b = await docBox('.demo'), s = await docBox('.steps'), c = await docBox('.hero .actions .btn');
		check(Math.abs(b.height - h0.height) <= 1 && Math.abs(b.width - h0.width) <= 1, `demo frame stable at step ${i + 1} (${b.width.toFixed(0)}x${b.height.toFixed(1)})`);
		check(Math.abs(s.y - s0.y) <= 1 && Math.abs(c.y - c0.y) <= 1, `step controls and hero cta did not move at step ${i + 1}`);
		check(await page.evaluate((n) => document.querySelectorAll('.steps button')[n].getAttribute('aria-pressed') === 'true', i), `step ${i + 1} is pressed`);
		check(await page.evaluate(() => getComputedStyle(document.querySelector('.chat-log')).overflowY === 'auto'), `conversation scrolls inside the frame at step ${i + 1}`);
	}
	await page.locator('.demo-foot .next').click(); await sleep(450);
	check(Math.abs((await docBox('.demo')).height - h0.height) <= 1, 'demo height stable after "next step" wrap');
	const composer = await page.evaluate(() => { const c = document.querySelector('.chat-input'); return { hidden: c.getAttribute('aria-hidden') === 'true', interactive: !!c.querySelector('button, input, textarea, a'), cursor: getComputedStyle(c).cursor }; });
	check(composer.hidden && !composer.interactive && composer.cursor === 'default', `demo composer is not a live control (${JSON.stringify(composer)})`);
	check((await page.locator('.demo-bar .tag').textContent()).trim() === 'interactive demo', 'demo is labelled "interactive demo"');
	check((await page.locator('#hero-title .rotor').count()) === 1 && (await page.locator('.hero button[aria-pressed]:not(.steps button)').count()) === 0 && !(await page.evaluate(() => /pause the headline|resume the headline/i.test(document.body.innerText))), 'no manual headline pause control');
	await page.screenshot({ path: path.join(shots, `overview-${vp.name}.png`) });

	// aq rename: no user-facing "tq chatbot"; no preview wording
	check(!(await page.evaluate(() => document.body.innerText.toLowerCase().includes('tq chatbot'))), 'no "tq chatbot" on the overview');
	check(!(await page.evaluate(() => /design preview|drafted for this design preview|preview only|does not send/i.test(document.body.innerText))), 'no preview wording on the overview');

	// case study from the hero caption: media (loom click-to-load), technical details, escape + focus return
	await page.locator('.demo-caption .textlink').click();
	await page.waitForSelector('dialog[open] #pd-title');
	check((await page.locator('dialog[open] #pd-title').innerText()).includes('aq chatbot'), 'aq chatbot dialog opens from the hero caption');
	check(await page.evaluate(() => document.activeElement?.id === 'pd-title'), 'focus moves to the dialog title');
	check((await page.locator('dialog[open] iframe').count()) === 0 && (await page.locator('dialog[open] .media[data-kind="embed"] button.btn').count()) === 1, 'loom embed offers a load button and no iframe before activation');
	// the media frame grows with its content: the click-to-load poster and its button are never cut off, at any width
	const posterFit = await page.evaluate(() => {
		const f = document.querySelector('dialog[open] .media .frame').getBoundingClientRect();
		const b = document.querySelector('dialog[open] .media[data-kind="embed"] button.btn').getBoundingClientRect();
		return { fits: b.top >= f.top - 1 && b.bottom <= f.bottom + 1 && b.left >= f.left - 1 && b.right <= f.right + 1, frame: `${Math.round(f.width)}x${Math.round(f.height)}` };
	});
	check(posterFit.fits, `loom poster and its load button sit inside the media frame (${posterFit.frame})`);
	// the media frame is taller than 16:10 on a phone; it must not widen the dialog (it did, to 560px at 390px)
	await dialogFits(page, 'aq dialog before technical details');
	await page.locator('dialog[open] details summary').click();
	check((await page.locator('dialog[open] details[open]').count()) === 1, 'technical details expand');
	await dialogFits(page, 'aq dialog after technical details');
	// innerText carries the CSS text-transform, so compare case-insensitively
	check((await page.locator('dialog[open] details h3').allInnerTexts()).map((t) => t.trim().toLowerCase()).join('|') === 'stack|source', 'technical details show only the stack and the source, no write-up or wiring path');
	check((await page.locator('dialog[open] .links a', { hasText: 'source on github' }).count()) === 1, 'github link from the database overlay');
	await page.screenshot({ path: path.join(shots, `dialog-aq-${vp.name}.png`) });
	await page.keyboard.press('Escape');
	await sleep(200);
	check((await page.locator('dialog[open]').count()) === 0, 'escape closes the dialog');
	check(await page.evaluate(() => document.activeElement?.classList.contains('textlink')), 'focus returns to the opener');

	// selected work: two sourced case studies with workflow diagrams and the provenance line
	const caseTitles = await page.locator('.case h3').allInnerTexts();
	check(caseTitles.length === 2 && caseTitles[0] === 'automated booking sales flow' && caseTitles[1] === 'sales flow automation', `two case studies in order (${caseTitles.join(' | ')})`);
	const flowGeom = await page.evaluate(() => [...document.querySelectorAll('.case .flow')].map((f) => {
		const steps = [...f.querySelectorAll('.lane[aria-label="main route"] .step')];
		const ys = new Set(steps.map((s) => Math.round(s.getBoundingClientRect().top)));
		const xs = new Set(steps.map((s) => Math.round(s.getBoundingClientRect().left)));
		const clipped = [...f.querySelectorAll('.step')].some((el) => el.scrollWidth > el.clientWidth + 1);
		return { steps: steps.length, row: ys.size === 1, column: xs.size === 1, clipped, overflow: f.scrollWidth > f.clientWidth + 1 };
	}));
	check(flowGeom[0].steps === 6 && flowGeom[1].steps === 6, `main routes have 6 (booking) and 6 (enquiry) steps`);
	check(flowGeom.every((g) => (vp.width >= 1440 ? g.row : g.column) && !g.clipped && !g.overflow), `diagrams flow as a ${vp.width >= 1440 ? 'row' : 'column'} without clipping`);
	check((await page.locator('.case:nth-child(2) .alt-lane .step').count()) === 3, 'enquiry: alternate route with 3 steps');
	await page.locator('.case:nth-child(1) .textlink').click();
	await page.waitForSelector('dialog[open] .flow');
	check((await page.locator('dialog[open] .provenance').innerText()) === 'workflow based on the project implementation.' && (await page.locator('dialog[open] .placeholder').count()) === 0, 'booking dialog: provenance line, no placeholder');
	await dialogFits(page, 'booking dialog with the workflow diagram');
	await page.keyboard.press('Escape');
	await sleep(200);
	check(await page.evaluate(() => document.activeElement?.closest('.case')?.querySelector('h3')?.textContent === 'automated booking sales flow'), 'escape returns focus to the booking case link');

	// index view is the map, always: service filters swap clusters, count follows
	await page.locator('.pill .switch button').nth(1).click();
	await page.waitForSelector('#index-title');
	await page.waitForSelector('svg.map');
	await sleep(250);
	check(await page.evaluate(() => document.activeElement?.id === 'index-title'), 'index title receives focus');
	check(await page.evaluate(() => location.hash === '#index/all'), `hash is #index/all (${await page.evaluate(() => location.hash)})`);
	check((await page.locator('.index-head .n').innerText()) === '15 projects', 'project count shown next to the heading');
	const chipOrList = vp.width > 960 ? '.svc-list button' : '.svc-chips button';
	for (const [svc, n] of [['websites', 3], ['ai', 3], ['automation', 3], ['apps', 3], ['devices', 3], ['all', 15]]) {
		const idx = ['all', 'websites', 'ai', 'automation', 'apps', 'devices'].indexOf(svc);
		await page.locator(chipOrList).nth(idx).click();
		await sleep(150);
		check((await page.locator('svg.map .node.project').count()) === n && (await page.locator('.index-head .n').innerText()) === `${n} projects`, `filter ${svc}: ${n} map nodes and count`);
		check(await page.evaluate((h) => location.hash === h, `#index/${svc}`), `filter ${svc}: hash is #index/${svc}`);
		check(await page.evaluate(([sel, i]) => document.activeElement === document.querySelectorAll(sel)[i], [chipOrList, idx]), `filter ${svc}: the clicked control keeps focus`);
	}
	check(await page.evaluate(() => document.querySelector('.pf').classList.contains('dark') && getComputedStyle(document.querySelector('.pf')).backgroundColor === 'rgb(16, 20, 13)'), 'map mode is dark');
	check((await page.locator('svg.map .node.hub').count()) === 5 && (await page.locator('svg.map .pulse').count()) === 20, '5 hubs and 20 pulse paths');
	// pulses run only while the map is on screen (on a phone the tree starts below the fold)
	await page.locator('svg.map').scrollIntoViewIfNeeded();
	await sleep(400);
	check((await page.evaluate(() => getComputedStyle(document.querySelector('svg.map .pulse')).animationPlayState)) === 'running', 'pulses animate while the map is on screen');
	await noOverflow(page, 'index map (all)');
	await page.screenshot({ path: path.join(shots, `map-all-${vp.name}.png`), fullPage: vp.width < 700 });
	await page.locator('.ctrl .motion').click(); await sleep(100);
	check((await page.evaluate(() => getComputedStyle(document.querySelector('svg.map .pulse')).animationPlayState)) === 'paused', 'pause motion pauses the pulses');
	await page.locator('.ctrl .motion').click(); await sleep(100);
	const aiHub = page.locator('svg.map .node.hub[data-svc="ai"]');
	await aiHub.focus();
	await page.keyboard.press('Enter');
	await sleep(650);
	check(await page.evaluate(() => document.activeElement?.getAttribute('data-svc') === 'ai') && (await page.locator('svg.map .node.project').count()) === 3 && (await page.evaluate(() => location.hash === '#index/ai')), 'hub keyboard selection focuses the ai cluster and keeps focus');
	await noOverflow(page, 'index map (ai)');
	await page.screenshot({ path: path.join(shots, `map-ai-${vp.name}.png`), fullPage: vp.width < 700 });
	await page.locator('.ctrl button[aria-label="zoom in"]').click();
	const t1 = await page.evaluate(() => document.querySelector('svg.map .stage').getAttribute('transform'));
	await page.locator('.ctrl button[aria-label="fit the map"]').click();
	const t2 = await page.evaluate(() => document.querySelector('svg.map .stage').getAttribute('transform'));
	check(t1 !== t2 && t2 === 'translate(0 0) scale(1)', 'zoom in then fit resets');
	const node = page.locator('svg.map .node.project[data-project="grimoire"]');
	await node.focus();
	await page.keyboard.press('Enter');
	await page.waitForSelector('dialog[open] #pd-title');
	check((await page.locator('dialog[open] #pd-title').innerText()).includes('grimoire'), 'map node opens grimoire with the keyboard');
	await page.keyboard.press('Escape');
	await sleep(200);
	check(await page.evaluate(() => document.activeElement?.getAttribute('data-project') === 'grimoire'), 'focus returns to the map node');
	await page.locator(chipOrList).nth(0).click();
	await sleep(300);

	// every project opens from its map node, previous / next walks the list
	const ids = await page.locator('svg.map .node.project').evaluateAll((els) => els.map((e) => [e.getAttribute('data-project'), e.getAttribute('aria-label').replace(', open case study', '')]));
	let opened = 0;
	const privateHits = [];
	for (let i = 0; i < ids.length; i++) {
		const [id, label] = ids[i];
		await page.locator(`svg.map .node.project[data-project="${id}"]`).focus();
		await page.keyboard.press('Enter');
		await page.waitForSelector('dialog[open] #pd-title');
		if ((await page.locator('dialog[open] #pd-title').innerText()).includes(label)) opened++;
			await dialogFits(page, `${label} dialog`);
		// privacy: the open dialog (summary, diagram, what it does, outcomes) shows no internal detail
		const hit = await page.evaluate((re) => document.querySelector('dialog[open]').innerText.match(new RegExp(re, 'i'))?.[0] || '', PRIVATE.source);
		if (hit) privateHits.push(`${label}: ${hit}`);
		if (i === 0) {
			await page.locator('dialog[open] .nav button').nth(1).click(); await sleep(150);
			check((await page.locator('dialog[open] #pd-title').innerText()).includes(ids[1][1]), 'next project works');
			await page.locator('dialog[open] .nav button').nth(0).click(); await sleep(150);
		}
		await page.keyboard.press('Escape');
		await sleep(120);
	}
	check(opened === 15, `all ${opened}/15 projects open from their map node with the right title`);
	check(privateHits.length === 0, `no internal workflow detail in any open dialog (${privateHits.join('; ') || 'all 15 clean'})`);
	check(!(await page.evaluate(() => document.body.innerText.toLowerCase().includes('tq chatbot'))), 'no "tq chatbot" on the map');

	// "build something similar" -> contact prefilled; the intercepted submit carries the context
	await page.locator('svg.map .node.project[data-project="invoice_automation"]').click();
	await page.waitForSelector('dialog[open] .dlg-foot .btn');
	await page.locator('dialog[open] .dlg-foot .btn').click();
	await page.waitForSelector('dialog[open] form');
	check((await page.locator('#cf-need').inputValue()) === 'automation' && (await page.locator('#cf-msg').inputValue()).includes('invoice automation'), 'contact prefilled with the service and the project');
	check(await page.evaluate(() => document.activeElement?.id === 'cf-name'), 'focus lands in the name field');
	await page.fill('#cf-name', 'smoke test');
	await page.fill('#cf-email', 'smoke@example.com');
	await page.locator('dialog[open] button[type="submit"]').click();
	await page.waitForSelector('dialog[open] .form-result');
	const sent = leadPosts[leadPosts.length - 1];
	check(leadPosts.length === 1 && sent.name === 'smoke test' && sent.email === 'smoke@example.com' && /need: business automation/.test(sent.message) && /similar to: invoice automation \(invoice_automation\)/.test(sent.message), `one intercepted post with the context lines (${JSON.stringify(sent)})`);
	check((await page.locator('dialog[open] .form-result').innerText()).startsWith('received.') && (await page.evaluate(() => document.activeElement?.classList.contains('form-result'))), 'success panel shown and focused');
	await page.screenshot({ path: path.join(shots, `contact-sent-${vp.name}.png`) });
	await page.keyboard.press('Escape');
	await sleep(150);

	// entry points and legacy hashes
	const entries = [
		['hero cta', async () => { await page.locator('.pill .switch button').nth(0).click(); await page.waitForSelector('#hero-title'); await page.locator('.hero .actions .btn--secondary').click(); }, '#index/all', 15],
		['hero jump link (ai)', async () => { await page.locator('.pill .switch button').nth(0).click(); await page.waitForSelector('#hero-title'); await page.locator('.hero .quiet button', { hasText: 'ai assistants' }).click(); }, '#index/ai', 3],
		['service row (devices)', async () => { await page.locator('.pill .switch button').nth(0).click(); await page.waitForSelector('#hero-title'); await page.locator('.svc-row h3 button', { hasText: 'connected devices' }).click(); }, '#index/devices', 3],
		['browse all', async () => { await page.locator('.pill .switch button').nth(0).click(); await page.waitForSelector('#hero-title'); await page.locator('.more .btn').click(); }, '#index/all', 15],
		['dialog service link (apps)', async () => { await page.locator('svg.map .node.project[data-project="vault"]').click(); await page.waitForSelector('dialog[open] .svc'); await page.locator('dialog[open] .svc').click(); }, '#index/apps', 3]
	];
	for (const [name, act, hash, n] of entries) {
		await act();
		await page.waitForSelector('svg.map');
		await sleep(300);
		const ok = await page.evaluate((h) => location.hash === h && document.querySelector('.pf').classList.contains('dark'), hash);
		check(ok && (await page.locator('svg.map .node.project').count()) === n, `${name} opens the dark map (${hash}, ${n} nodes)`);
	}
	for (const [hash, svc, n] of [['#index', 'all', 15], ['#index/ai', 'ai', 3], ['#index/ai/map', 'ai', 3], ['#index/websites/list', 'websites', 3], ['#index/all/map', 'all', 15]]) {
		await page.goto(url + hash);
		await page.waitForSelector('svg.map');
		await sleep(300);
		const cur = await page.evaluate(() => ({ h: location.hash, dark: document.querySelector('.pf').classList.contains('dark') }));
		check(cur.h === `#index/${svc}` && cur.dark && (await page.locator('svg.map .node.project').count()) === n, `${hash} opens the map as #index/${svc} with ${n} nodes`);
	}
	for (const [hash, id] of [['#work', 'work'], ['#about', 'about'], ['#contact', 'contact']]) {
		await page.goto(url + hash);
		await page.waitForSelector('#hero-title');
		// the scroll is smooth when the hash changes inside the document, so poll for the section
		let near = false;
		for (let t = 0; t < 20 && !near; t++) { await sleep(150); near = await page.evaluate((i) => Math.abs(document.getElementById(i).getBoundingClientRect().top) < 120 || scrollY >= document.documentElement.scrollHeight - innerHeight - 2, id); } // the last section may not reach the top on a tall viewport
		check(near && !(await page.evaluate(() => document.querySelector('.pf').classList.contains('dark'))) && (await page.evaluate(() => location.hash)) === hash, `${hash} lands on the light overview at the ${id} section and keeps its hash`);
	}
	await page.goto(url + '#top');
	await page.waitForSelector('#hero-title');
	check(!(await page.evaluate(() => document.querySelector('.pf').classList.contains('dark'))), 'legacy #top stays on the light overview');

	// mobile menu
	if (vp.width <= 900) {
		await page.locator('.pill .menu-btn').click();
		await sleep(100);
		const mb = await page.locator('#pill-menu').boundingBox();
		check(mb && mb.x >= 0 && mb.x + mb.width <= vp.width, 'mobile menu opens and fits the viewport');
		await page.keyboard.press('Escape');
		await sleep(100);
		check((await page.locator('#pill-menu').count()) === 0, 'escape closes the mobile menu');
	}

	// about portrait, footer without the preview label
	const aboutPic = await page.evaluate(() => { const i = document.querySelector('.about .portrait'); if (!i) return false; i.loading = 'eager'; return i.complete && i.naturalWidth > 0; });
	check(aboutPic, 'about portrait loaded');
	check(!(await page.evaluate(() => /design preview/i.test(document.querySelector('.site-footer').innerText))), 'footer has no preview label');

	check(external.length === 0, `no requests outside ${origin} (${external.slice(0, 3).join(', ') || 'none'})`);
	check(errors.length === 0, `no console errors (${errors.slice(0, 3).join(' | ') || 'none'})`);
	await ctx.close();
}

async function reducedMotion(browser) {
	console.log('\n== reduced motion');
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
	const page = await ctx.newPage();
	await page.goto(url + '#index/all');
	await page.waitForSelector('svg.map');
	await sleep(300);
	check((await page.locator('svg.map .pulse').count()) === 0 && (await page.locator('.ctrl .motion').count()) === 0, 'no pulse paths and no motion toggle under prefers-reduced-motion');
	check((await page.locator('.legend').innerText()).includes('motion off'), 'legend explains motion is off');
	await page.locator('.pill .switch button').nth(0).click();
	await page.waitForSelector('#hero-title');
	await sleep(2600);
	check(await page.evaluate(() => document.querySelector('.rotor').dataset.running === 'false' && document.querySelector('.rotor .word.current').textContent === 'systems'), 'headline word is a static "systems" under reduced motion');
	await ctx.close();
}

(async () => {
	const browser = await chromium.launch({ args: ['--no-sandbox'] });
	try {
		for (const vp of VIEWPORTS) await run(browser, vp);
		await reducedMotion(browser);
	} finally {
		await browser.close();
	}
	console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
	console.log(`screenshots in ${shots}`);
	process.exit(failures ? 1 : 0);
})();
