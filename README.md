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

Public values ship in `wrangler.jsonc` (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_GITHUB_USER`). Server code reads them per request from the Worker env, never from the client bundle. Secrets stay in the Cloudflare dashboard: `OWNER_EMAIL` (required explicit owner identity), `SUPABASE_SERVICE_ROLE_KEY` (repo sync), optional `GITHUB_TOKEN`, and optional `N8N_LEAD_WEBHOOK` / `N8N_SCHEDULE_WEBHOOK`. See `.env.example`.

## Routes

- `/` portfolio, `/privacy`, `/accessibility`
- `/projects/<slug>` public case studies for the six selected projects
- `/sitemap.xml` public route index; `public/robots.txt` points crawlers to it
- `/admin` owner editor (Supabase magic link; every change re-validates the session)
- `/auth/callback` magic-link exchange
- `/api/lead`, `/api/schedule` request APIs (503 with an email/Calendly fallback when no delivery target is configured)
- `/api/sync-repos` caches public GitHub repos as hidden drafts (verified owner required, including dry runs)
- `/demos/<id>.mp4|.webp|.jpg|.vtt` demo media with byte ranges, served from `public/_demos/`

## Search metadata

`src/lib/seo.ts` owns the six public case-study slugs, canonical metadata, video facts, readable transcripts and schema helpers. Keep its claims aligned with the public project snapshot, presentation corrections and demo catalog.

The sitemap reads the same anonymous Supabase project list as the home page. It uses the bundled public snapshot when that read fails. It never reads owner sessions, hidden projects or private admin data.

The home page emits `Person` and `WebSite` JSON-LD. Each case study can emit its project type, `VideoObject` and breadcrumb data through `buildProjectJsonLd()`. All inline JSON-LD must use `serializeJsonLd()`.

## Security setup

Set the server-only `OWNER_EMAIL` secret to the confirmed owner account before release. Disable new Supabase signups and invite that account. Run `supabase-schema.sql`, then review and run `supabase-owner-hardening.sql` in the Supabase SQL editor. The migration binds access to the owner UUID and aborts for an ambiguous owner or unknown policies. Inspect the live policies before and after the migration. Worker checks do not replace database policies.

Public request limits run before JSON parsing. The login limit uses the owner email to protect the mailbox. Other callers can consume that quota and delay owner login at the same Cloudflare location.

Anonymous Supabase lead insertion remains available for the existing API. Direct Supabase calls bypass Worker rate limits. The enforced CSP permits the inline scripts and styles that Qwik requires. Its stricter report-only policy provides browser-console evidence.
