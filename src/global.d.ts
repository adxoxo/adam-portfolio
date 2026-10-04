import type { PlatformCloudflarePages } from '@qwik.dev/router/middleware/cloudflare-pages';

declare global {
	/** Worker bindings and vars (wrangler.jsonc `vars` plus dashboard secrets). */
	interface WorkerEnv {
		/** Static files in dist/ (the adapter serves /build and /assets from it). */
		ASSETS?: { fetch(request: Request): Promise<Response> };
		PUBLIC_SUPABASE_URL?: string;
		PUBLIC_SUPABASE_ANON_KEY?: string;
		PUBLIC_GITHUB_USER?: string;
		/** Server-only secrets. Never read outside src/lib/server/**. */
		SUPABASE_SERVICE_ROLE_KEY?: string;
		GITHUB_TOKEN?: string;
		N8N_LEAD_WEBHOOK?: string;
		N8N_SCHEDULE_WEBHOOK?: string;
	}

	/** Platform object on every RequestEvent (Cloudflare Workers adapter). */
	type QwikRouterPlatform = Omit<PlatformCloudflarePages, 'env'> & { env?: WorkerEnv };
}

export {};
