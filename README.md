# adam-portfolio

My personal portfolio. One page, two modes: a light editorial "site" view of selected work, and a dark circuit-board "map" that shows how the projects connect. Every project opens the same detail view with a local demo video, and "work with me" links to Calendly or email.

Live at [portfolio.aquryu.space](https://portfolio.aquryu.space).

## Tech stack

- **Qwik 2** + **Qwik Router** (`@qwik.dev/core` / `@qwik.dev/router`, pinned to `2.0.0-rc.0`)
- Plain CSS with design tokens (no Tailwind)
- **Supabase** for project content and owner login, with a full public snapshot as fallback so it runs with no keys
- Deployed as the **Cloudflare Worker** `adam-portfolio` (Qwik Router's Cloudflare Workers adapter, static files through the `ASSETS` binding)

## Develop

```bash
npm install
npm run dev        # Vite dev server with SSR
```

## Build and run the compiled Worker

```bash
npm run check      # TypeScript
npm run build      # qwik build: client -> dist/, Worker -> dist/_worker.js + server/
npx wrangler dev   # serves the built Worker locally with the wrangler.jsonc vars
```

`npx wrangler deploy` runs `npm run build` first (see `wrangler.jsonc`). A push to `main` deploys through Workers Builds.

## Configuration

Public values ship in `wrangler.jsonc` (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_GITHUB_USER`). Server code reads them per request from the Worker env, never from the client bundle. Secrets stay in the Cloudflare dashboard: `SUPABASE_SERVICE_ROLE_KEY` (repo sync), optional `GITHUB_TOKEN`, and optional `N8N_LEAD_WEBHOOK` / `N8N_SCHEDULE_WEBHOOK`. See `.env.example`.

## Routes

- `/` portfolio, `/privacy`, `/accessibility`
- `/admin` owner editor (Supabase magic link; every change re-validates the session)
- `/auth/callback` magic-link exchange
- `/api/lead`, `/api/schedule` request APIs (503 with an email/Calendly fallback when no delivery target is configured)
- `/api/sync-repos` caches public GitHub repos as hidden drafts (owner only when the store is configured)
- `/demos/<id>.mp4|.webp|.jpg|.vtt` demo media with byte ranges, served from `public/_demos/`
