# tests

Browser checks for the public page. They run against a server, never against the source,
so they see the real server-rendered html, the real assets and the real Supabase overlay.

```sh
npm run build
npx wrangler dev --port 8788 --ip 127.0.0.1 --local     # the built worker, production runtime
BASE_URL=http://127.0.0.1:8788 node tests/smoke.cjs      # overview, demo, dialogs, map, filters, hashes, 4 viewports
BASE_URL=http://127.0.0.1:8788 node tests/headline.cjs   # the changing headline word, bounds, reduced motion, recording
BASE_URL=http://127.0.0.1:8788 node tests/contact.cjs    # message + call request forms, /api/lead and /api/schedule intercepted
node tests/layout-check.mjs                              # map layouts never overlap; database overlay precedence and url safety
```

Playwright is not a dependency of this project. The scripts `require('playwright')`; point
`PLAYWRIGHT_DIR` at an installed copy (any 1.4x+ with chromium) if it is not resolvable.
`SHOTS_DIR` sets where screenshots and the headline recording go (default: the os temp dir).
`/api/lead` and `/api/schedule` are always intercepted by the tests, so a test run never
stores a lead, sends a call request or triggers an n8n webhook. `npm run preview` works as the server too, but it uses process.env instead of
the wrangler vars, so the Supabase overlay is only exercised under `wrangler dev`.

## Verification record

### 2026-09-14, design v2 port

Environment: node 24, wrangler 4.110 local worker with the committed vars (Supabase overlay
active, `source: "supabase"` in the page data), Playwright 1.63 headless chromium.

- `npm run check`: 0 errors, 0 warnings. `npm run build`: passes, adapter-cloudflare output.
- Svelte MCP `svelte-autofixer` on `ContactDialog.svelte` and the page script: 0 issues; only
  the known advisories (DOM calls inside effects, `bind:this` for focus).
- `tests/smoke.cjs`: 441 checks passed at 1440x1000, 768x1024, 390x844 and 320x700, plus a
  reduced-motion context. Covers: server html contains the h1 and no preview wording; pill
  fits, portrait loads, all pill targets 44px; approved headline (accessible name) and
  subheadline; title, canonical, favicon; demo frame identical across the three steps and the
  wrap, composer inert, no manual pause control; aq chatbot dialog with click-to-load loom, focus
  to title and back to the opener, dialog content fits the dialog width before and after the
  technical details open (scrollWidth <= clientWidth, scrollLeft 0, no descendant outside the
  dialog box; the booking dialog with the diagram too); two case studies with 6 and 7 steps, row at 1440 and column
  below, provenance line; map index dark with 15 / 3 nodes per filter, count and hash follow,
  the clicked control keeps focus, hubs and pulses, pause / resume, zoom + fit, keyboard open and
  focus return, all 15 projects open from their node, previous / next; contact prefilled from
  "build something similar" and the intercepted post carries `need:` and `similar to:`; every
  entry point lands on the dark map; `#index`, `#index/ai/map`, `#index/websites/list`,
  `#index/all/map` canonicalise; `#work`, `#about`, `#contact`, `#top` land on the light overview
  and keep their hash; mobile menu; no requests outside the origin; no console errors.
- `tests/headline.cjs`: 50 checks passed at the four widths: accessible name, box equals the
  longest word, incoming words at +8px, no overflow, demo bounds fixed across steps, full cycle
  systems > websites > automations > marketing > workflows > systems with the h1 / lede / cta /
  demo / word box never moving, no pause control, runtime reduced motion static "systems",
  off-screen and hidden-document pauses, unmount / remount. Recording written to `SHOTS_DIR`.
- `tests/contact.cjs`: 90 checks passed at 1440 and 320. Message form: empty form and bad
  email send nothing and mark the field (aria-invalid, aria-describedby, focus); success posts
  exactly `{name,email,message}` trimmed, with the need as a context line, then the "received"
  panel (acceptance wording only, no delivery or deadline promise) takes focus and escape
  returns focus to the opener; 500 shows the error panel, keeps the fields, offers "try again"
  (re-posts) and a mailto fallback carrying the message; 429 explains the limit; an aborted
  request explains the network failure without page errors; while pending the submit is
  disabled, reads "sending", and the form is `aria-busy`. Call request: missing date or time
  send nothing (date has a `min` of today); success posts exactly `{name,email,date,time,note}`
  to `/api/schedule` and nothing to `/api/lead`; the panel says received, "not a booking yet",
  confirmed by adam by email, no calendly anywhere; "send a message as well" returns to the
  message form with name and email kept; 502 `send_failed` shows the error, keeps the fields,
  offers retry and a mailto carrying the request; network failure explained; switching forms
  keeps name and email, clears errors and retitles the dialog.
- `tests/layout-check.mjs`: no overlapping nodes in the 12 layouts; the overlay maps
  `tq_chatbot`, `carwash`, `goatedtracking` rows onto the approved projects, fills only media and
  links, ignores rows without an approved project; a managed `github_url` replaces the approved
  link and an empty one falls back; `javascript:` urls, non-urls and malformed loom ids are
  dropped.

- Manual: `/admin` renders with its own stylesheet unchanged (screenshot in the outputs folder);
  `/api/lead` with an empty body answers 400 `invalid`; `/robots.txt`, `/adam.jpg`, the five
  font files and every asset answer 200; no `tq chatbot`, `design preview` or `drafted for`
  wording in the served html.

Not covered: the media fixture branches (image, native video, error placeholders) have no
production hook; the components are unchanged from the reviewed mockup where a fixture test
covered them. Loom playback needs the network and is click-to-load only.

### 2026-09-14, review fixes

Findings from the independent review, all applied and re-verified on the built worker:
contact wording (no "nowhere else", acceptance-only success), `merge.ts` precedence (managed
row wins, fallback to approved) plus url safety, and the restored "request a call" form on
`/api/schedule`. `npm run check` 0/0, build passes, autofixer 0 issues on the dialog,
`tests/contact.cjs` 90/90, `tests/layout-check.mjs` green, `tests/smoke.cjs` 441/441 rerun
(both api routes intercepted; the worker log shows zero POSTs). The headline suite was not
rerun: nothing it covers changed.

### 2026-09-14, final copy

Two text changes before deployment: the message success panel now reads "your request was
accepted; the reply goes to {email}" (acceptance only, email fallback and the "not a booking"
call wording unchanged), and the about "experience" line names the employers and the independent
client work (user-confirmed naming; see the 2026-09-16 entry). No test asserts either
string; `tests/contact.cjs` checks the `received.` prefix and the absence of delivery or
deadline wording, both still true. `npm run check` 0/0, `npm run build` passes, the two strings
verified in the server-rendered html and the built client bundle. Build ready for deployment.

### 2026-09-14, favicon

The tab icon is now the aquryu mark: `src/lib/assets/favicon.png` (512x512, transparent
background, brand green #3D5F40), generated from `src/lib/assets/mark.png` by
`scripts/gen-favicon.cjs`, the same file the navbar and footer draw. No svg of the mark exists,
so a png with `type="image/png"` is used; the SvelteKit default `favicon.svg` (the svelte logo)
was removed. The layout imports the png, so the url carries a content hash
(`/_app/immutable/assets/favicon.<hash>.png`, `Cache-Control: immutable`) and a future change
gets a new url. Verified on the built worker: the home and admin html carry the single
`rel="icon"` link, the asset answers 200 `image/png` with bytes identical to the source, no
console errors. `npm run check` 0/0, `npm run build` passes. Preview:
`outputs/adam-portfolio-port-2026-09-14/shots/favicon-preview.png`.

### 2026-09-16, nda-safe public names

Public names only, no other content changed. The two sourced case studies are now
"automated booking sales flow" (`booking_invoice`) and "sales flow automation"
(`whatsapp_offer`) in `PROJECTS` and `CASES`; the `FlowVariant` keys and the
`data-variant` values are the generic `booking` and `enquiry`. The about "experience" line
drops one former engagement name and reads "silver ai automation, cleo, plus independent
client work". `tests/smoke.cjs` asserts the new titles and labels its checks by flow key;
`tests/layout-check.mjs` asserts `flow === 'booking'`. A grep over `src/`, `tests/`,
`static/`, `scripts/` and the readme finds none of the former names; the source and the built
client bundle have zero hits for the old names. Verified: `npm run check` 0 errors, 0 warnings;
`npm run build` passes; `node tests/layout-check.mjs` passes; `tests/smoke.cjs` against a local
`BASE_URL` at 1440, 768, 390 and 320 widths, all checks passed.

