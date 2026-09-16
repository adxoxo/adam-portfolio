# adam-portfolio

My personal portfolio and lead site. A light overview (headline with a changing first word, a
scripted assistant demo, five services, two sourced case studies with workflow diagrams, about,
contact) and a dark project index: fifteen projects in service clusters around me, each opening
as a short case study. "Work with me" opens a contact dialog with two forms: send a message
(`/api/lead`) or request a call (`/api/schedule`, a preferred time that I confirm by email;
nothing is booked automatically).

The index has two presentations. Above 960px it is the pannable map by default; at 960px and
below (phones, tablets) it is a list of readable project rows by default, with a labelled
service select above them. A list / map control switches between the two at any width; on a
phone the map is a native tree of buttons that scrolls with the page. The url carries the state:
`#index/<service>` follows the viewport default, `#index/<service>/list` and
`#index/<service>/map` pin a presentation at every width. Each visitor navigation (view,
service, presentation) is one history entry, so Back and Forward restore what was on screen.

Live at [portfolio.aquryu.space](https://portfolio.aquryu.space).

## Tech stack

- **SvelteKit** + **Svelte 5** (runes), server-rendered
- Plain CSS with design tokens (no Tailwind), scoped under `.pf` for the public page and
  `src/lib/styles/app.css` for the admin
- **Supabase** for leads and for the media the admin manages per project; the site runs with
  no keys too (static content, leads log to the console)
- **n8n** webhooks for lead notifications (`N8N_LEAD_WEBHOOK`) and call requests
  (`N8N_SCHEDULE_WEBHOOK`); with the secret unset a request is accepted and logged only
- Deployed as a **Cloudflare Worker** (`wrangler.jsonc`, adapter-cloudflare)

## Content

The approved copy lives in `src/lib/portfolio/data.ts`: services, the fifteen projects, the two
case studies (`case-study` provenance: written from the project sources), the hero chat sample
and the contact links. The Supabase `projects` table only overlays media and links onto those
projects (`src/lib/portfolio/merge.ts`): `loom_id` becomes the click-to-load walkthrough,
`cover_image` a screenshot, `live_url` the live link, `github_url` the repository link (a
non-empty row value wins, an empty one keeps the approved link). Only http(s) urls and plain
loom ids are accepted; anything else is ignored. Rows are matched by id, with the old ids `tq_chatbot`, `carwash`, `goatedtracking` and
`portfolio` mapped to their approved projects. Rows without an approved project are ignored.

Screenshots or short videos for a project go into `static/portfolio-media/` and are referenced
from `data.ts`, for example `media: { kind: 'video', src: '/portfolio-media/vault.mp4', poster:
'/portfolio-media/vault.jpg' }` or `{ kind: 'image', src: '/portfolio-media/goat.png', alt: '...' }`.
Videos are native `<video>` with controls, no autoplay, `preload="metadata"`.

## Develop

```bash
npm install
npm run dev
```

## Build and check

```bash
npm run check
npm run build
npx wrangler dev --port 8788 --ip 127.0.0.1 --local   # the built worker with the committed vars
```

Browser checks and the verification record are in `tests/README.md`.
