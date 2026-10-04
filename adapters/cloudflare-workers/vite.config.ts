// Qwik Router's official Cloudflare Workers adapter (the Workers starter reuses
// the cloudflare-pages adapter and middleware, see
// https://next.qwik.dev/docs/deployments/cloudflare-workers/). The build writes
// dist/_worker.js, which wrangler.jsonc uses as `main`, and the static client
// files in dist/, which the Worker reads through the ASSETS binding.
import { cloudflarePagesAdapter as cloudflareWorkersAdapter } from '@qwik.dev/router/adapters/cloudflare-pages/vite';
import { extendConfig } from '@qwik.dev/router/vite';
import baseConfig from '../../vite.config';

export default extendConfig(baseConfig, () => {
	return {
		build: {
			ssr: true,
			rolldownOptions: {
				input: ['src/entry.cloudflare-pages.tsx']
			}
		},
		plugins: [
			cloudflareWorkersAdapter({
				// No static generation: the public page reads live CMS rows and the
				// admin is per-user, so every page renders in the Worker per request.
				ssg: null,
				// Pages-only routing file; Workers static assets do not use it.
				functionRoutes: false
			})
		]
	};
});
