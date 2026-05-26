#!/usr/bin/env node
/**
 * Parity check: reasons cube derivations vs live FastAPI.
 *
 * Re-implements the four reasons-page derivations directly on top of
 * the reasons cube and compares each numeric result against the
 * corresponding `/reasons/*` FastAPI endpoint.
 *
 * Launch FastAPI locally first:
 *   cd deo-backend/deo_backend && \
 *     SERVER_TYPE=fastapi python main_fastapi.py
 *   API_BASE_URL=http://127.0.0.1:8123 node scripts/parity_reasons.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CUBE_PATH = join(__dirname, '..', 'public', 'cubes', 'reasons.json')
const DISTRICTS_PATH = join(__dirname, '..', 'public', 'cubes', 'districts.json')
const API_BASE_URL = process.env.API_BASE_URL || 'https://deo-api.onrender.com'

const VIOLATION_CATEGORIES_OPERATIONAL = [
  'Failure to Obey Traffic Sign/Light',
  'Improper Pass, Lane, One Way',
  'Improper Turn/Signal',
  'Red Light/Stop Sign/Yield',
  'Speeding/Reckless/Careless Driving',
]
const VIOLATION_CATEGORIES_DEO_IMPACTED = [
  'Display License Plate',
  'Inspection/Emission Sticker',
  'Lights',
  'Registration',
  'Windshield Obstruction',
]

const cube = JSON.parse(readFileSync(CUBE_PATH, 'utf8'))
const districts = JSON.parse(readFileSync(DISTRICTS_PATH, 'utf8'))

function colIdx(name) {
  const i = cube.dimensions.indexOf(name)
  if (i >= 0) return i
  const j = cube.measures.indexOf(name)
  if (j < 0) throw new Error(`Unknown column: ${name}`)
  return cube.dimensions.length + j
}

const QIDX = colIdx('quarter')
const LOCIDX = colIdx('location')
const RIDX = colIdx('race')
const VCIDX = colIdx('violation_category')

function sumWhere(measure, pred) {
  const mIdx = colIdx(measure)
  let total = 0
  for (const row of cube.rows) {
    if (!pred(row)) continue
    const v = row[mIdx]
    if (typeof v === 'number') total += v
  }
  return total
}

function inYear(year) {
  const start = `${year}-Q1`
  const end = `${year}-Q4`
  return (row) => {
    const q = row[QIDX]
    return typeof q === 'string' && q >= start && q <= end
  }
}

// -- API fetch
async function fetchJson(path, params) {
  const u = new URL(path, API_BASE_URL)
  for (const [k, v] of Object.entries(params || {})) {
    if (Array.isArray(v)) for (const item of v) u.searchParams.append(k, item)
    else u.searchParams.set(k, v)
  }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 60_000)
  try {
    const resp = await fetch(u, { signal: ctrl.signal })
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${u}`)
    return await resp.json()
  } finally {
    clearTimeout(t)
  }
}

let failed = 0
function report(label, ok, extra = '') {
  if (ok) console.log(`OK    ${label}${extra ? '  ' + extra : ''}`)
  else { console.log(`FAIL  ${label}${extra ? '  ' + extra : ''}`); failed++ }
}
function near(a, b, eps = 0.05) { return Math.abs(a - b) <= eps }

// Majority sets
const majorityWhite = new Set(Object.entries(districts)
  .filter(([_d, v]) => (v?.whiteness ?? 0) > 50).map(([d]) => d))
const majorityNonwhite = new Set(Object.entries(districts)
  .filter(([_d, v]) => (v?.whiteness ?? 0) <= 50).map(([d]) => d))

// -------------------------------------------------------------------
// CASE 1: comparison-bar-drivers — per (race, violation_category) %
// -------------------------------------------------------------------
async function case1(year, race) {
  const body = await fetchJson('/reasons/reasons-comparison-bar-drivers', { year, race })
  const points = body.figures.barplot.data
  // Compute per-race totals (over filtered VCs ≠ Other/None) from the cube.
  function isFilt(row) {
    if (!inYear(year)(row)) return false
    const r = row[RIDX]
    if (r !== 'Black' && r !== 'White') return false
    const vc = row[VCIDX]
    if (vc === 'Other' || vc === 'None') return false
    return true
  }
  const totals = { Black: 0, White: 0 }
  const perKey = new Map() // `${race}|${vc}` -> n_stopped
  const nIdx = colIdx('n_stopped')
  for (const row of cube.rows) {
    if (!isFilt(row)) continue
    const v = row[nIdx]
    if (typeof v !== 'number') continue
    const r = row[RIDX]
    const vc = row[VCIDX]
    totals[r] += v
    const k = `${r}|${vc}`
    perKey.set(k, (perKey.get(k) ?? 0) + v)
  }

  for (const p of points.slice(0, 6)) {
    const r = p.group.replace(' drivers', '')
    const vc = p['Primary Reason for Traffic Stop']
    const n = perKey.get(`${r}|${vc}`) ?? 0
    const tot = totals[r] || 0
    const cubePct = tot ? Math.round((1000 * n) / tot) / 10 : 0
    const apiPct = p['Percentage (%)']
    report(
      `comparison-bar-drivers year=${year} race=${race} ${r}/${vc}`,
      near(cubePct, apiPct, 0.11),
      `cube=${cubePct}% api=${apiPct}%`,
    )
  }
}

// -------------------------------------------------------------------
// CASE 2: comparison-bar-neighborhoods — per (majority, vc) %
// -------------------------------------------------------------------
async function case2(year, race) {
  const body = await fetchJson('/reasons/reasons-comparison-bar-neighborhoods', { year, race })
  const points = body.figures.barplot.data
  const nIdx = colIdx('n_stopped')
  const totals = { white: 0, nonwhite: 0 }
  const perKey = new Map() // `${majority}|${vc}` -> n
  for (const row of cube.rows) {
    if (!inYear(year)(row)) continue
    const vc = row[VCIDX]
    if (vc === 'Other' || vc === 'None') continue
    const loc = row[LOCIDX]
    if (typeof loc !== 'string') continue
    const d = loc.split('-', 1)[0]
    let m
    if (majorityWhite.has(d)) m = 'white'
    else if (majorityNonwhite.has(d)) m = 'nonwhite'
    else continue
    const v = row[nIdx]
    if (typeof v !== 'number') continue
    totals[m] += v
    const k = `${m}|${vc}`
    perKey.set(k, (perKey.get(k) ?? 0) + v)
  }
  for (const p of points.slice(0, 6)) {
    const groupLabel = p.group
    const m = groupLabel.startsWith('Majority non-white') ? 'nonwhite' : 'white'
    const vc = p['Primary Reason for Traffic Stop']
    const n = perKey.get(`${m}|${vc}`) ?? 0
    const tot = totals[m] || 0
    const cubePct = tot ? Math.round((1000 * n) / tot) / 10 : 0
    const apiPct = p['Percentage (%)']
    report(
      `comparison-bar-neighborhoods year=${year} race=${race} ${m}/${vc}`,
      near(cubePct, apiPct, 0.11),
      `cube=${cubePct}% api=${apiPct}%`,
    )
  }
}

// -------------------------------------------------------------------
// CASE 3: deo-impacts — per (quarter|year, violation_category) totals
// -------------------------------------------------------------------
async function case3(timeAgg) {
  const body = await fetchJson('/reasons/reasons-deo-impacts', { time_aggregation: timeAgg })
  const points = body.figures.barplot.data
  const nIdx = colIdx('n_stopped')
  const deoSet = new Set(VIOLATION_CATEGORIES_DEO_IMPACTED)
  // Build cube buckets.
  const acc = new Map() // bucket -> Map(vc -> sum)
  for (const row of cube.rows) {
    const q = row[QIDX]
    if (typeof q !== 'string' || q < '2022-Q1') continue
    const vc = row[VCIDX]
    if (!deoSet.has(vc)) continue
    const v = row[nIdx]
    if (typeof v !== 'number') continue
    const bucket = timeAgg === 'year' ? q.slice(0, 4) : q
    if (!acc.has(bucket)) acc.set(bucket, new Map())
    const inner = acc.get(bucket)
    inner.set(vc, (inner.get(vc) ?? 0) + v)
  }
  const SEASON = { Q1: 'Jan-Mar', Q2: 'Apr-Jun', Q3: 'July-Sep', Q4: 'Oct-Dec' }
  function seasonAndYear(q) { const [y, qn] = q.split('-'); return `${SEASON[qn]} ${y}` }

  // Sample first 6 points.
  for (const p of points.slice(0, 8)) {
    const xLabel = p[timeAgg === 'year' ? 'Year' : 'Quarter']
    const vc = p.group
    const apiVal = p['Number of Traffic Stops']
    // Find matching bucket key by transforming back.
    let bucketKey
    if (timeAgg === 'year') bucketKey = String(xLabel)
    else {
      // search for the quarter whose seasonAndYear matches xLabel
      for (const k of acc.keys()) if (seasonAndYear(k) === xLabel) { bucketKey = k; break }
    }
    const inner = bucketKey ? acc.get(bucketKey) : null
    const cubeVal = inner ? (inner.get(vc) ?? 0) : 0
    report(
      `deo-impacts tg=${timeAgg} ${xLabel}/${vc}`,
      cubeVal === apiVal,
      `cube=${cubeVal} api=${apiVal}`,
    )
  }
}

// -------------------------------------------------------------------
// CASE 4: operational — per-race % of operational stops
// -------------------------------------------------------------------
async function case4(year) {
  const body = await fetchJson('/reasons/reasons-operational', { year })
  const points = body.figures.barplot.data
  const opSet = new Set(VIOLATION_CATEGORIES_OPERATIONAL)
  const nIdx = colIdx('n_stopped')
  const tot = new Map() // race -> sum n_stopped
  const op = new Map() // race -> sum n_stopped (operational)
  for (const row of cube.rows) {
    if (!inYear(year)(row)) continue
    const r = row[RIDX]
    if (typeof r !== 'string') continue
    const v = row[nIdx]
    if (typeof v !== 'number') continue
    tot.set(r, (tot.get(r) ?? 0) + v)
    if (opSet.has(row[VCIDX])) op.set(r, (op.get(r) ?? 0) + v)
  }
  for (const p of points) {
    const r = p.Race
    const apiPct = p['Percentage (%)']
    const cubePct = (tot.get(r) ?? 0)
      ? Math.round((1000 * (op.get(r) ?? 0)) / (tot.get(r) ?? 1)) / 10
      : 0
    report(
      `operational year=${year} race=${r}`,
      near(cubePct, apiPct, 0.11),
      `cube=${cubePct}% api=${apiPct}%`,
    )
  }
}

async function main() {
  console.log(`API base: ${API_BASE_URL}`)
  console.log(`Cube:     ${CUBE_PATH}`)
  console.log(`Cube rows: ${cube.rows.length}\n`)

  await case1(2022, 'Black')
  await case1(2023, 'White')
  await case2(2022, 'Non-white')
  await case2(2023, 'White')
  await case3('quarter')
  await case3('year')
  await case4(2022)
  await case4(2023)

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
