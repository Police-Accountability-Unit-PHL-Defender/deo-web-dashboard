#!/usr/bin/env node
/**
 * Parity check: neighborhoods cube derivations vs live FastAPI.
 *
 * Re-implements the five neighborhood-page derivations directly on
 * top of the stops cube and compares each numeric result against
 * the corresponding `/neighborhoods/*` FastAPI endpoint.
 *
 * Tested numbers per case (when applicable):
 *  - num-intrusions:           grand total of `n_intruded`
 *  - searches-vs-frisks:       per-bucket n_searched & n_frisked
 *  - by-demographic-category:  per-group intrusion rate & no-contraband count
 *  - by-neighborhood:          per-district `n_<action>` totals
 *  - compare-districts:        per-district sum of measure
 *
 * Launch FastAPI locally first:
 *   cd deo-backend && SERVER_TYPE=fastapi poetry run python deo_backend/main_fastapi.py
 *   API_BASE_URL=http://127.0.0.1:8123 node scripts/parity_neighborhoods.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CUBE_PATH = join(__dirname, '..', 'public', 'cubes', 'stops.json')
const DISTRICTS_PATH = join(__dirname, '..', 'public', 'cubes', 'districts.json')
const API_BASE_URL = process.env.API_BASE_URL || 'https://deo-api.onrender.com'

const DIVISION_MAP = {
  SPD: ['01', '03', '17'],
  NEPD: ['02', '07', '08', '15', '25'],
  NWPD: ['05', '14', '35', '39'],
  CPD: ['06', '09', '22'],
  SWPD: ['12', '16', '18', '19'],
  EPD: ['24', '25', '26'],
}

function padDistrict(d) {
  return d.length === 1 && /^\d$/.test(d) ? '0' + d : d
}
function locationPredicate(location) {
  if (!location || location === '*') return () => true
  if (location in DIVISION_MAP) {
    const districts = new Set(DIVISION_MAP[location])
    return (loc) => districts.has(loc.split('-', 1)[0])
  }
  const m = /^(\d{1,2})\*?$/.exec(location)
  if (m) {
    const prefix = padDistrict(m[1]) + '-'
    return (loc) => loc.startsWith(prefix)
  }
  return (loc) => loc === location
}

// ----- Cube helpers (mirrored from utils/cube.ts) ------------------

function colIdx(cube, name) {
  const i = cube.dimensions.indexOf(name)
  if (i >= 0) return i
  const j = cube.measures.indexOf(name)
  if (j < 0) throw new Error(`Unknown column: ${name}`)
  return cube.dimensions.length + j
}

function sumMeasure(cube, measure, opts) {
  const f = compileFilter(cube, opts)
  const mIdx = colIdx(cube, measure)
  let total = 0
  for (const row of cube.rows) {
    if (!rowPasses(row, f)) continue
    const v = row[mIdx]
    if (typeof v === 'number') total += v
  }
  return total
}

function compileFilter(cube, opts = {}) {
  return {
    qIdx: cube.dimensions.indexOf('quarter'),
    locIdx: cube.dimensions.indexOf('location'),
    raceIdx: cube.dimensions.indexOf('race'),
    locPred: locationPredicate(opts.location ?? '*'),
    startQuarter: opts.startQuarter,
    endQuarter: opts.endQuarter,
    race: opts.race ? new Set(Array.isArray(opts.race) ? opts.race : [opts.race]) : null,
  }
}
function rowPasses(row, f) {
  if (f.locIdx >= 0) {
    const loc = row[f.locIdx]
    if (typeof loc !== 'string' || !f.locPred(loc)) return false
  }
  if (f.qIdx >= 0 && (f.startQuarter || f.endQuarter)) {
    const q = row[f.qIdx]
    if (typeof q !== 'string') return false
    if (f.startQuarter && q < f.startQuarter) return false
    if (f.endQuarter && q > f.endQuarter) return false
  }
  if (f.race && f.raceIdx >= 0) {
    const v = row[f.raceIdx]
    if (typeof v !== 'string' || !f.race.has(v)) return false
  }
  return true
}

function groupSum(cube, groupBy, measure, opts) {
  const gIdx = colIdx(cube, groupBy)
  const mIdx = colIdx(cube, measure)
  const f = compileFilter(cube, opts)
  const acc = new Map()
  for (const row of cube.rows) {
    if (!rowPasses(row, f)) continue
    const key = String(row[gIdx] ?? '')
    const v = row[mIdx]
    if (typeof v !== 'number') continue
    acc.set(key, (acc.get(key) ?? 0) + v)
  }
  return acc
}

function pct(num, den) {
  if (!den) return 0
  return Math.round((1000 * num) / den) / 10
}

// ----- API fetch ---------------------------------------------------

async function fetchJson(path, params) {
  const u = new URL(path, API_BASE_URL)
  for (const [k, v] of Object.entries(params || {})) {
    if (Array.isArray(v)) {
      for (const item of v) u.searchParams.append(k, item)
    } else {
      u.searchParams.set(k, v)
    }
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

// ----- Test cases --------------------------------------------------

const cube = JSON.parse(readFileSync(CUBE_PATH, 'utf8'))
const districts = JSON.parse(readFileSync(DISTRICTS_PATH, 'utf8'))

let failed = 0
function report(label, ok, extra = '') {
  if (ok) {
    console.log(`OK    ${label}${extra ? '  ' + extra : ''}`)
  } else {
    console.log(`FAIL  ${label}${extra ? '  ' + extra : ''}`)
    failed++
  }
}

function near(a, b, eps = 0.05) {
  return Math.abs(a - b) <= eps
}

// CASE 1: num-intrusions (grand total intrusions; total intrusion %)
async function case1() {
  const location = '*'
  const body = await fetchJson('/neighborhoods/num-intrusions', { location, time_aggregation: 'year' })
  const text = body.text.join(' ')
  const mTotal = /a total of <span>([\d,]+)<\/span> intrusions/.exec(text)
  const mPct = /<span>([\d.]+)%<\/span> of traffic stops involved an intrusion/.exec(text)
  const apiTotal = Number(mTotal[1].replace(/,/g, ''))
  const apiPct = Number(mPct[1])
  const cubeTotal = sumMeasure(cube, 'n_intruded', { location })
  const cubeStops = sumMeasure(cube, 'n_stopped', { location })
  const cubePct = pct(cubeTotal, cubeStops)
  report(
    `num-intrusions ${location} (total intrusions)`,
    cubeTotal === apiTotal,
    `cube=${cubeTotal} api=${apiTotal}`,
  )
  report(
    `num-intrusions ${location} (overall % rate)`,
    near(cubePct, apiPct, 0.11),
    `cube=${cubePct}% api=${apiPct}%`,
  )

  // Per-year totals from the figure.
  const fig = body.figures.barplot.data
  for (const point of fig.slice(0, 3)) {
    const year = String(point.Year)
    const apiYearTotal = point['Number of Intrusions']
    const groups = groupSum(cube, 'quarter', 'n_intruded', { location })
    let cubeYearTotal = 0
    for (const [k, v] of groups) if (k.startsWith(year)) cubeYearTotal += v
    report(
      `num-intrusions ${location} year=${year}`,
      cubeYearTotal === apiYearTotal,
      `cube=${cubeYearTotal} api=${apiYearTotal}`,
    )
  }
}

// CASE 2: searches-vs-frisks per-year n_searched and n_frisked
async function case2() {
  const location = '22*'
  const body = await fetchJson('/neighborhoods/searches-vs-frisks', { location, time_aggregation: 'year' })
  const points = body.figures.barplot.data
  // Pick the search rows for 2014, 2018, 2022.
  for (const yr of [2014, 2018, 2022]) {
    const searches = points.find(p => p.group === '# of searches' && p.Year === yr)
    const frisks = points.find(p => p.group === '# of frisks' && p.Year === yr)
    const startQ = `${yr}-Q1`
    const endQ = `${yr}-Q4`
    const cubeSearch = sumMeasure(cube, 'n_searched', { location, startQuarter: startQ, endQuarter: endQ })
    const cubeFrisk = sumMeasure(cube, 'n_frisked', { location, startQuarter: startQ, endQuarter: endQ })
    if (searches) {
      report(
        `searches-vs-frisks ${location} y=${yr} searches`,
        cubeSearch === searches['Number of Searches or Frisks'],
        `cube=${cubeSearch} api=${searches['Number of Searches or Frisks']}`,
      )
    }
    if (frisks) {
      report(
        `searches-vs-frisks ${location} y=${yr} frisks`,
        cubeFrisk === frisks['Number of Searches or Frisks'],
        `cube=${cubeFrisk} api=${frisks['Number of Searches or Frisks']}`,
      )
    }
  }
}

// CASE 3: by-demographic-category – per-race intrusion rate %
async function case3() {
  const body = await fetchJson('/neighborhoods/neighborhoods-by-demographic-category', {
    demographic_category: 'Race',
    demographic_baseline: 'White',
    location: '*',
    start_qyear: '2014-Q1',
    end_qyear: '2024-Q4',
  })
  const points = body.figures.barplot.data
  for (const p of points) {
    const race = p.Race
    const apiRate = p['Intrusion Rate (%)']
    const intr = sumMeasure(cube, 'n_intruded', { startQuarter: '2014-Q1', endQuarter: '2024-Q4', race })
    const stop = sumMeasure(cube, 'n_stopped', { startQuarter: '2014-Q1', endQuarter: '2024-Q4', race })
    const cubeRate = pct(intr, stop)
    report(
      `by-demographic-category race=${race} rate`,
      near(cubeRate, apiRate, 0.05),
      `cube=${cubeRate}% api=${apiRate}%`,
    )
  }

  // barplot2: intrusions without contraband for Black.
  const noContrabandBlack = points.find // (placeholder)
  const body2pts = body.figures.barplot2.data
  for (const p of body2pts) {
    const race = p.Race
    const apiVal = p['Number of Intrusions without Contraband']
    const intr = sumMeasure(cube, 'n_intruded', { startQuarter: '2014-Q1', endQuarter: '2024-Q4', race })
    const cont = sumMeasure(cube, 'n_contraband', { startQuarter: '2014-Q1', endQuarter: '2024-Q4', race })
    const cubeVal = Math.max(0, intr - cont)
    report(
      `by-demographic-category race=${race} no-contraband count`,
      cubeVal === apiVal,
      `cube=${cubeVal} api=${apiVal}`,
    )
  }
}

// CASE 4: by-neighborhood – per-district totals
async function case4() {
  const body = await fetchJson('/neighborhoods/neighborhoods-by-neighborhood', {
    police_action: 'stop',
    start_qyear: '2022-Q1',
    end_qyear: '2024-Q4',
  })
  const points = body.figures.barplot.data
  // Sample a few districts.
  for (const p of points.slice(0, 5)) {
    // x-axis key uses unicode arrow:
    const district = p['Majority Non-White Districts → Majority White Districts']
    const apiVal = p['Number of Traffic Stops']
    const cubeVal = sumMeasure(cube, 'n_stopped', {
      location: district,
      startQuarter: '2022-Q1',
      endQuarter: '2024-Q4',
    })
    report(
      `by-neighborhood district=${district}`,
      cubeVal === apiVal,
      `cube=${cubeVal} api=${apiVal}`,
    )
  }
}

// CASE 5: compare-districts – sum per-district
async function case5() {
  const body = await fetchJson('/neighborhoods/neighborhoods-compare-districts', {
    police_action: 'stop',
    districts: ['05', '12'],
    start_qyear: '2022-Q1',
    end_qyear: '2024-Q4',
  })
  const points = body.figures.barplot.data
  for (const p of points) {
    const dCode = p.District
    const apiVal = p['Number of Traffic Stops']
    const cubeVal = sumMeasure(cube, 'n_stopped', {
      location: dCode,
      startQuarter: '2022-Q1',
      endQuarter: '2024-Q4',
    })
    report(
      `compare-districts district=${dCode}`,
      cubeVal === apiVal,
      `cube=${cubeVal} api=${apiVal}`,
    )
  }
}

async function main() {
  console.log(`API base: ${API_BASE_URL}`)
  console.log(`Cube rows: ${cube.rows.length}`)
  console.log(`Districts: ${Object.keys(districts).length}\n`)
  await case1()
  await case2()
  await case3()
  await case4()
  await case5()
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
