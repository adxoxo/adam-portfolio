<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: Record<string, any> | null } = $props();
	const rows = $derived((data.projects ?? []) as Record<string, any>[]);

	const CLUSTERS = ['ai', 'fullstack', 'automation', 'embedded'];
	const GROUPS = [
		{ key: 'featured', label: 'featured', hint: 'split card in selected work + full node on the map' },
		{ key: 'archive', label: 'archive', hint: 'one row in the archive + a pill on the map' },
		{ key: 'hidden', label: 'hidden', hint: 'draft, hidden from the public site' }
	];
	const byStatus = (s: string) => rows.filter((p) => p.status === s);
	const quickSubmit = (e: Event) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit();

	// Single-project editor. Values are copied into local $state on open and
	// two-way bound, so the fields always hold the real row values. (The old
	// admin rendered every project's form at once with unbound inputs, which
	// could submit blank and wipe a row.) Array/jsonb columns edit as text.
	let editing = $state<Record<string, any> | null>(null);

	function openEdit(p: Record<string, any>) {
		editing = {
			id: p.id,
			title: p.title ?? '',
			summary: p.summary ?? '',
			why: p.why ?? '',
			cluster: p.cluster ?? 'fullstack',
			status: p.status ?? 'hidden',
			year: p.year ?? '',
			sort_order: p.sort_order ?? 100,
			map_x: p.map_x ?? 50,
			map_y: p.map_y ?? 50,
			github_url: p.github_url ?? '',
			live_url: p.live_url ?? '',
			loom_id: p.loom_id ?? '',
			cover_image: p.cover_image ?? '',
			outcome: Array.isArray(p.outcome) ? p.outcome.join('\n') : '',
			schematic: Array.isArray(p.schematic) ? p.schematic.join(', ') : '',
			stack: Array.isArray(p.stack) ? p.stack.join(', ') : '',
			features: Array.isArray(p.features)
				? p.features.map((f: any) => `${f.label ?? ''} :: ${f.detail ?? ''}`).join('\n')
				: ''
		};
	}
	const closeEdit = () => (editing = null);

	// close the editor once a save round-trips successfully
	function saveSubmit() {
		return async ({ result, update }: { result: { type: string }; update: () => Promise<void> }) => {
			await update();
			if (result.type === 'success') editing = null;
		};
	}
</script>

<svelte:head><title>admin, adyu portfolio</title></svelte:head>

<div class="app">
	<main class="wrap admin">
		<div class="head">
			<h1>admin</h1>
			{#if data.configured && data.user}
				<span class="whoami mono">signed in as {data.user.email}</span>
			{/if}
		</div>

		{#if data.loginError}<p class="msg err">login failed: {data.loginError}</p>{/if}

		{#if !data.configured}
			<p class="note">
				supabase is not configured, so this is running on seed data. locally: set
				PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env. on cloudflare (workers): they
				ship committed in wrangler.jsonc, so just redeploy. run supabase-schema.sql once either
				way.
			</p>
		{:else if !data.user}
			<form method="POST" action="?/login" use:enhance class="login">
				<p class="note">sign in with a magic link. only the invited owner email works.</p>
				<label>email <input name="email" type="email" placeholder="you@example.com" required /></label>
				<button class="btn" type="submit">send magic link</button>
				{#if form?.sent}<p class="msg ok">check your inbox for the link.</p>{/if}
				{#if form?.message}<p class="msg err">{form.message}</p>{/if}
			</form>
		{:else if editing}
			<form method="POST" action="?/save" use:enhance={saveSubmit} class="editor">
				<div class="editor-bar">
					<div class="editor-title">
						<span class="mono eyebrow">editing project</span>
						<h2>{editing.title || editing.id}</h2>
					</div>
					<div class="bar-actions">
						<button type="button" class="btn btn--ghost sm" onclick={closeEdit}>cancel</button>
						<button type="submit" class="btn sm">save changes</button>
					</div>
				</div>

				{#if form?.message}<p class="msg err">{form.message}</p>{/if}
				<input type="hidden" name="id" value={editing.id} />

				<fieldset>
					<legend>basics</legend>
					<label class="wide">title <input name="title" bind:value={editing.title} /></label>
					<div class="grid3">
						<label>status
							<select name="status" bind:value={editing.status}>
								{#each GROUPS as g (g.key)}<option value={g.key}>{g.label}</option>{/each}
							</select>
						</label>
						<label>cluster
							<select name="cluster" bind:value={editing.cluster}>
								{#each CLUSTERS as c (c)}<option value={c}>{c}</option>{/each}
							</select>
						</label>
						<label>year <input name="year" bind:value={editing.year} /></label>
					</div>
				</fieldset>

				<fieldset>
					<legend>content</legend>
					<label class="wide">summary <textarea name="summary" rows="3" bind:value={editing.summary}></textarea></label>
					<label class="wide">why i built it <textarea name="why" rows="3" bind:value={editing.why}></textarea></label>
					<label class="wide">how it works <span class="hint">one per line, as "label :: detail"</span>
						<textarea name="features" rows="6" bind:value={editing.features}></textarea></label>
					<label class="wide">outcomes <span class="hint">one per line</span>
						<textarea name="outcome" rows="2" bind:value={editing.outcome}></textarea></label>
				</fieldset>

				<fieldset>
					<legend>links</legend>
					<label class="wide">github url <input name="github_url" bind:value={editing.github_url} placeholder="https://github.com/..." /></label>
					<label class="wide">live site url <input name="live_url" bind:value={editing.live_url} placeholder="https://..." /></label>
					<label class="wide">loom walkthrough id <input name="loom_id" bind:value={editing.loom_id} placeholder="the part after loom.com/share/" /></label>
					<label class="wide">cover image url <span class="hint">card poster when there is no loom</span>
						<input name="cover_image" bind:value={editing.cover_image} placeholder="https://..." /></label>
				</fieldset>

				<fieldset>
					<legend>map + tech</legend>
					<div class="grid3">
						<label>sort order <input name="sort_order" type="number" bind:value={editing.sort_order} /></label>
						<label>map x <input name="map_x" type="number" bind:value={editing.map_x} /></label>
						<label>map y <input name="map_y" type="number" bind:value={editing.map_y} /></label>
					</div>
					<label class="wide">schematic steps <span class="hint">comma separated</span>
						<input name="schematic" bind:value={editing.schematic} /></label>
					<label class="wide">stack <span class="hint">comma separated</span>
						<input name="stack" bind:value={editing.stack} /></label>
				</fieldset>

				<div class="editor-foot">
					<button type="button" class="btn btn--ghost sm" onclick={closeEdit}>cancel</button>
					<button type="submit" class="btn sm">save changes</button>
				</div>
			</form>
		{:else}
			<div class="toolbar">
				<div class="flash" aria-live="polite">
					{#if form?.synced != null}<span class="msg ok">synced {form.synced} of {form.total} from github</span>{/if}
					{#if form?.saved}<span class="msg ok">saved {form.saved}</span>{/if}
					{#if form?.created}<span class="msg ok">created {form.created}</span>{/if}
					{#if form?.message}<span class="msg err">{form.message}</span>{/if}
				</div>
				<div class="tools">
					<form method="POST" action="?/sync" use:enhance><button class="btn btn--ghost sm" type="submit">sync from github</button></form>
					<form method="POST" action="?/createDraft" use:enhance><button class="btn btn--ghost sm" type="submit">new draft</button></form>
					<form method="POST" action="?/logout" use:enhance><button class="btn btn--ghost sm" type="submit">log out</button></form>
				</div>
			</div>

			<p class="lead mono">status is the whole lever. move a project between groups with its dropdown, or open it to edit everything.</p>

			{#each GROUPS as g (g.key)}
				{@const items = byStatus(g.key)}
				<section class="group">
					<div class="group-head">
						<h2>{g.label} <span class="count mono">{items.length}</span></h2>
						<span class="group-hint mono">{g.hint}</span>
					</div>
					{#if items.length === 0}
						<p class="empty mono">nothing here yet.</p>
					{:else}
						<ul class="plist">
							{#each items as p (p.id)}
								<li class="prow">
									<div class="pmain">
										<span class="ptitle">{p.title || p.id}</span>
										<span class="pmeta mono">{p.cluster}{p.year ? ' · ' + p.year : ''}</span>
									</div>
									<div class="pactions">
										<form method="POST" action="?/setStatus" use:enhance class="statusform">
											<input type="hidden" name="id" value={p.id} />
											<label class="sr-only" for="s-{p.id}">status for {p.title || p.id}</label>
											<select id="s-{p.id}" name="status" value={p.status} onchange={quickSubmit}>
												{#each GROUPS as g2 (g2.key)}<option value={g2.key}>{g2.label}</option>{/each}
											</select>
										</form>
										<button type="button" class="btn btn--ghost sm" onclick={() => openEdit(p)}>edit</button>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			{/each}
		{/if}
	</main>
</div>

<style>
	.admin {
		padding: 120px 0 96px;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		border-bottom: 1px solid var(--border);
		padding-bottom: 16px;
	}
	.admin h1 { font-size: 36px; }
	.whoami { color: var(--ink-soft); }
	.note, .lead { color: var(--ink-soft); max-width: 68ch; line-height: 1.6; }
	.hint { color: var(--ink-soft); font-size: 12px; font-weight: 400; text-transform: none; }

	/* messages */
	.msg { font-size: 13px; font-weight: 500; text-transform: lowercase; }
	.msg.ok { color: var(--accent); }
	.msg.err { color: #ba1a1a; }

	/* login */
	.login { max-width: 420px; display: flex; flex-direction: column; gap: 14px; }

	/* toolbar */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
	}
	.tools { display: flex; gap: 8px; flex-wrap: wrap; }
	.flash { min-height: 18px; }

	/* status groups */
	.group { display: flex; flex-direction: column; gap: 10px; }
	.group-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
	.group-head h2 { font-size: 20px; display: flex; align-items: baseline; gap: 8px; }
	.count {
		color: var(--ink-soft);
		border: 1px solid var(--border);
		padding: 1px 8px;
		font-size: 11px;
	}
	.group-hint { color: var(--ink-soft); }
	.empty { color: var(--ink-soft); padding: 8px 0; }

	.plist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
	.prow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 16px;
		border: 1px solid var(--border);
		border-top: 0;
		background: var(--panel);
	}
	.plist .prow:first-child { border-top: 1px solid var(--border); }
	.prow:hover { background: var(--panel-hover); }
	.pmain { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
	.ptitle { font-size: 17px; text-transform: lowercase; }
	.pmeta { color: var(--ink-soft); }
	.pactions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
	.statusform { margin: 0; }

	/* editor */
	.editor { display: flex; flex-direction: column; gap: 22px; }
	.editor-bar, .editor-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.editor-bar { border-bottom: 1px solid var(--border); padding-bottom: 16px; }
	.editor-foot { border-top: 1px solid var(--border); padding-top: 16px; }
	.editor-title { display: flex; flex-direction: column; gap: 4px; }
	.editor-title h2 { font-size: 24px; }
	.eyebrow { color: var(--ink-soft); }
	.bar-actions { display: flex; gap: 8px; }

	fieldset {
		border: 1px solid var(--border);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	legend {
		font-family: var(--font-body);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-soft);
		padding: 0 8px;
	}
	.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		color: var(--ink-soft);
		text-transform: lowercase;
	}

	/* controls */
	select, input, textarea {
		font-family: var(--font-body);
		font-size: 15px;
		color: var(--ink);
		background: var(--bg);
		border: 1px solid var(--border-strong);
		padding: 10px 12px;
	}
	textarea { resize: vertical; line-height: 1.5; }
	select:focus, input:focus, textarea:focus {
		outline: 2px solid var(--focus);
		outline-offset: 1px;
		border-color: var(--focus);
	}
	.prow select { padding: 8px 10px; font-size: 13px; }

	/* smaller buttons for dense admin rows (overrides the global .btn size) */
	.pactions .btn.sm, .tools .btn.sm, .bar-actions .btn.sm, .editor-foot .btn.sm {
		padding: 9px 16px;
		font-size: 13px;
		letter-spacing: 0.03em;
	}

	.sr-only {
		position: absolute;
		width: 1px; height: 1px;
		padding: 0; margin: -1px;
		overflow: hidden; clip: rect(0, 0, 0, 0);
		white-space: nowrap; border: 0;
	}

	@media (max-width: 640px) {
		.admin { padding: 96px 0 64px; }
		.grid3 { grid-template-columns: 1fr; }
		.prow { flex-direction: column; align-items: stretch; }
		.pactions { justify-content: space-between; }
	}
</style>
