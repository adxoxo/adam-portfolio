# adam-portfolio

My personal portfolio and lead site. A focused light overview (the headline with a changing
first word and one lede with two actions, two agency case studies with workflow diagrams, the
three-step process, a short about, contact) and a dark project index: fifteen projects in
service clusters around me, each opening as a short case study. Every contact action ("tell me
what you need" in the hero, "work with me" in the navbar, "book a call" in the contact section,
"build something similar" in a case study) opens one dialog with the calendly scheduler for a
30 minute call, embedded in the page; a link to the same calendly page and the email address
stay visible as fallbacks. There is no form and nothing is posted to this site. The overview
leads into the index from the hero, the "browse all fifteen projects" action, the about facts,
the contact panel and the footer; the five services and the fifteen projects live only in the
index.

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
- **Supabase** for the media the admin manages per project; the site runs with no keys too
  (static content)
- **Calendly** for contact: the browser loads calendly's widget script inside the contact
  dialog and the booking happens in calendly's own frame; no server route, no keys
- Deployed as a **Cloudflare Worker** (`wrangler.jsonc`, adapter-cloudflare)

## Content

The approved copy lives in `src/lib/portfolio/data.ts`: services, the fifteen projects, the two
case studies (`case-study` provenance: written from the project sources, labelled "agency
project" on the overview) and the contact links. The chat sample (`CHAT_MESSAGES`,
`CHAT_STEPS`) and `ChatDemo.svelte` are kept in the repo but no longer rendered: the focused
overview has no demo. The Supabase `projects` table only overlays media and links onto those
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
