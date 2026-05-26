# DEO Web Dashboard

Nuxt 3 frontend for the Philadelphia Police Driving Equality Ordinance (DEO) dashboard.

## Architecture

The dashboard is a **static Nuxt site**. All data is pre-aggregated into JSON "cubes" at
build time by the [`deo-backend`](../deo-backend) repo and shipped as static files under
`public/cubes/`. The site does not call any runtime API.

- `public/cubes/stops.json` — quarter × location × demographic facts table
- `public/cubes/scalars.json` — fixed-window baselines (used by `pages/stops.vue`)
- `public/cubes/reasons.json` — quarter × location × demographic × violation cube
- `public/cubes/safety.json` — HIN map, shootings/surge, accident counts
- `public/cubes/snapshot.json` — pre-rendered annual summary
- `public/cubes/districts.json` — per-district population demographics

Per-page composables under `composables/use*Cube.ts` fetch their cube once on entry;
all in-page filtering, summing, and chart construction is then pure client-side. The
helpers in `utils/cube.ts` do the heavy lifting (`sumMeasure`, `groupSum`,
`groupTupleSum`, `locationPredicate`).

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Visit `http://localhost:3000`. Cubes are served from `public/cubes/` — they must exist
on disk before the page loads. If they don't, regenerate them from the backend repo
(see [Updating the data](#updating-the-data)).

## Production build

```bash
npm run build
npm run preview
```

Deployed as a static site on Vercel.

## Updating the data

When `deo-backend` rebuilds the source SQLite, refresh the cubes:

```bash
cd ../deo-backend
poetry run python build_cubes.py     # writes ../deo-web-dashboard/public/cubes/*.json
cd ../deo-web-dashboard
git add public/cubes
git commit -m "data: refresh cubes (DB version <YYYY_MM_DD>)"
```

Vercel will redeploy on push.

## Tests and parity

```bash
npx vitest run utils/cube.test.ts      # cube helper unit tests
node scripts/parity_stops.mjs          # parity vs FastAPI for stops
node scripts/parity_neighborhoods.mjs  # parity for neighborhoods
node scripts/parity_reasons.mjs        # parity for reasons
node scripts/parity_safety.mjs         # parity for safety
node scripts/parity_snapshot.mjs       # parity for snapshot
```

Parity scripts compare cube-derived totals against the original FastAPI handlers. They
default to a local FastAPI instance (`http://127.0.0.1:8123`) — start it from the
backend repo with `SERVER_TYPE=fastapi poetry run python deo_backend/main_fastapi.py`.
