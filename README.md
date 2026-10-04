# adam-portfolio

My personal portfolio and lead site. One page, two modes: a light editorial "site" view of selected work, and a dark, pannable node-graph "map" that shows how the projects connect. Clicking any project grows it into a detail view, and a "work with me" flow handles contact and call booking.

Live at [portfolio.aquryu.space](https://portfolio.aquryu.space).

## Tech stack

- **SvelteKit** + **Svelte 5** (runes)
- Plain CSS with design tokens (no Tailwind)
- **Supabase** for content, with a seed-only fallback so it runs with no keys
- **n8n** webhooks for leads and call booking
- Deployed on **Cloudflare Pages**

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
