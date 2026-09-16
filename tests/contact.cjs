// Contact dialog against a running server, with /api/lead and /api/schedule
// intercepted in the browser so no lead, no call request, no database row and
// no notification is ever produced.
//   BASE_URL=http://127.0.0.1:8788 node tests/contact.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT_DIR || 'playwright');

const url = (process.env.BASE_URL || 'http://127.0.0.1:8788').replace(/\/$/, '') + '/';
const shots = process.env.SHOTS_DIR || path.join(require('os').tmpdir(), 'adam-portfolio-shots');
fs.mkdirSync(shots, { recursive: true });

let failures = 0;
const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) failures++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// where the dialog puts focus on open and after a form-mode change (ContactDialog.focusStart)
const startFocus = (vp) => (vp.width <= 640 ? 'cd-title' : 'cf-name');

// one dialog session: open from the contact section, fill, submit against a scripted /api/lead
async function session(browser, vp, name, reply, body) {
	const ctx = await browser.newContext({ viewport: vp });
	const page = await ctx.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
	const posts = [];
	const schedulePosts = [];
	await page.route('**/api/lead', async (route) => {
		posts.push(route.request().postDataJSON());
		if (reply === 'abort') return route.abort('failed');
		return route.fulfill(reply);
	});
	await page.route('**/api/schedule', async (route) => {
		schedulePosts.push(route.request().postDataJSON());
		if (reply === 'abort') return route.abort('failed');
		return route.fulfill(reply);
	});
	await page.goto(url + '#contact');
	await page.waitForSelector('#contact');
	await page.locator('#contact .btn', { hasText: 'send a message' }).click();
	await page.waitForSelector('dialog[open] form');
	// a phone starts on the title (the keyboard waits until the visitor picks a field), a wide screen in the name field
	check(await page.evaluate(() => document.activeElement?.id) === startFocus(vp), `${name}: focus starts ${vp.width <= 640 ? 'on the title' : 'in the name field'}`);
	if (body?.call) {
		await page.locator('dialog[open] .modes button', { hasText: 'request a call' }).click();
		await page.waitForSelector('#cf-date');
	}
	if (body) {
		if (body.name !== undefined) await page.fill('#cf-name', body.name);
		if (body.email !== undefined) await page.fill('#cf-email', body.email);
		if (body.need !== undefined) await page.selectOption('#cf-need', body.need);
		if (body.message !== undefined) await page.fill('#cf-msg', body.message);
		if (body.date !== undefined) await page.fill('#cf-date', body.date);
		if (body.time !== undefined) await page.fill('#cf-time', body.time);
		if (body.note !== undefined) await page.fill('#cf-note', body.note);
	}
	await page.locator('dialog[open] button[type="submit"]').click();
	await sleep(500);
	return { page, ctx, posts, schedulePosts, errors };
}

(async () => {
	const browser = await chromium.launch({ args: ['--no-sandbox'] });
	const ok = { status: 200, contentType: 'application/json', body: '{"ok":true}' };
	for (const vp of [{ width: 1440, height: 1000 }, { width: 320, height: 700 }]) {
		console.log(`\n== ${vp.width}x${vp.height}`);

		// client validation: nothing is sent while a field is invalid
		let s = await session(browser, vp, 'empty submit', ok, {});
		check(s.posts.length === 0, 'empty form: no request sent');
		check((await s.page.locator('dialog[open] .err').count()) === 3 && (await s.page.evaluate(() => document.activeElement?.id === 'cf-name')), 'empty form: three field errors, focus on the first invalid field');
		check(await s.page.evaluate(() => document.getElementById('cf-name').getAttribute('aria-invalid') === 'true' && document.getElementById('cf-name').getAttribute('aria-describedby') === 'cf-name-err'), 'empty form: aria-invalid and aria-describedby set');
		await s.page.fill('#cf-name', 'test person');
		await s.page.fill('#cf-email', 'not-an-email');
		await s.page.fill('#cf-msg', 'a message');
		await s.page.locator('dialog[open] button[type="submit"]').click();
		await sleep(300);
		check(s.posts.length === 0 && (await s.page.locator('#cf-email-err').count()) === 1 && (await s.page.evaluate(() => document.activeElement?.id === 'cf-email')), 'bad email: no request, email error, focus on the email field');
		await s.page.screenshot({ path: path.join(shots, `contact-validation-${vp.width}.png`) });
		await s.ctx.close();

		// success: one JSON post with the contract fields and the context lines, then the success panel
		s = await session(browser, vp, 'success', ok, { name: '  test person ', email: 'person@example.com', need: 'ai', message: 'we answer the same questions every day.' });
		check(s.posts.length === 1 && Object.keys(s.posts[0]).sort().join(',') === 'email,message,name', `success: one post with exactly {name,email,message} (${JSON.stringify(s.posts[0])})`);
		check(s.posts[0]?.name === 'test person' && s.posts[0]?.email === 'person@example.com', 'success: name and email trimmed');
		check(/^we answer the same questions every day\.\n\n---\nneed: ai tools & assistants$/.test(s.posts[0]?.message ?? ''), 'success: message carries the need as a context line');
		const okText = await s.page.locator('dialog[open] .form-result').innerText();
		check(okText.startsWith('received.') && (await s.page.locator('dialog[open] input').count()) === 0, 'success: "received" panel replaces the form');
		check(!/nowhere else|inbox|within .* days|will reply/.test(okText) && !/nowhere else/.test(await s.page.evaluate(() => document.body.innerText)), 'success: acceptance wording only, no delivery or deadline promise');
		check(await s.page.evaluate(() => document.activeElement?.classList.contains('form-result')), 'success: focus moves to the success panel');
		await s.page.screenshot({ path: path.join(shots, `contact-success-${vp.width}.png`) });
		await s.page.keyboard.press('Escape');
		await sleep(200);
		check((await s.page.locator('dialog[open]').count()) === 0 && (await s.page.evaluate(() => document.activeElement?.textContent.trim() === 'send a message')), 'success: escape closes and focus returns to the opener');
		await s.ctx.close();

		// server rejects (500): error panel, fields kept, retry re-posts, email fallback carries the message
		s = await session(browser, vp, 'server error', { status: 500, contentType: 'application/json', body: '{"ok":false,"error":"boom"}' }, { name: 'test person', email: 'person@example.com', message: 'hello there' });
		check(s.posts.length === 1 && (await s.page.locator('dialog[open] .form-result.error').count()) === 1, 'server error: error panel shown');
		check((await s.page.locator('#cf-msg').inputValue()) === 'hello there' && (await s.page.locator('dialog[open] button[type="submit"]').innerText()).toLowerCase().includes('try again'), 'server error: fields kept, button offers try again');
		const mailto = await s.page.locator('dialog[open] .form-result.error a').getAttribute('href');
		check(mailto.startsWith('mailto:adamgemenez@gmail.com?subject=') && decodeURIComponent(mailto).includes('hello there'), 'server error: email fallback link carries the message');
		check((await s.page.locator('dialog[open] .form-result').innerText()).includes('sent') === false, 'server error: no false success wording');
		await s.page.screenshot({ path: path.join(shots, `contact-error-${vp.width}.png`) });
		await s.page.unroute('**/api/lead');
		await s.page.route('**/api/lead', (route) => { s.posts.push(route.request().postDataJSON()); route.fulfill(ok); });
		await s.page.locator('dialog[open] button[type="submit"]').click();
		await sleep(400);
		check(s.posts.length === 2 && (await s.page.locator('dialog[open] .form-result').innerText()).startsWith('received.'), 'server error: retry re-posts and succeeds');
		await s.ctx.close();

		// rate limit (429): specific wording
		s = await session(browser, vp, 'rate limit', { status: 429, contentType: 'application/json', body: '{"ok":false,"error":"rate_limited"}' }, { name: 'test person', email: 'person@example.com', message: 'hello' });
		check((await s.page.locator('dialog[open] .form-result.error').innerText()).includes('too many requests'), 'rate limit: explains the limit');
		await s.ctx.close();

		// network failure: error panel, no crash
		s = await session(browser, vp, 'network', 'abort', { name: 'test person', email: 'person@example.com', message: 'hello' });
		// the browser logs its own "Failed to load resource" for the aborted request; that is the failure under test, not a defect
		check((await s.page.locator('dialog[open] .form-result.error').innerText()).includes('no connection') && s.errors.filter((e) => !/Failed to load resource/.test(e)).length === 0, 'network failure: explained, no page errors');
		await s.ctx.close();

		// loading state: the button is disabled while the request is pending
		const ctx = await browser.newContext({ viewport: vp });
		const page = await ctx.newPage();
		let release;
		await page.route('**/api/lead', async (route) => { await new Promise((r) => (release = r)); route.fulfill(ok); });
		await page.goto(url + '#contact');
		await page.locator('#contact .btn', { hasText: 'send a message' }).click();
		await page.waitForSelector('dialog[open] form');
		await page.fill('#cf-name', 'test person'); await page.fill('#cf-email', 'person@example.com'); await page.fill('#cf-msg', 'hello');
		await page.locator('dialog[open] button[type="submit"]').click();
		await sleep(200);
		check(await page.evaluate(() => { const b = document.querySelector('dialog[open] button[type="submit"]'); return b.disabled && b.textContent.includes('sending') && document.querySelector('dialog[open] form').getAttribute('aria-busy') === 'true'; }), 'pending: submit disabled, "sending", form aria-busy');
		release();
		await sleep(300);
		check((await page.locator('dialog[open] .form-result').innerText()).startsWith('received.'), 'pending: resolves to the success panel');
		await ctx.close();

		// ---- request a call (/api/schedule) ----
		// validation: date and time required, nothing sent; the message form's fields are not required here
		s = await session(browser, vp, 'call empty', ok, { call: true, name: 'test person', email: 'person@example.com' });
		check(s.schedulePosts.length === 0 && s.posts.length === 0, 'call: missing date and time send nothing');
		check((await s.page.locator('#cf-date-err').count()) === 1 && (await s.page.locator('#cf-time-err').count()) === 1 && (await s.page.evaluate(() => document.activeElement?.id === 'cf-date')), 'call: date and time errors, focus on the date field');
		check((await s.page.locator('#cf-msg').count()) === 0 && (await s.page.locator('#cf-date').getAttribute('min')) !== null, 'call: message field hidden, date has a minimum');
		check(/not booked automatically|not a booking/.test(await s.page.locator('dialog[open]').innerText()) && !/calendly/i.test(await s.page.locator('dialog[open]').innerText()), 'call: labelled as a request, no calendly');
		await s.page.screenshot({ path: path.join(shots, `call-validation-${vp.width}.png`) });
		await s.ctx.close();

		// success: exactly {name,email,date,time,note} to /api/schedule, nothing to /api/lead, acceptance-only wording
		s = await session(browser, vp, 'call success', ok, { call: true, name: 'test person', email: 'person@example.com', date: '2030-01-15', time: '10:30', note: 'booking pages' });
		check(s.schedulePosts.length === 1 && s.posts.length === 0 && Object.keys(s.schedulePosts[0]).sort().join(',') === 'date,email,name,note,time', `call success: one post to /api/schedule with the schedule contract (${JSON.stringify(s.schedulePosts[0])})`);
		check(s.schedulePosts[0]?.date === '2030-01-15' && s.schedulePosts[0]?.time === '10:30' && s.schedulePosts[0]?.note === 'booking pages', 'call success: date, time and note as entered');
		const callText = await s.page.locator('dialog[open] .form-result').innerText();
		check(callText.startsWith('received.') && /not a booking yet/.test(callText) && /confirms the time by email/.test(callText), 'call success: received, explicitly not booked, confirmed manually by email');
		check(await s.page.evaluate(() => document.activeElement?.classList.contains('form-result')), 'call success: focus moves to the panel');
		await s.page.screenshot({ path: path.join(shots, `call-success-${vp.width}.png`) });
		// back to the message form from the success panel, name and email kept
		await s.page.locator('dialog[open] .textlink', { hasText: 'send a message as well' }).click();
		await s.page.waitForSelector('#cf-msg');
		check((await s.page.locator('#cf-name').inputValue()) === 'test person' && (await s.page.evaluate(() => document.activeElement?.id)) === startFocus(vp), 'call success: returns to the message form with name and email kept, focus at the start');
		await s.page.keyboard.press('Escape');
		await sleep(200);
		check((await s.page.locator('dialog[open]').count()) === 0 && (await s.page.evaluate(() => document.activeElement?.textContent.trim() === 'send a message')), 'call: escape closes and focus returns to the opener');
		await s.ctx.close();

		// 502 send_failed (the route's webhook failure): error panel, retry, mailto fallback with the request
		s = await session(browser, vp, 'call 502', { status: 502, contentType: 'application/json', body: '{"ok":false,"error":"send_failed"}' }, { call: true, name: 'test person', email: 'person@example.com', date: '2030-01-15', time: '10:30' });
		check(s.schedulePosts.length === 1 && (await s.page.locator('dialog[open] .form-result.error').innerText()).includes('call request could not be delivered'), 'call 502: error panel explains');
		const callMail = await s.page.locator('dialog[open] .form-result.error a').getAttribute('href');
		check(decodeURIComponent(callMail).includes('preferred date: 2030-01-15') && (await s.page.locator('#cf-date').inputValue()) === '2030-01-15', 'call 502: mailto fallback carries the request, fields kept');
		await s.page.screenshot({ path: path.join(shots, `call-error-${vp.width}.png`) });
		await s.page.unroute('**/api/schedule');
		await s.page.route('**/api/schedule', (route) => { s.schedulePosts.push(route.request().postDataJSON()); route.fulfill(ok); });
		await s.page.locator('dialog[open] button[type="submit"]').click();
		await sleep(400);
		check(s.schedulePosts.length === 2 && (await s.page.locator('dialog[open] .form-result').innerText()).startsWith('received.'), 'call 502: retry re-posts and succeeds');
		await s.ctx.close();

		// network failure and pending state for the call form
		s = await session(browser, vp, 'call network', 'abort', { call: true, name: 'test person', email: 'person@example.com', date: '2030-01-15', time: '10:30' });
		check((await s.page.locator('dialog[open] .form-result.error').innerText()).includes('no connection') && s.errors.filter((e) => !/Failed to load resource/.test(e)).length === 0, 'call network failure: explained, no page errors');
		await s.ctx.close();
		// switching modes while idle keeps name and email and clears errors
		s = await session(browser, vp, 'switch', ok, {});
		await s.page.fill('#cf-name', 'kept'); await s.page.fill('#cf-email', 'kept@example.com');
		await s.page.locator('dialog[open] .modes button', { hasText: 'request a call' }).click();
		await s.page.waitForSelector('#cf-date');
		check((await s.page.locator('#cf-name').inputValue()) === 'kept' && (await s.page.locator('dialog[open] .err').count()) === 0 && (await s.page.locator('#cd-title').innerText()) === 'request a call', 'switching to the call form keeps name and email, clears errors, retitles');
		await s.ctx.close();
	}
	await browser.close();
	console.log(failures ? `\n${failures} check(s) failed` : '\nall contact checks passed');
	process.exit(failures ? 1 : 0);
})();
