# DEO Web Dashboard

Nuxt 3 frontend for the Philadelphia Police Driving Equality Ordinance (DEO) dashboard.

## Architecture

The dashboard is a **static Nuxt site**. All data is pre-aggregated into JSON "cubes" at
build time by the pipeline in [`pipeline/`](pipeline) and shipped as static files under
`public/cubes/`. The site does not call any runtime API.

- `public/cubes/stops.json` — quarter × location × demographic facts table; also backs
  the annual-summary snapshot page
- `public/cubes/scalars.json` — fixed-window baselines (used by `pages/stops.vue`)
- `public/cubes/reasons.json` — quarter × location × demographic × violation cube
- `public/cubes/safety.json` — HIN map, shootings/surge, accident counts
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
on disk before the page loads. If they don't, regenerate them with the pipeline
(see [Updating the data](#updating-the-data)).

## Production build

```bash
npm run build
npm run preview
```

Deployed as a static site on Vercel.

## Updating the data

```bash
npm run update-data -- --zip car_ped_stops_2026-10-20T03_45_06.zip
```

See `AGENTS.md` for the full runbook. Vercel will redeploy on push.

## Tests and parity

```bash
npx vitest run                # unit tests
node e2e/parity.mjs --checks-only  # invariants on the local build
node e2e/parity.mjs                # full parity vs the live site
```

See `AGENTS.md` for the full runbook, including comparing a build against
production.
