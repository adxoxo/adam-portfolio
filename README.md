# adam-portfolio

My personal portfolio. One page, two modes: a white editorial "site" view set in Geist (hero, three project previews, experience, capabilities, contact), and a dark circuit-board "map" that shows how the projects connect and links the six case studies. The map shows the 21 CMS projects plus 10 source-managed Lead Flow Consulting pieces (31 in total when every CMS row is public). Every project opens the same detail view with a local demo video, and "work with me" links to Calendly or email.

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

## Home page behavior

The floating capsule has the profile photo (home link), one `role="switch"` for site/map, and a More button that opens experience and contact links. The three project previews under the hero come from the live public rows (`vault`, `grimoire`, `goatedtracking`); a missing or hidden row is left out. A plain click opens the shared project dialog, a modified click follows the case page. The cards stay still, with three columns on desktop and compact rows on phones. Short default summaries retain owner edits from the CMS. Root scrollbar reservation keeps the navigation in place across Home/Map switches and dialogs.

The dragon beside the name is a keyboard-accessible replay button. The intro fades in, pulses once, then moves into the hero mark. Automatic playback is limited to the first home visit in a session while critical hero assets remain pending. Fast visits, deep links, and reduced motion skip it. The overlay starts hidden in server HTML, waits for the logo image, and never locks focus or scroll. Interaction, a Map switch, or a 1200ms maximum lifetime clears it. Project videos do not delay the intro.

Below 808px the map hides its legend and zoom buttons. Fonts are the local Geist files in `public/fonts/` (SIL Open Font License); the portrait derivative is `public/brand/portrait-192.webp`.

## Lead Flow Consulting catalog

`src/lib/data/leadflow.ts` is a typed, public, source-managed catalog of work built with Lead Flow Consulting. `present()` in `src/lib/data/presentation.ts` appends its ten new pieces (ids prefixed `leadflow_`) to the visible project list. A visible CMS row with the same id wins, and nothing is written to Supabase. The existing CMS stays the source for editable rows. For four existing ids (`whatsapp_offer`, `booking_invoice`, `quiz_funnel`, `video_landing`) the catalog supplies the client title, summary, impact, stack and system path field by field, and only while the stored field still holds its legacy value; newer owner edits are kept, and a row missing from the public list is not restored. All fourteen pieces carry the `Lead Flow Consulting` label on the map and in the detail view. The new pieces have no media, no case route and no private links. Four approved public links are set: honest workshop, Visenza Quelle and Visenza FEEL (added to a matched row only while its `live` field is empty or the legacy value) and the Coaching guides.

## Project media

Every project has a video or a cover. The 21 projects with a video keep it; posters and thumbs are WebP in `public/_demos`. The ten Lead Flow pieces without a video use WebP covers in `public/project-covers`: a real capture of the public coaching guide page, and workflow overviews drawn from each piece's system path (diagrams, not app screenshots). The project films were rebuilt from their real captures with example records, so on-screen text, captions and narration use the same wording. Visitor-facing text avoids the words demo, test, seeded and synthetic; internal ids and `/demos/` paths are unchanged.

## HTTPS redirect

The Worker answers every `http://portfolio.aquryu.space` request with a `308 Permanent Redirect` before Qwik Router runs. The `Location` is the same URL on `https:` with the same path, query and percent-encoding, and without an explicit port. A 308 keeps the method and body, so a `POST` stays a `POST` after the redirect. The redirect carries the security headers from `applySecurityHeaders()`. It does not carry HSTS, because the request used plain HTTP. HTTPS requests, `localhost`, `127.0.0.1` and other hostnames are not redirected.

`wrangler.jsonc` sets `assets.run_worker_first: true`, so static files (for example `/adam.jpg`, `/build/*`, `/_demos/*`) also reach the Worker first and get the same redirect. On HTTPS, the router still serves them through `env.ASSETS.fetch`.

## Security setup

Set the server-only `OWNER_EMAIL` secret to the confirmed owner account before release. Disable new Supabase signups and invite that account. Run `supabase-schema.sql`, then review and run `supabase-owner-hardening.sql` in the Supabase SQL editor. The migration binds access to the owner UUID and aborts for an ambiguous owner or unknown policies. Inspect the live policies before and after the migration. Worker checks do not replace database policies.

Public request limits run before JSON parsing. The login limit uses the owner email to protect the mailbox. Other callers can consume that quota and delay owner login at the same Cloudflare location.

Anonymous Supabase lead insertion remains available for the existing API. Direct Supabase calls bypass Worker rate limits. The enforced CSP permits the inline scripts and styles that Qwik requires. Its stricter report-only policy provides browser-console evidence.
