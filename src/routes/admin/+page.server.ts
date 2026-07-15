import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabaseConfigured } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	if (!supabaseConfigured() || !locals.supabase) {
		return { configured: false, user: null, projects: [] as Record<string, unknown>[] };
	}
	const { user } = await locals.safeGetSession();
	if (!user) return { configured: true, user: null, projects: [] as Record<string, unknown>[] };

	const { data } = await locals.supabase
		.from('projects')
		.select('*')
		.order('sort_order', { ascending: true });
	return { configured: true, user: { email: user.email ?? '' }, projects: data ?? [] };
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
		const patch = {
			title: String(f.get('title') ?? ''),
			summary: String(f.get('summary') ?? ''),
			cluster: String(f.get('cluster') ?? 'fullstack'),
			status: String(f.get('status') ?? 'hidden'),
			year: String(f.get('year') ?? ''),
			sort_order: Number(f.get('sort_order') ?? 100),
			map_x: Number(f.get('map_x') ?? 50),
			map_y: Number(f.get('map_y') ?? 50),
			github_url: String(f.get('github_url') ?? ''),
			live_url: String(f.get('live_url') ?? '').trim(),
			loom_id: String(f.get('loom_id') ?? '').trim(),
			outcome: String(f.get('outcome') ?? '')
				.split('\n')
				.map((s) => s.trim())
				.filter(Boolean),
			schematic: String(f.get('schematic') ?? '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
			stack: String(f.get('stack') ?? '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		};
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
