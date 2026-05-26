#!/usr/bin/env node
/**
 * Parity check: safety cube vs live FastAPI.
 *
 * Compares the cube-derived values for the three safety endpoints
 * (num-accidents, hin-map, shootings-vs-stops-maps) to the live
 * FastAPI service. Run a local FastAPI instance against the same
 * SQLite DB the cube was built from:
 *
 *   cd deo-backend/deo_backend && \
 *     SERVER_TYPE=fastapi poetry run uvicorn main_fastapi:app --port 8123
 *   API_BASE_URL=http://127.0.0.1:8123 node scripts/parity_safety.mjs
 *
 * Numerical checks: exact match for citywide year/quarter percentages
 * and DEO sentence number, surge/DEO map start/end stop totals.
 * Structural checks: matching feature counts and hovertext sets for
 * the shootings-vs-stops maps, and matching feature count for the
 * HIN map.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CUBE_PATH = join(__dirname, '..', 'public', 'cubes', 'safety.json')
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8123'

function loadCube() {
  return JSON.parse(readFileSync(CUBE_PATH, 'utf8'))
}

async function apiGet(path, params = {}) {
  const u = new URL(path, API_BASE_URL)
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v)
  }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 90_000)
  try {
    const resp = await fetch(u, { signal: ctrl.signal })
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${u}`)
    return await resp.json()
  } finally {
    clearTimeout(t)
  }
}

function recordPass(label, msg) {
  console.log(`OK    ${label}  ${msg}`)
}
function recordFail(label, msg) {
  console.log(`FAIL  ${label}  ${msg}`)
  failed++
}

let failed = 0

// -------------------------------------------------------------------------
// 1. num-accidents: bar chart percentages for each (location, time_agg).
// -------------------------------------------------------------------------

const DIVISION_MAP = {
  SPD: ['01', '03', '17'],
  NEPD: ['02', '07', '08', '15', '25'],
  NWPD: ['05', '14', '35', '39'],
  CPD: ['06', '09', '22'],
  SWPD: ['12', '16', '18', '19'],
  EPD: ['24', '25', '26'],
}

function locationPredicate(loc) {
  if (!loc || loc === '*') return () => true
  if (loc in DIVISION_MAP) {
    const districts = new Set(DIVISION_MAP[loc])
    return (l) => districts.has(l.split('-', 1)[0])
  }
  const m = /^(\d{1,2})\*?$/.exec(loc)
  if (m) {
    const prefix = m[1].padStart(2, '0') + '-'
    return (l) => l.startsWith(prefix)
  }
  return (l) => l === loc
}

function cubeNumAccidents(cube, location, timeAgg) {
  const hin = cube.hin
  const qIdx = hin.dimensions.indexOf('quarter')
  const yearIdx = hin.dimensions.indexOf('year')
  const locIdx = hin.dimensions.indexOf('location')
  const onHinIdx = hin.dimensions.length + hin.measures.indexOf('n_stopped_locatable_on_hin')
  const totalIdx = hin.dimensions.length + hin.measures.indexOf('n_stopped_locatable')
  const pred = locationPredicate(location)
  const buckets = new Map()
  for (const row of hin.rows) {
    const l = row[locIdx]
    if (typeof l !== 'string' || !pred(l)) continue
    const q = row[qIdx]
    const y = row[yearIdx]
    const key = timeAgg === 'year' ? String(y) : q
    let b = buckets.get(key)
    if (!b) {
      b = { on_hin: 0, total: 0 }
      buckets.set(key, b)
    }
    b.on_hin += row[onHinIdx] || 0
    b.total += row[totalIdx] || 0
  }
  const keys = Array.from(buckets.keys()).sort()
  return keys.map((k) => ({
    key: k,
    pct: buckets.get(k).total > 0
      ? Math.round((1000 * buckets.get(k).on_hin) / buckets.get(k).total) / 10
      : 0,
  }))
}

async function checkNumAccidents(cube, location, timeAgg) {
  const label = `num-accidents  loc=${location}  ${timeAgg}`
  const local = cubeNumAccidents(cube, location, timeAgg)
  let body
  try {
    body = await apiGet('/safety/safety-num-accidents', {
      location,
      time_aggregation: timeAgg,
    })
  } catch (err) {
    recordFail(label, `api error: ${err.message}`)
    return
  }
  const remote = body.figures?.barplot?.data || []
  // Build a map of x → pct from remote (Percentage (%) column).
  const yName = body.figures?.barplot?.properties?.yAxis || 'Percentage (%)'
  const xName = body.figures?.barplot?.properties?.xAxis || 'x_label'
  // Map remote x-label back to bucket key.
  function xToKey(x) {
    if (timeAgg === 'year') return String(x)
    // x is "Jan-Mar 2014" — find the matching cube quarter.
    const m = /^([A-Za-z]+-[A-Za-z]+) (\d{4})$/.exec(String(x))
    if (!m) return String(x)
    const SEASON_TO_Q = {
      'Jan-Mar': 'Q1',
      'Apr-Jun': 'Q2',
      'July-Sep': 'Q3',
      'Oct-Dec': 'Q4',
    }
    return `${m[2]}-${SEASON_TO_Q[m[1]]}`
  }
  const remoteMap = new Map()
  for (const d of remote) {
    remoteMap.set(xToKey(d[xName]), d[yName])
  }
  let mismatches = 0
  for (const { key, pct } of local) {
    const r = remoteMap.get(key)
    if (r == null || Math.abs(r - pct) > 0.05) {
      mismatches++
      if (mismatches <= 3) {
        console.log(`  - ${key} cube=${pct} api=${r}`)
      }
    }
  }
  if (mismatches === 0) {
    recordPass(label, `${local.length} buckets match`)
  } else {
    recordFail(label, `${mismatches} bucket mismatches of ${local.length}`)
  }
  // Also verify the DEO-comparison sentence number.
  const remoteText = (body.text || []).join(' ')
  const remoteMatch = /increased by\s*(?:\*\*|<span>)?\s*([-\d.]+)%/.exec(remoteText)
  if (remoteMatch) {
    // Cube DEO calc.
    const hin = cube.hin
    const qIdx = hin.dimensions.indexOf('quarter')
    const onHinIdx = hin.dimensions.length + hin.measures.indexOf('n_stopped_locatable_on_hin')
    const totalIdx = hin.dimensions.length + hin.measures.indexOf('n_stopped_locatable')
    const beforeQ = new Set(['2021-Q1', '2021-Q2', '2021-Q3', '2021-Q4'])
    const afterQ = new Set(['2022-Q2', '2022-Q3', '2022-Q4', '2023-Q1'])
    let bOnHin = 0, bTot = 0, aOnHin = 0, aTot = 0
    for (const row of hin.rows) {
      const q = row[qIdx]
      const oh = row[onHinIdx] || 0
      const tot = row[totalIdx] || 0
      if (beforeQ.has(q)) { bOnHin += oh; bTot += tot }
      else if (afterQ.has(q)) { aOnHin += oh; aTot += tot }
    }
    const before = bOnHin / bTot
    const after = aOnHin / aTot
    const localPct = Math.round((1000 * (after - before)) / before) / 10
    const remotePct = Number(remoteMatch[1])
    if (Math.abs(localPct - remotePct) < 0.05) {
      recordPass(`${label} (DEO sentence)`, `pct=${localPct}`)
    } else {
      recordFail(`${label} (DEO sentence)`, `cube=${localPct} api=${remotePct}`)
    }
  }
}

// -------------------------------------------------------------------------
// 2. hin-map: feature count.
// -------------------------------------------------------------------------

async function checkHinMap(cube) {
  const label = 'hin-map'
  const localCount = cube.hin_map.features.length
  let body
  try {
    body = await apiGet('/safety/safety-hin-map')
  } catch (err) {
    recordFail(label, `api error: ${err.message}`)
    return
  }
  const remoteFeatures = body.geojsons?.[0]?.features || []
  const remoteCount = remoteFeatures.length
  // Count points (on/off HIN) and roads separately.
  function classify(features) {
    let roads = 0, on = 0, off = 0
    for (const f of features) {
      const t = f.geometry?.type
      if (t === 'Point') {
        const name = f.properties?.name
        if (name === 'Traffic stop on the HIN') on++
        else if (name === 'Traffic stop not on the HIN') off++
      } else {
        roads++
      }
    }
    return { roads, on, off, total: features.length }
  }
  const lc = classify(cube.hin_map.features)
  const rc = classify(remoteFeatures)
  if (lc.total !== rc.total || lc.on !== rc.on || lc.off !== rc.off || lc.roads !== rc.roads) {
    recordFail(label,
      `cube={roads:${lc.roads},on:${lc.on},off:${lc.off},total:${lc.total}} ` +
      `api={roads:${rc.roads},on:${rc.on},off:${rc.off},total:${rc.total}}`)
  } else {
    recordPass(label,
      `roads=${lc.roads} on=${lc.on} off=${lc.off} total=${lc.total}`)
  }
}

// -------------------------------------------------------------------------
// 3. shootings-vs-stops-maps: hovertext sets + start/end stop totals.
// -------------------------------------------------------------------------

async function checkShootingsVsStops(cube) {
  const label = 'shootings-vs-stops-maps'
  let body
  try {
    body = await apiGet('/safety/safety-shootings-vs-stops-maps')
  } catch (err) {
    recordFail(label, `api error: ${err.message}`)
    return
  }
  const localMaps = [
    cube.shootings_vs_stops.surge,
    cube.shootings_vs_stops.deo,
  ]
  const remoteMaps = body.geojsons || []
  for (let i = 0; i < 2; i++) {
    const subLabel = `${label}[${i === 0 ? 'surge' : 'deo'}]`
    const lf = localMaps[i].features
    const rf = remoteMaps[i]?.features || []
    if (lf.length !== rf.length) {
      recordFail(subLabel, `feature count cube=${lf.length} api=${rf.length}`)
      continue
    }
    const lHovers = new Set(lf.map((f) => f.properties?.hovertext))
    const rHovers = new Set(rf.map((f) => f.properties?.hovertext))
    let missing = 0
    for (const h of lHovers) {
      if (!rHovers.has(h)) missing++
    }
    if (missing > 0) {
      recordFail(subLabel, `${missing} hovertext strings missing from api`)
      for (const h of lHovers) {
        if (!rHovers.has(h)) {
          console.log(`  cube only: ${h}`)
          break
        }
      }
      for (const h of rHovers) {
        if (!lHovers.has(h)) {
          console.log(`  api only:  ${h}`)
          break
        }
      }
    } else {
      recordPass(subLabel, `${lf.length} features, hovertexts match`)
    }
  }
  // Cross-check the text sentences for stop totals.
  const remoteText = (body.text || []).join('\n')
  const m1 = /by\s+([\d,]+) stops,\s*a\s*([-\d.]+)% increase/.exec(remoteText)
  const m2 = /by\s+([\d,]+) stops,\s*a\s*([-\d.]+)% decrease/.exec(remoteText)
  if (m1) {
    const apiSurgeDiff = Number(m1[1].replace(/,/g, ''))
    const localSurgeDiff = cube.shootings_vs_stops.surge.n_stopped_end
      - cube.shootings_vs_stops.surge.n_stopped_start
    if (apiSurgeDiff === localSurgeDiff) {
      recordPass(`${label} (surge text)`, `diff=${localSurgeDiff}`)
    } else {
      recordFail(`${label} (surge text)`, `cube=${localSurgeDiff} api=${apiSurgeDiff}`)
    }
  } else {
    recordFail(`${label} (surge text)`, 'could not parse api text')
  }
  if (m2) {
    const apiDeoDiff = Number(m2[1].replace(/,/g, ''))
    const localDeoDiff = cube.shootings_vs_stops.deo.n_stopped_start
      - cube.shootings_vs_stops.deo.n_stopped_end
    if (apiDeoDiff === localDeoDiff) {
      recordPass(`${label} (deo text)`, `diff=${localDeoDiff}`)
    } else {
      recordFail(`${label} (deo text)`, `cube=${localDeoDiff} api=${apiDeoDiff}`)
    }
  } else {
    recordFail(`${label} (deo text)`, 'could not parse api text')
  }
}

// -------------------------------------------------------------------------

const NUM_ACCIDENTS_CASES = [
  { location: '*', time_aggregation: 'year' },
  { location: '*', time_aggregation: 'quarter' },
  { location: 'SPD', time_aggregation: 'year' },
  { location: '22*', time_aggregation: 'year' },
]

async function main() {
  console.log(`API base: ${API_BASE_URL}`)
  console.log(`Cube:     ${CUBE_PATH}\n`)
  const cube = loadCube()
  for (const c of NUM_ACCIDENTS_CASES) {
    await checkNumAccidents(cube, c.location, c.time_aggregation)
  }
  await checkHinMap(cube)
  await checkShootingsVsStops(cube)

  if (failed > 0) {
    console.error(`\n${failed} case(s) failed.`)
    process.exit(1)
  }
  console.log('\nAll parity cases pass.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
