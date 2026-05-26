#!/usr/bin/env node
/**
 * Parity check: stops cube vs live FastAPI.
 *
 * Compares the cube-derived total of `n_stopped` for a given
 * (location, start_qyear, end_qyear) to the value reported by
 * `/stops/num-stops-time-slice` on the FastAPI service.
 *
 * The API returns the total inside the `text` field as:
 *   "... totaling <span>12,345</span> traffic stops ..."
 * (the `figures` object is empty on this endpoint), so we
 * parse that span.
 *
 * The live FastAPI on Render is currently unreachable
 * (`x-render-routing: no-server` — service spun down /
 * retired). Override the base URL with API_BASE_URL when
 * running against a local instance:
 *
 *   cd deo-backend/deo_backend && \
 *     SERVER_TYPE=fastapi poetry run uvicorn main_fastapi:app --port 8123
 *   API_BASE_URL=http://127.0.0.1:8123 node scripts/parity_stops.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CUBE_PATH = join(__dirname, '..', 'public', 'cubes', 'stops.json')
const API_BASE_URL = process.env.API_BASE_URL || 'https://deo-api.onrender.com'

// Mirror DIVISION_MAP / locationPredicate from utils/cube.ts.
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

function loadCube() {
  return JSON.parse(readFileSync(CUBE_PATH, 'utf8'))
}

function cubeTotal(cube, location, startQ, endQ) {
  const dims = cube.dimensions
  const qIdx = dims.indexOf('quarter')
  const locIdx = dims.indexOf('location')
  const nStoppedIdx = dims.length + cube.measures.indexOf('n_stopped')
  const pred = locationPredicate(location)
  let total = 0
  for (const row of cube.rows) {
    const loc = row[locIdx]
    const q = row[qIdx]
    if (typeof loc !== 'string' || !pred(loc)) continue
    if (typeof q !== 'string') continue
    if (q < startQ || q > endQ) continue
    const v = row[nStoppedIdx]
    if (typeof v === 'number') total += v
  }
  return total
}

async function apiTotal(location, startQ, endQ, attempt = 1) {
  const u = new URL('/stops/num-stops-time-slice', API_BASE_URL)
  u.searchParams.set('location', location)
  u.searchParams.set('start_qyear', startQ)
  u.searchParams.set('end_qyear', endQ)
  const ctrl = new AbortController()
  // Render free tier can take 30-60s to cold start; give it plenty.
  const timeoutMs = attempt === 1 ? 90_000 : 60_000
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  let resp
  try {
    resp = await fetch(u, { signal: ctrl.signal })
  } catch (err) {
    if (attempt < 3) {
      console.warn(`  retry ${attempt} after error: ${err.message}`)
      return apiTotal(location, startQ, endQ, attempt + 1)
    }
    throw err
  } finally {
    clearTimeout(t)
  }
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${u}`)
  }
  const body = await resp.json()
  const text = Array.isArray(body.text) ? body.text.join(' ') : String(body.text ?? '')
  // Match "totaling <span>12,345</span> traffic stops"
  const m = /totaling\s*<span>([\d,]+)<\/span>\s*traffic stops/i.exec(text)
  if (!m) {
    throw new Error(`Could not parse total from text: ${text.slice(0, 200)}`)
  }
  return Number(m[1].replace(/,/g, ''))
}

const CASES = [
  { location: '*', start: '2014-Q1', end: '2024-Q4' },
  { location: '*', start: '2022-Q1', end: '2022-Q4' },
  { location: '22*', start: '2022-Q1', end: '2023-Q4' },
  { location: 'SPD', start: '2023-Q1', end: '2024-Q4' },
  { location: '01-1', start: '2022-Q1', end: '2024-Q4' },
]

async function main() {
  console.log(`API base: ${API_BASE_URL}`)
  console.log(`Cube:     ${CUBE_PATH}`)
  const cube = loadCube()
  console.log(`Cube rows: ${cube.rows.length}\n`)
  let failed = 0
  for (const c of CASES) {
    const label = `${c.location}  ${c.start}..${c.end}`
    let local, remote
    try {
      local = cubeTotal(cube, c.location, c.start, c.end)
      remote = await apiTotal(c.location, c.start, c.end)
    } catch (err) {
      console.log(`FAIL  ${label}  error: ${err.message}`)
      failed++
      continue
    }
    const delta = local - remote
    if (delta === 0) {
      console.log(`OK    ${label}  total=${local.toLocaleString()}`)
    } else {
      console.log(
        `FAIL  ${label}  cube=${local.toLocaleString()}  api=${remote.toLocaleString()}  delta=${delta}`,
      )
      failed++
    }
  }
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
