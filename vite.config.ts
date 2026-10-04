/**
 * Base Vite config. `npm run build.client` uses it directly; the Cloudflare
 * Workers adapter config (adapters/cloudflare-workers/vite.config.ts) extends it
 * for the server build.
 */
import { qwikVite } from '@qwik.dev/core/optimizer';
import { qwikRouter } from '@qwik.dev/router/vite';
import { defineConfig, type UserConfig } from 'vite';

export default defineConfig((): UserConfig => {
	return {
		plugins: [
			// Keep the SvelteKit URL contract: /admin, /auth/callback, /api/lead,
			// /privacy, never a trailing-slash redirect (the magic-link redirect
			// URL and API clients depend on the exact paths).
			// strictLoaders: false (Qwik 1 behavior). With the rc.0 default, a
			// loader on a form-action POST runs against `new Request(url,
			// postRequest)` built from the already-read POST body, which workerd
			// rejects, so every no-JS action answered 500. Do not give loaders on
			// action routes an explicit `search` list for the same reason.
			qwikRouter({ trailingSlash: false, strictLoaders: false }),
			qwikVite()
		],
		resolve: {
			alias: { '~': decodeURIComponent(new URL('./src', import.meta.url).pathname) }
		},
		server: {
			headers: {
				// Never cache dev responses.
				'Cache-Control': 'public, max-age=0'
			}
		}
	};
});
