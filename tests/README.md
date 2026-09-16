# tests

Browser checks for the public page. They run against a server, never against the source,
so they see the real server-rendered html, the real assets and the real Supabase overlay.

```sh
npm run build
npx wrangler dev --port 8788 --ip 127.0.0.1 --local     # the built worker, production runtime
BASE_URL=http://127.0.0.1:8788 node tests/smoke.cjs      # overview, demo, dialogs, index (map above 960px, list below), filters, hashes, 4 viewports
BASE_URL=http://127.0.0.1:8788 node tests/headline.cjs   # the changing headline word, bounds, reduced motion, recording
BASE_URL=http://127.0.0.1:8788 node tests/contact.cjs    # message + call request forms, /api/lead and /api/schedule intercepted
BASE_URL=http://127.0.0.1:8788 node tests/mobile.cjs     # phones, tablet, short landscape, reduced viewport: list / map history, targets, text, dialogs, demo, menu
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


### 2026-09-16, mobile usability

The index is a list of project rows at 960px and below and the map above; a list / map
control and the `#index/<service>/list|map` suffixes pin a presentation at any width; every
visitor navigation pushes one history entry (`pushState`), canonicalisation uses
`replaceState`, and nothing writes the url from an effect any more. The phone map is a native
html tree of buttons (`ProjectMap.svelte`, 960px and below); the svg map, its pan / zoom and
motion controls are unchanged above 960px. Dialogs: sticky head with the close control, full
width with 8px insets on phones, `dvh` height where supported, `scroll-padding-top` for the
sticky head, and `html { overflow: hidden }` while a modal is open (with `scrollbar-gutter:
stable` for fine pointers). The contact dialog focuses its title first on screens 640px and
narrower or with a coarse pointer; the name field otherwise. The demo puts the business panel
behind a `<details>` disclosure at 560px and below and lays every step's values out in one
grid cell, so the frame never changes with the step. Mobile text sizes: 16px body, messages,
rows, tree labels and workflow stage labels; 13px or more for metadata; 44px targets.

Environment: node 24.20, wrangler 4.129.0 local worker of the production build with the
committed vars (Supabase overlay active), Playwright 1.63 headless chromium with touch
emulation below 500px (`pointer: coarse`). WebKit cannot launch on this host (missing GTK,
GStreamer, ICU libraries), so nothing here is evidence for Safari, the iOS keyboard, iOS
rubber-band scroll behind a modal, or the safe-area insets (`env()` resolves to 0 without
`viewport-fit=cover`; the tokens are in place). Headless chromium has no scrollbar and still
reserves the `scrollbar-gutter`, so a dialog is 15px narrower in the desktop test contexts
than in a real overlay-scrollbar browser; nothing depends on that width.

- `npm run check`: 0 errors, 0 warnings. `npm run build`: passes. The Svelte MCP autofixer
  was not permitted in the implementation session; svelte-check and the compiler (no a11y
  warnings) are the lint evidence.
- `tests/smoke.cjs`: 552 checks passed at 1440x1000, 768x1024, 390x844 and 320x700 plus the
  reduced-motion context. Changed from the previous record: at 1440 the map is the default and
  the sidebar filters it (hubs, pulses, pause, keyboard hub, zoom + fit, keyboard open, focus
  return); at 768 and below the list is the default, the labelled select filters it (3 rows per
  service, 15 for all, hash follows, the select keeps focus), the map is chosen through the
  control (`#index/all/map`, 5 service buttons and 15 project buttons, all >= 44px, 16px,
  `touch-action: auto`, no svg, no zoom controls, keyboard hub and project open, focus return),
  and back to the list keeps the service (`#index/ai/list`); all 15 projects open from their
  row or node with previous / next, every dialog fits, no private wording; the contact prefill
  path (focus on the title on phones, in the name field at 768 and 1440); entry points from a
  fresh load land on `#index/all`, `#index/ai`, `#index/devices`, `#index/apps`; `#index` and
  `#index/nope` canonicalise to `#index/all`, `#index/all/nope` to `#index/all`, and
  `#index/ai/map`, `#index/websites/list`, `#index/all/map` are kept and honoured at every
  width; `#work`, `#about`, `#contact`, `#top` unchanged; mobile menu; no external requests; no
  console errors. Everything else in the 2026-09-14 record is retained.
- `tests/mobile.cjs`: 369 checks passed. 320x700, 360x800, 390x844, 430x932: no element
  outside the viewport (descendant bounds, not only scrollWidth); the primary hero action ends
  at 534px at 320x700 and 483px at 390x844; all five headline words on one line; body text
  >= 16px, supporting text >= 12px, listed controls >= 44x44 with >= 8px between the jump
  links; the service row's whole box is its target; demo details closed by default, messages
  16px, frame and controls identical across all steps and the wrap with the details closed and
  again with them open, opening / closing the disclosure is the only height change, nothing
  clipped; index rows: 15, >= 44px, 16px title and summary, unclipped, named by the title,
  >= 8px apart, first row within the first screen plus 200px, select per service (3 rows of one
  service, hash, focus kept); the complete row -> case -> "build something similar" -> contact
  -> intercepted post path with focus returning to the row; case dialog close control inside
  the dialog at the top and the bottom, 16px content, 44px controls; the tree (44px, 16px, no
  transform, `touch-action: auto`, touch instructions), a synthesized touch drag scrolls the
  page 300px without moving a node in the document, a tree button opens its case and gets focus
  back; the menu fits with three 44px actions and escape returns focus. History at 390:
  overview -> index -> ai -> map -> map again (no entry) -> websites (`#index/websites/map`)
  then Back x4 and Forward x3 restore each service, presentation and view, `history.length`
  unchanged by Back / Forward, reload keeps `#index/ai/map`, an unknown suffix or service is
  replaced (one browser entry, no loop), `#about` lands on the light overview. Resize: 1100 ->
  800 -> 1100 keeps `#index/all`, swaps map / list / map with no history entry and a fitted
  transform, an explicit map at 800 returns fitted at 1100, an explicit list survives both
  directions. Dialogs at 320x700, 844x390, 390x420 and 430x932: dialog inside the viewport,
  close control inside the box at the top, with the last field focused, after validation, at
  the submit and at the bottom; the message field focused below the sticky head; empty submit
  focuses the name field with its error in view and posts nothing; wheel, touch drag and space
  on the backdrop leave `scrollY` unchanged; close restores the position and focuses the
  opener; loom embed (stubbed) close control 44px, closing it focuses the load button. 768x1024
  and 844x390: list default, count and control on one row, tree, menu fits, dialog close at top
  and bottom, focus return. 640x450 (a 200% zoom equivalent): viewport meta allows zoom, no
  overflow, dialog fits. Reduced motion at 390: static "systems", no animation or transition
  over 0.01s on the tree, no pulses.
- `tests/contact.cjs`: 90 checks passed at 1440 and 320; only the start-focus expectation
  changed (title at 320, name field at 1440). Payloads, errors, retry, pending and focus
  assertions unchanged.
- `tests/headline.cjs`: 50 checks passed, unchanged.
- `tests/layout-check.mjs`: passes, unchanged (the narrow svg layouts are still checked; the
  browser no longer renders them below 960px).
- The worker log shows zero `POST /api/lead` and zero `POST /api/schedule` across all runs.
- Desktop screenshots against the 2026-09-16 baseline (pixel diff): the 1440 overview is
  identical (0.00%); the 1440 index differs only in rows 377..423 (0.23%), the count and the
  new list / map control on the heading row and the paragraph wrapping before it.
