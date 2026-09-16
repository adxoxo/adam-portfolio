// Focused checks for the changing headline word (src/lib/portfolio/RotatingWord.svelte)
// against a running server. Same environment as tests/smoke.cjs:
//   BASE_URL=http://127.0.0.1:8788 node tests/headline.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_DIR || 'playwright');

const url = (process.env.BASE_URL || 'http://127.0.0.1:8788').replace(/\/$/, '') + '/';
const shots = process.env.SHOTS_DIR || path.join(require('os').tmpdir(), 'adam-portfolio-shots');
fs.mkdirSync(shots, { recursive: true });
const WORDS = ['systems', 'websites', 'automations', 'marketing', 'workflows'];
let failures = 0;
const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) failures++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// the word whose opacity is (nearly) 1; '' during a fade
const visibleWord = (page) => page.evaluate(() => { const w = [...document.querySelectorAll('.rotor .word')].find((e) => parseFloat(getComputedStyle(e).opacity) > 0.95); return w ? w.textContent : ''; });
const boxes = (page) => page.evaluate(() => Object.fromEntries(['#hero-title', '.hero .lede', '.hero .actions .btn', '.demo', '.rotor'].map((s) => { const el = document.querySelector(s); const r = el ? el.getBoundingClientRect() : { x: 0, y: 0, width: 0, height: 0 }; return [s, [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)]]; })));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function cycle(page, vp) {
	// sample the visible word for one full cycle (5 words x ~2.06s: 1500ms hold + 2 x 280ms phases), keep the order of distinct holds
	const seen = [];
	const b0 = await boxes(page);
	let moved = false;
	const t0 = Date.now();
	while (Date.now() - t0 < 6 * 2060 + 600) {
		const w = await visibleWord(page);
		if (w && seen[seen.length - 1] !== w) seen.push(w);
		if (!same(await boxes(page), b0)) moved = true;
		await sleep(90);
	}
	check(seen.slice(0, 6).join(' > ') === 'systems > websites > automations > marketing > workflows > systems', `${vp}: full cycle in order (${seen.join(' > ')})`);
	check(!moved, `${vp}: headline, lede, cta, demo frame and word box never moved during the cycle`);
	return b0;
}

(async () => {
	const browser = await chromium.launch({ args: ['--no-sandbox'] });
	for (const vp of [{ w: 1440, h: 1000 }, { w: 768, h: 1024 }, { w: 390, h: 844 }, { w: 320, h: 700 }]) {
		console.log(`\n== ${vp.w}x${vp.h}`);
		const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
		const page = await ctx.newPage();
		const errors = [];
		page.on('pageerror', (e) => errors.push(String(e)));
		page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
		await page.goto(url);
		await page.waitForSelector('.rotor');
		await sleep(150);
		// accessible name stays the approved sentence; the visible word starts with "systems"
		check((await page.getByRole('heading', { level: 1, name: 'systems built around how your business works.', exact: true }).count()) === 1, `${vp.w}: h1 accessible name is exactly "systems built around how your business works."`);
		check((await visibleWord(page)) === 'systems', `${vp.w}: starts with "systems"`);
		check(await page.evaluate(() => document.querySelector('.rotor').getAttribute('aria-hidden') === 'true'), `${vp.w}: rotating words are aria-hidden`);
		// every word fits on one line inside the reserved box, box is as wide as the longest word
		const fit = await page.evaluate(() => { const box = document.querySelector('.rotor').getBoundingClientRect(); const ws = [...document.querySelectorAll('.rotor .word')].map((e) => ({ t: e.textContent, lines: e.getClientRects().length, w: e.getBoundingClientRect().width, right: e.getBoundingClientRect().right })); return { boxW: Math.round(box.width), maxW: Math.round(Math.max(...ws.map((x) => x.w))), oneLine: ws.every((x) => x.lines === 1), inside: ws.every((x) => x.right <= box.right + 1 && x.right <= innerWidth), longest: ws.sort((a, b) => b.w - a.w)[0].t }; });
		check(fit.oneLine && fit.inside && Math.abs(fit.boxW - fit.maxW) <= 1 && fit.longest === 'automations', `${vp.w}: every word on one line, box = longest word (${fit.boxW}px, "${fit.longest}")`);
		// incoming words wait 8px below the baseline (fade in upwards), outgoing words drop 8px
		const dirs = await page.evaluate(() => { const ws = [...document.querySelectorAll('.rotor .word')]; return { idle: ws.filter((e) => !e.classList.contains('current')).map((e) => getComputedStyle(e).transform), current: getComputedStyle(ws.find((e) => e.classList.contains('current'))).transform }; });
		check(dirs.idle.every((t) => t === 'matrix(1, 0, 0, 1, 0, 8)') && dirs.current === 'matrix(1, 0, 0, 1, 0, 0)', `${vp.w}: waiting words sit at +8px, the current word at 0 (${dirs.idle[0]} / ${dirs.current})`);
		// no horizontal document overflow, and the demo frame keeps its bounds across the three steps
		const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
		check(ov.sw <= ov.iw, `${vp.w}: no horizontal document overflow (${ov.sw} <= ${ov.iw})`);
		const demoBox = () => page.evaluate(() => { const r = document.querySelector('.demo').getBoundingClientRect(); return [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)]; });
		const d0 = await demoBox();
		let demoStable = true;
		for (const i of [1, 2, 0]) { await page.locator('.steps button').nth(i).click(); await sleep(400); if (!same(await demoBox(), d0)) demoStable = false; }
		check(demoStable, `${vp.w}: demo frame bounds identical across greeting / qualify / call booked (${d0.join(', ')})`);
		await page.evaluate(() => window.scrollTo(0, 0));
		await sleep(200);
		if (vp.w === 1440 || vp.w === 390) {
			// fresh load so the sample starts on "systems" (the earlier demo clicks already used up the first hold)
			await page.goto(url);
			await page.waitForSelector('.rotor');
			const b0 = await cycle(page, `${vp.w}`);
			check((await page.locator('.rotor-ctl, [aria-label*="changing word"]').count()) === 0, `${vp.w}: no pause / resume control`);
			check(same(await boxes(page), b0), `${vp.w}: layout unchanged after the cycle`);
		}
		if (vp.w === 1440) {
			// reduced motion at runtime: static "systems", no timer; back to no-preference resumes
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await sleep(300);
			const r1 = await visibleWord(page);
			await sleep(3200);
			check(r1 === 'systems' && (await visibleWord(page)) === 'systems' && (await page.evaluate(() => document.querySelector('.rotor').dataset.running)) === 'false', '1440: reduced motion shows a static "systems", no cycling');
			check(await page.evaluate(() => [...document.querySelectorAll('.rotor .word')].every((e) => { const cs = getComputedStyle(e); return cs.transitionProperty === 'none' || parseFloat(cs.transitionDuration) <= 0.001; })), '1440: reduced motion removes the transitions (no blank transitional state)');
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await sleep(3300);
			check((await visibleWord(page)) !== 'systems' && (await page.evaluate(() => document.querySelector('.rotor').dataset.running)) === 'true', '1440: back to no-preference, the cycle returns');
			// off screen: scroll the hero out, the cycle stops; back in view it continues
			await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
			await sleep(400);
			const off1 = await page.evaluate(() => document.querySelector('.rotor').dataset);
			const wOff = await visibleWord(page);
			await sleep(3200);
			check(off1.running === 'false' && (await visibleWord(page)) === wOff, `1440: off screen pauses the cycle (kept "${wOff}")`);
			await page.evaluate(() => window.scrollTo(0, 0));
			await sleep(3300);
			check((await page.evaluate(() => document.querySelector('.rotor').dataset.running)) === 'true' && (await visibleWord(page)) !== wOff, '1440: back on screen the cycle resumes');
			// hidden document: fake visibilityState, the component reads it through <svelte:document>
			await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
			await sleep(200);
			const wHid = await visibleWord(page);
			await sleep(3200);
			check((await page.evaluate(() => document.querySelector('.rotor').dataset.running)) === 'false' && (await visibleWord(page)) === wHid, `1440: hidden document pauses the cycle (kept "${wHid}")`);
			await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
			await sleep(3300);
			check((await visibleWord(page)) !== wHid, '1440: visible again, the cycle resumes without catch-up');
			// route unmount / remount: index view removes the hero, overview brings it back at "systems"
			await page.locator('.pill .switch button').nth(1).click();
			await page.waitForSelector('svg.map');
			check((await page.locator('.rotor').count()) === 0, '1440: index view unmounts the rotor');
			await sleep(3000);
			await page.locator('.pill .switch button').nth(0).click();
			await page.waitForSelector('.rotor');
			await sleep(150);
			check((await visibleWord(page)) === 'systems', '1440: remount starts again at "systems"');
		}
		check(errors.length === 0, `${vp.w}: no page or console errors (${errors.join(' | ')})`);
		await ctx.close();
	}

	// short recording: all five words, then back to systems (about 13 s)
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: path.join(shots, 'video'), size: { width: 1280, height: 720 } } });
	const page = await ctx.newPage();
	await page.goto(url);
	await page.waitForSelector('.rotor');
	await sleep(6 * 2060 + 800);
	const video = page.video();
	await ctx.close();
	const out = path.join(shots, 'headline.webm');
	fs.copyFileSync(await video.path(), out);
	fs.rmSync(path.join(shots, 'video'), { recursive: true, force: true });
	check(fs.statSync(out).size > 10000, `recording written to ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);

	await browser.close();
	console.log(failures ? `\n${failures} check(s) failed` : '\nall headline checks passed');
	process.exit(failures ? 1 : 0);
})();
