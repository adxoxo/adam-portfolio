import { component$, useSignal, useStyles$, useTask$ } from '@qwik.dev/core';
import { Form, routeAction$, routeLoader$, type DocumentHead, type RequestEventBase } from '@qwik.dev/router';
import { buildProjectPatch, loomThumb, type AdminForm } from '~/lib/server/admin';
import { supabaseConfigured } from '~/lib/server/env';
import {
	createServerSupabase,
	forgetVerifiedUser
} from '~/lib/server/supabase';
import { getOwnerEmail, getVerifiedOwner, isOwnerEmail } from '~/lib/server/owner';
import { checkRateLimit } from '~/lib/server/security';
import { runRepoSync } from '~/lib/server/sync';
import styles from './admin.css?inline';

type Row = Record<string, any>;

const CLUSTERS = ['ai', 'fullstack', 'automation', 'embedded'];
const SOURCES = ['manual', 'github'];
const GROUPS = [
	{ key: 'featured', label: 'featured', hint: 'highlighted in selected work + on the map' },
	{ key: 'archive', label: 'archive', hint: 'in the full project collection + on the map' },
	{ key: 'hidden', label: 'hidden', hint: 'draft, hidden from the public site' }
];

// ---------------------------------------------------------------- server

export const useAdminData = routeLoader$(async (event) => {
	// Per-user page: never cached anywhere.
	event.headers.set('Cache-Control', 'private, no-store');
	// A failed magic-link exchange redirects here with ?error=; surface it.
	const loginError = event.url.searchParams.get('error');
	const supabase = createServerSupabase(event);
	if (!supabaseConfigured(event) || !supabase) {
		return { configured: false, user: null, projects: [] as Row[], loginError, loadError: null };
	}
	const user = await getVerifiedOwner(event);
	if (!user) return { configured: true, user: null, projects: [] as Row[], loginError, loadError: null };

	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.order('sort_order', { ascending: true });
	return {
		configured: true,
		user: { email: user.email ?? '' },
		projects: (data ?? []) as Row[],
		loginError,
		loadError: error ? error.message : null
	};
},
// The editor renders client-side from these rows, so ship them with the page
// (owner-only HTML) instead of lazily re-fetching the loader on first use.
{ serializationStrategy: 'always' });

async function authorizeOwnerWrite(event: RequestEventBase) {
	const user = await getVerifiedOwner(event);
	if (!user) return { ok: false as const, status: 401 as const, message: 'unauthorized' };
	const rate = await checkRateLimit(event, 'ADMIN_WRITE_RATE_LIMITER', user.id);
	if (rate === 'limited') return { ok: false as const, status: 429 as const, message: 'rate limited' };
	if (rate === 'unavailable') {
		return { ok: false as const, status: 503 as const, message: 'rate limit unavailable' };
	}
	return { ok: true as const, user };
}

export const useLogin = routeAction$(async (data, event) => {
	const supabase = createServerSupabase(event);
	if (!supabase) return event.fail(400, { message: 'supabase not configured' });
	const email = String(data.email ?? '').trim();
	if (!email) return event.fail(400, { message: 'email required' });
	if (!getOwnerEmail(event)) return event.fail(503, { message: 'owner login is not configured' });
	if (!isOwnerEmail(event, email)) return event.fail(403, { message: 'unauthorized' });
	const rate = await checkRateLimit(event, 'LOGIN_RATE_LIMITER', email.toLowerCase());
	if (rate === 'limited') return event.fail(429, { message: 'rate limited' });
	if (rate === 'unavailable') return event.fail(503, { message: 'rate limit unavailable' });
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: { emailRedirectTo: `${event.url.origin}/auth/callback`, shouldCreateUser: false }
	});
	if (error) return event.fail(400, { message: error.message });
	return { sent: true };
});

export const useLogout = routeAction$(
	async (_data, event) => {
		await createServerSupabase(event)?.auth.signOut();
		forgetVerifiedUser(event);
		return { ok: true };
	},
	{ invalidate: [useAdminData] }
);

export const useSave = routeAction$(
	async (data, event) => {
		const auth = await authorizeOwnerWrite(event);
		if (!auth.ok) return event.fail(auth.status, { message: auth.message });
		const supabase = createServerSupabase(event)!;
		const f = data as AdminForm;
		const id = String(f.id ?? '');
		if (!id) return event.fail(400, { message: 'missing id' });

		// Merge onto the existing row: only fields the form submitted are written.
		const { data: existing, error: readErr } = await supabase
			.from('projects')
			.select('*')
			.eq('id', id)
			.maybeSingle();
		if (readErr) return event.fail(400, { message: readErr.message });
		if (!existing) return event.fail(404, { message: 'project not found' });

		const patch = buildProjectPatch(f, existing as Row);
		if (Object.keys(patch).length === 0) return { saved: id };
		const { error } = await supabase.from('projects').update(patch).eq('id', id);
		if (error) return event.fail(400, { message: error.message });

		// best-effort: cache the loom oEmbed thumbnail in a second write, so a loom
		// hiccup or an un-migrated loom_thumb column can never break the save itself.
		if (Object.prototype.hasOwnProperty.call(f, 'loom_id')) {
			const lid = String(f.loom_id ?? '').trim();
			const thumb = lid ? await loomThumb(lid) : null;
			await supabase.from('projects').update({ loom_thumb: thumb }).eq('id', id);
		}
		return { saved: id };
	},
	{ invalidate: [useAdminData] }
);

export const useSetStatus = routeAction$(
	async (data, event) => {
		const auth = await authorizeOwnerWrite(event);
		if (!auth.ok) return event.fail(auth.status, { message: auth.message });
		const id = String(data.id ?? '');
		const status = String(data.status ?? 'hidden');
		const { error } = await createServerSupabase(event)!
			.from('projects')
			.update({ status })
			.eq('id', id);
		if (error) return event.fail(400, { message: error.message });
		return { statusSet: id };
	},
	{ invalidate: [useAdminData] }
);

export const useCreateDraft = routeAction$(
	async (_data, event) => {
		const auth = await authorizeOwnerWrite(event);
		if (!auth.ok) return event.fail(auth.status, { message: auth.message });
		const id = `draft_${Date.now()}`;
		const { error } = await createServerSupabase(event)!
			.from('projects')
			.insert({ id, title: 'new project', status: 'hidden', source: 'manual' });
		if (error) return event.fail(400, { message: error.message });
		return { created: id };
	},
	{ invalidate: [useAdminData] }
);

export const useSync = routeAction$(
	async (_data, event) => {
		const result = await runRepoSync(event);
		if (!result.ok) return event.fail(result.status, { message: `sync failed: ${result.error}` });
		return result.mode === 'supabase'
			? { synced: result.added, total: result.total }
			: { dryRun: true, total: result.count };
	},
	{ invalidate: [useAdminData] }
);

// ---------------------------------------------------------------- client

const failMessage = (v: unknown): string | null =>
	v && typeof v === 'object' && 'failed' in v ? String((v as { message?: unknown }).message ?? 'failed') : null;

const lines = (v: unknown, sep: string) => (Array.isArray(v) ? v.join(sep) : '');
const featureLines = (v: unknown) =>
	Array.isArray(v) ? v.map((f: Row) => `${f?.label ?? ''} :: ${f?.detail ?? ''}`).join('\n') : '';

export default component$(() => {
	useStyles$(styles);
	const data = useAdminData();
	const login = useLogin();
	const logout = useLogout();
	const save = useSave();
	const setStatus = useSetStatus();
	const createDraft = useCreateDraft();
	const sync = useSync();

	// Single-project editor. Fields start from the real row values, so a save
	// only ever submits what the row already holds plus the owner's edits.
	const editingId = useSignal<string | null>(null);
	const flash = useSignal<{ ok: boolean; text: string } | null>(null);

	useTask$(({ track }) => {
		const v = track(() => save.value);
		if (!v) return;
		const err = failMessage(v);
		if (err) {
			flash.value = { ok: false, text: err };
		} else if ('saved' in v) {
			flash.value = { ok: true, text: `saved ${v.saved}` };
			editingId.value = null; // close the editor once a save round-trips
		}
	});
	useTask$(({ track }) => {
		const v = track(() => sync.value);
		if (!v) return;
		const err = failMessage(v);
		flash.value = err
			? { ok: false, text: err }
			: 'dryRun' in v
				? { ok: true, text: `dry run: ${v.total} repos found, nothing saved` }
				: 'synced' in v
					? { ok: true, text: `synced ${v.synced} of ${v.total} from github` }
					: null;
	});
	useTask$(({ track }) => {
		const v = track(() => createDraft.value);
		if (!v) return;
		const err = failMessage(v);
		flash.value = err ? { ok: false, text: err } : 'created' in v ? { ok: true, text: `created ${v.created}` } : null;
	});
	useTask$(({ track }) => {
		const v = track(() => setStatus.value);
		const err = failMessage(v);
		if (err) flash.value = { ok: false, text: err };
	});

	const d = data.value;
	const rows = d.projects;
	const editing = editingId.value ? rows.find((r) => r.id === editingId.value) ?? null : null;
	const loginErr = failMessage(login.value);
	const saveErr = failMessage(save.value);

	return (
		<div class="adm">
			<main class="adm-wrap">
				<div class="head">
					<h1>admin</h1>
					{d.configured && d.user && <span class="whoami mono">signed in as {d.user.email}</span>}
				</div>

				{d.loginError && <p class="msg err">login failed: {d.loginError}</p>}
				{d.loadError && <p class="msg err">could not load projects: {d.loadError}</p>}

				{!d.configured ? (
					<p class="note">
						supabase is not configured, so this is running on seed data. locally: run the built worker
						with wrangler (it reads PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY from
						wrangler.jsonc). on cloudflare (workers): they ship committed in wrangler.jsonc, so just
						redeploy. run supabase-schema.sql, invite the owner, then run supabase-owner-hardening.sql.
					</p>
				) : !d.user ? (
					<Form action={login} class="login">
						<p class="note">sign in with a magic link. only the invited owner email works.</p>
						<label>
							email <input name="email" type="email" placeholder="you@example.com" autocomplete="email" required />
						</label>
						<button class="btn" type="submit" disabled={login.isRunning}>
							send magic link
						</button>
						<div aria-live="polite">
							{login.value && 'sent' in login.value && <p class="msg ok">check your inbox for the link.</p>}
							{loginErr && <p class="msg err">{loginErr}</p>}
						</div>
					</Form>
				) : editing ? (
					<Form action={save} class="editor" key={editing.id}>
						<div class="editor-bar">
							<div class="editor-title">
								<span class="mono eyebrow">editing project</span>
								<h2>{editing.title || editing.id}</h2>
							</div>
							<div class="bar-actions">
								<button type="button" class="btn btn--ghost" onClick$={() => (editingId.value = null)}>
									cancel
								</button>
								<button type="submit" class="btn" disabled={save.isRunning}>
									save changes
								</button>
							</div>
						</div>

						{saveErr && <p class="msg err">{saveErr}</p>}
						<input type="hidden" name="id" value={editing.id} />

						<fieldset>
							<legend>basics</legend>
							<label>
								title <input name="title" value={editing.title ?? ''} />
							</label>
							<div class="grid4">
								<label>
									status
									<select name="status">
										{GROUPS.map((g) => (
											<option key={g.key} value={g.key} selected={(editing.status ?? 'hidden') === g.key}>
												{g.label}
											</option>
										))}
									</select>
								</label>
								<label>
									cluster
									<select name="cluster">
										{CLUSTERS.map((c) => (
											<option key={c} value={c} selected={(editing.cluster ?? 'fullstack') === c}>
												{c}
											</option>
										))}
									</select>
								</label>
								<label>
									year <input name="year" value={editing.year ?? ''} />
								</label>
								<label>
									source
									<select name="source">
										{SOURCES.map((s) => (
											<option key={s} value={s} selected={(editing.source ?? 'manual') === s}>
												{s}
											</option>
										))}
									</select>
								</label>
							</div>
						</fieldset>

						<fieldset>
							<legend>content</legend>
							<label>
								summary <textarea name="summary" rows={3} value={editing.summary ?? ''} />
							</label>
							<label>
								why i built it <textarea name="why" rows={3} value={editing.why ?? ''} />
							</label>
							<label>
								<span>
									how it works <span class="hint">one per line, as "label :: detail"</span>
								</span>
								<textarea name="features" rows={6} value={featureLines(editing.features)} />
							</label>
							<label>
								<span>
									outcomes <span class="hint">one per line</span>
								</span>
								<textarea name="outcome" rows={2} value={lines(editing.outcome, '\n')} />
							</label>
						</fieldset>

						{'system_detail' in editing && (
							<fieldset>
								<legend>system detail</legend>
								<p class="hint">
									shown as the system legend in the project detail. other stored keys (like the diagram
									metadata) are kept as they are.
								</p>
								<label>
									summary <textarea name="sd_summary" rows={2} value={editing.system_detail?.summary ?? ''} />
								</label>
								<label>
									delivery status{' '}
									<input name="sd_delivery_status" value={editing.system_detail?.deliveryStatus ?? ''} />
								</label>
								<label>
									<span>
										legend <span class="hint">one per line, as "label :: detail"</span>
									</span>
									<textarea name="sd_legend" rows={6} value={featureLines(editing.system_detail?.legend)} />
								</label>
							</fieldset>
						)}

						<fieldset>
							<legend>links + media</legend>
							<label>
								github url <input name="github_url" value={editing.github_url ?? ''} placeholder="https://github.com/..." />
							</label>
							<label>
								live site url <input name="live_url" value={editing.live_url ?? ''} placeholder="https://..." />
							</label>
							<label>
								<span>
									loom walkthrough id{' '}
									<span class="hint">fallback only: the site plays the local demo video when one exists</span>
								</span>
								<input name="loom_id" value={editing.loom_id ?? ''} placeholder="the part after loom.com/share/" />
							</label>
							{editing.loom_thumb && <p class="readonly">cached loom thumbnail: {editing.loom_thumb}</p>}
							<label>
								<span>
									cover image url <span class="hint">card poster when there is no video</span>
									{!('cover_image' in editing) && (
										<span class="hint"> (this database has no cover_image column yet; a value will fail to save)</span>
									)}
								</span>
								<input name="cover_image" value={editing.cover_image ?? ''} placeholder="https://..." />
							</label>
						</fieldset>

						<fieldset>
							<legend>map + tech</legend>
							<div class="grid3">
								<label>
									sort order <input name="sort_order" type="number" step="any" value={editing.sort_order ?? 100} />
								</label>
								<label>
									map x <input name="map_x" type="number" step="any" value={editing.map_x ?? 50} />
								</label>
								<label>
									map y <input name="map_y" type="number" step="any" value={editing.map_y ?? 50} />
								</label>
							</div>
							<label>
								<span>
									schematic steps <span class="hint">comma separated</span>
								</span>
								<input name="schematic" value={lines(editing.schematic, ', ')} />
							</label>
							<label>
								<span>
									stack <span class="hint">comma separated</span>
								</span>
								<input name="stack" value={lines(editing.stack, ', ')} />
							</label>
						</fieldset>

						<div class="editor-foot">
							<button type="button" class="btn btn--ghost" onClick$={() => (editingId.value = null)}>
								cancel
							</button>
							<button type="submit" class="btn" disabled={save.isRunning}>
								save changes
							</button>
						</div>
					</Form>
				) : (
					<>
						<div class="toolbar">
							<div class="flash" aria-live="polite">
								{flash.value && <span class={['msg', flash.value.ok ? 'ok' : 'err']}>{flash.value.text}</span>}
							</div>
							<div class="tools">
								<Form action={sync}>
									<button class="btn btn--ghost" type="submit" disabled={sync.isRunning}>
										sync from github
									</button>
								</Form>
								<Form action={createDraft}>
									<button class="btn btn--ghost" type="submit" disabled={createDraft.isRunning}>
										new draft
									</button>
								</Form>
								<Form action={logout}>
									<button class="btn btn--ghost" type="submit" disabled={logout.isRunning}>
										log out
									</button>
								</Form>
							</div>
						</div>

						<p class="lead mono">
							status is the whole lever. move a project between groups with its dropdown, or open it to edit
							everything.
						</p>

						{GROUPS.map((g) => {
							const items = rows.filter((p) => p.status === g.key);
							return (
								<section class="group" key={g.key}>
									<div class="group-head">
										<h2>
											{g.label} <span class="count mono">{items.length}</span>
										</h2>
										<span class="group-hint mono">{g.hint}</span>
									</div>
									{items.length === 0 ? (
										<p class="empty mono">nothing here yet.</p>
									) : (
										<ul class="plist">
											{items.map((p) => (
												<li class="prow" key={p.id}>
													<div class="pmain">
														<span class="ptitle">{p.title || p.id}</span>
														<span class="pmeta mono">
															{p.id} · {p.cluster}
															{p.year ? ' · ' + p.year : ''} · order {p.sort_order ?? 100}
															{p.source === 'github' && <span class="tag">github</span>}
														</span>
													</div>
													<div class="pactions">
														<Form action={setStatus} class="statusform">
															<input type="hidden" name="id" value={p.id} />
															<label class="sr-only" for={`s-${p.id}`}>
																status for {p.title || p.id}
															</label>
															<select
																id={`s-${p.id}`}
																name="status"
																onChange$={(_, el) => el.form?.requestSubmit()}
															>
																{GROUPS.map((g2) => (
																	<option key={g2.key} value={g2.key} selected={p.status === g2.key}>
																		{g2.label}
																	</option>
																))}
															</select>
														</Form>
														<button
															type="button"
															class="btn btn--ghost"
															onClick$={() => {
																flash.value = null;
																editingId.value = p.id;
															}}
														>
															edit
														</button>
													</div>
												</li>
											))}
										</ul>
									)}
								</section>
							);
						})}
					</>
				)}
			</main>
		</div>
	);
});

export const head: DocumentHead = {
	title: 'admin, adam portfolio',
	meta: [{ name: 'robots', content: 'noindex, nofollow' }]
};
