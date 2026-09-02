# MSR Location Finder

Internal clinical/routing directory for MSR team members. ZIP/address search with proximity sorting, state/region filters, and an interactive Leaflet map of all 47 office locations.

## Structure

This is an intentionally static site (no build step, no framework):

- `index.html` — page markup
- `style.css` — all styling
- `app.js` — search, filtering, map, and appointment-confirmation logic
- `offices.json` — the 47-office dataset (edit this to add/update/remove locations)
- `msr-logo.png` — header/footer logo
- `vercel.json` — sends `X-Robots-Tag: noindex` on every route (this tool isn't meant to be publicly indexed)

## Local development

No build tools needed — just serve the folder statically. `offices.json` is loaded via `fetch`, so opening `index.html` directly with a `file://` URL won't work; you need an actual HTTP server. If you have Node:

```bash
npx serve .
```

Otherwise, a dependency-free static server is included at `.claude/serve.ps1` (used by Claude Code's preview):

```powershell
powershell -File .claude/serve.ps1 -Root . -Port 5500
```

The ZIP/address lookup calls external APIs (zippopotam.us, nominatim.openstreetmap.org), so an internet connection is required for search to work.

## Deploying

On Vercel, when prompted for a framework preset, choose **Other** (no build command, no output directory — it serves the files as-is).

## Editing office data

Each entry in `offices.json` is one office. Fields: `name`, `practice`, `manager`, `address`, `city`, `state`, `region`, `zip`, `phone`, `medEmail`, `escalation`, `escalationPhone`, `hours`, `url`, `lat`, `lon`. Optional: `directPhone`, `generalPhone`, `gmbUrl`.
