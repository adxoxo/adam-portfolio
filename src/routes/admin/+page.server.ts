import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabaseConfigured } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, url }) => {
	// A failed magic-link exchange redirects here with ?error=; surface it.
	const loginError = url.searchParams.get('error');
	if (!supabaseConfigured() || !locals.supabase) {
		return { configured: false, user: null, projects: [] as Record<string, unknown>[], loginError };
	}
	const { user } = await locals.safeGetSession();
	if (!user)
		return { configured: true, user: null, projects: [] as Record<string, unknown>[], loginError };

	const { data } = await locals.supabase
		.from('projects')
		.select('*')
		.order('sort_order', { ascending: true });
	return { configured: true, user: { email: user.email ?? '' }, projects: data ?? [], loginError };
};

async function requireOwner(locals: App.Locals) {
	if (!locals.supabase) return null;
	const { user } = await locals.safeGetSession();
	return user;
}

export const actions: Actions = {
	login: async ({ request, locals, url }) => {
		if (!locals.supabase) return fail(400, { message: 'supabase not configured' });
		const email = String((await request.formData()).get('email') ?? '').trim();
		if (!email) return fail(400, { message: 'email required' });
		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: `${url.origin}/auth/callback` }
		});
		if (error) return fail(400, { message: error.message });
		return { sent: true };
	},

	logout: async ({ locals }) => {
		await locals.supabase?.auth.signOut();
		return { ok: true };
	},

	save: async ({ request, locals }) => {
		const user = await requireOwner(locals);
		if (!user) return fail(401, { message: 'unauthorized' });
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		if (!id) return fail(400, { message: 'missing id' });

		// Merge onto the existing row: only overwrite fields the form actually
		// submitted, so a partial or malformed form can never blank a column it
		// did not include. (A field present but empty = an intentional clear; a
		// field absent entirely = left untouched.) This is the guard against the
		// old bug where an empty save wiped every column.
		const { data: existing, error: readErr } = await locals.supabase!
			.from('projects')
			.select('id')
			.eq('id', id)
			.maybeSingle();
		if (readErr) return fail(400, { message: readErr.message });
		if (!existing) return fail(404, { message: 'project not found' });

		const patch: Record<string, unknown> = {};
		const str = (k: string) => {
			if (f.has(k)) patch[k] = String(f.get(k) ?? '').trim();
		};
		const num = (k: string, d: number) => {
			if (!f.has(k)) return;
			const n = Number(f.get(k));
			patch[k] = Number.isFinite(n) ? n : d;
		};
		const list = (k: string, sep: string) => {
			if (!f.has(k)) return;
			patch[k] = String(f.get(k) ?? '')
				.split(sep)
				.map((s) => s.trim())
				.filter(Boolean);
		};

		str('title');
		str('summary');
		str('why');
		str('cluster');
		str('status');
		str('year');
		str('github_url');
		str('live_url');
		str('loom_id');
		// cover_image column may not exist on an un-migrated DB; only write it when
		// set, so a missing column can never break an ordinary save (run the alter
		// in supabase-schema.sql to enable it).
		if (f.has('cover_image')) {
			const v = String(f.get('cover_image') ?? '').trim();
			if (v) patch.cover_image = v;
		}
		num('sort_order', 100);
		num('map_x', 50);
		num('map_y', 50);
		list('outcome', '\n');
		list('schematic', ',');
		list('stack', ',');
		if (f.has('features')) {
			patch.features = String(f.get('features') ?? '')
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean)
				.map((line) => {
					const i = line.indexOf('::');
					return i === -1
						? { label: line, detail: '' }
						: { label: line.slice(0, i).trim(), detail: line.slice(i + 2).trim() };
				});
		}

		if (Object.keys(patch).length === 0) return { saved: id };
		const { error } = await locals.supabase!.from('projects').update(patch).eq('id', id);
		if (error) return fail(400, { message: error.message });
		return { saved: id };
	},

	setStatus: async ({ request, locals }) => {
		const user = await requireOwner(locals);
		if (!user) return fail(401, { message: 'unauthorized' });
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		const status = String(f.get('status') ?? 'hidden');
		const { error } = await locals.supabase!.from('projects').update({ status }).eq('id', id);
		if (error) return fail(400, { message: error.message });
		return { statusSet: id };
	},

	createDraft: async ({ locals }) => {
		const user = await requireOwner(locals);
		if (!user) return fail(401, { message: 'unauthorized' });
		const id = `draft_${Date.now()}`;
		const { error } = await locals.supabase!
			.from('projects')
			.insert({ id, title: 'new project', status: 'hidden', source: 'manual' });
		if (error) return fail(400, { message: error.message });
		return { created: id };
	},

	sync: async ({ locals, fetch }) => {
		const user = await requireOwner(locals);
		if (!user) return fail(401, { message: 'unauthorized' });
		try {
			const res = await fetch('/api/sync-repos', { method: 'POST' });
			const j = (await res.json()) as { added?: number; total?: number; count?: number };
			return { synced: j.added ?? j.count ?? 0, total: j.total ?? j.count ?? 0 };
		} catch (e) {
			return fail(500, { message: `sync failed: ${e}` });
		}
	}
};
