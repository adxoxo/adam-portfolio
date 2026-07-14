<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	// form is a union across all actions; keep it loose for template access
	let { data, form }: { data: PageData; form: Record<string, any> | null } = $props();
	const rows = $derived((data.projects ?? []) as Record<string, string | number | string[]>[]);

	const clusters = ['ai', 'fullstack', 'automation', 'embedded'];
	const statuses = ['featured', 'archive', 'hidden'];
	const quickSubmit = (e: Event) =>
		(e.currentTarget as HTMLSelectElement).form?.requestSubmit();
</script>

<svelte:head><title>admin, adyu portfolio</title></svelte:head>

<div class="app">
	<main class="wrap admin">
		<h1>admin</h1>

		{#if !data.configured}
			<p class="note">
				supabase is not configured. add PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY to
				.env, run supabase-schema.sql, then reload. until then the public site runs on the seed
				data.
			</p>
		{:else if !data.user}
			<form method="POST" action="?/login" use:enhance class="form login">
				<p>sign in with a magic link. only the invited owner email works.</p>
				<div class="field">
					<label for="email">email</label>
					<input id="email" name="email" type="email" placeholder="you@example.com" required />
				</div>
				<button class="btn" type="submit">send magic link</button>
				{#if form?.sent}<p class="ok mono">check your inbox for the link.</p>{/if}
				{#if form?.message}<p class="err mono">{form.message}</p>{/if}
			</form>
		{:else}
			<div class="admin-head">
				<span class="mono">signed in as {data.user.email}</span>
				<div class="row-actions">
					<form method="POST" action="?/sync" use:enhance>
						<button class="btn btn--ghost" type="submit">sync from github</button>
					</form>
					<form method="POST" action="?/createDraft" use:enhance>
						<button class="btn btn--ghost" type="submit">new draft</button>
					</form>
					<form method="POST" action="?/logout" use:enhance>
						<button class="btn btn--ghost" type="submit">log out</button>
					</form>
				</div>
			</div>

			{#if form?.synced != null}<p class="ok mono">sync done: added {form.synced} of {form.total}.</p>{/if}
			{#if form?.saved}<p class="ok mono">saved {form.saved}.</p>{/if}
			{#if form?.created}<p class="ok mono">created {form.created}.</p>{/if}
			{#if form?.message}<p class="err mono">{form.message}</p>{/if}

			<p class="hint mono">
				status is the whole lever: featured shows as a split card + a big map node, archive as a
				row + a map pill, hidden is off. changes save live.
			</p>

			<div class="admin-list">
				{#each rows as p (p.id)}
					<div class="admin-row">
						<div class="row-top">
							<span class="r-title">{p.title || p.id}</span>
							<span class="mono cluster">{p.cluster}</span>
							<form method="POST" action="?/setStatus" use:enhance class="quick">
								<input type="hidden" name="id" value={p.id} />
								<select name="status" value={p.status} onchange={quickSubmit} aria-label="status">
									{#each statuses as s}<option value={s}>{s}</option>{/each}
								</select>
							</form>
						</div>
						<details>
							<summary class="mono">edit details</summary>
							<form method="POST" action="?/save" use:enhance class="edit">
								<input type="hidden" name="id" value={p.id} />
								<div class="grid2">
									<label
										>status
										<select name="status" value={p.status}
											>{#each statuses as s}<option value={s}>{s}</option>{/each}</select
										></label
									>
									<label
										>cluster
										<select name="cluster" value={p.cluster}
											>{#each clusters as c}<option value={c}>{c}</option>{/each}</select
										></label
									>
									<label>sort <input name="sort_order" type="number" value={p.sort_order ?? 100} /></label>
									<label>year <input name="year" value={p.year ?? ''} /></label>
									<label>map x <input name="map_x" type="number" value={p.map_x ?? 50} /></label>
									<label>map y <input name="map_y" type="number" value={p.map_y ?? 50} /></label>
								</div>
								<label>title <input name="title" value={p.title ?? ''} /></label>
								<label>summary <textarea name="summary" rows="3">{p.summary ?? ''}</textarea></label>
								<label
									>outcomes (one per line)
									<textarea name="outcome" rows="2">{Array.isArray(p.outcome) ? p.outcome.join('\n') : ''}</textarea></label
								>
								<label
									>schematic steps (comma separated)
									<input name="schematic" value={Array.isArray(p.schematic) ? p.schematic.join(', ') : ''} /></label
								>
								<label
									>stack (comma separated)
									<input name="stack" value={Array.isArray(p.stack) ? p.stack.join(', ') : ''} /></label
								>
								<label>github url <input name="github_url" value={p.github_url ?? ''} /></label>
								<label
									>loom walkthrough id
									<input
										name="loom_id"
										value={p.loom_id ?? ''}
										placeholder="the part after loom.com/share/"
									/></label
								>
								<button class="btn" type="submit">save</button>
							</form>
						</details>
					</div>
				{/each}
				{#if rows.length === 0}
					<p class="note">no projects yet. use "sync from github" or "new draft" to start.</p>
				{/if}
			</div>
		{/if}
	</main>
</div>

<style>
	.admin { padding: calc(var(--nav-h) + var(--stack-lg)) 0 var(--section-gap); display: flex; flex-direction: column; gap: var(--stack-lg); }
	.admin h1 { font-size: 34px; }
	.note, .hint { color: var(--ink-soft); text-transform: lowercase; max-width: 60ch; }
	.ok { color: var(--accent); }
	.err { color: #ba1a1a; }
	.login { max-width: 420px; }
	.admin-head { display: flex; flex-wrap: wrap; gap: var(--stack-md); align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: var(--stack-md); }
	.row-actions { display: flex; gap: var(--stack-sm); flex-wrap: wrap; }
	.admin-list { display: flex; flex-direction: column; }
	.admin-row { border: 1px solid var(--border); border-top: 0; padding: var(--stack-md); }
	.admin-list .admin-row:first-child { border-top: 1px solid var(--border); }
	.row-top { display: flex; align-items: center; gap: var(--stack-md); }
	.row-top .r-title { font-size: 18px; text-transform: lowercase; flex: 1; }
	.row-top .cluster { color: var(--ink-soft); }
	.quick { margin: 0; }
	details { margin-top: var(--stack-sm); }
	summary { cursor: pointer; color: var(--ink-soft); }
	.edit { display: flex; flex-direction: column; gap: var(--stack-md); margin-top: var(--stack-md); }
	.edit label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--ink-soft); text-transform: lowercase; }
	.grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--stack-md); }
	select, input, textarea { font-family: var(--font-body); font-size: 15px; color: var(--ink); background: var(--bg); border: 1px solid var(--border-strong); padding: 9px 11px; }
	select:focus, input:focus, textarea:focus { outline: none; border-color: var(--accent); }
</style>
