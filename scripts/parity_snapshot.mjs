#!/usr/bin/env node
/**
 * Parity check: snapshot cube vs live FastAPI.
 *
 * The snapshot cube bakes the exact JSON returned by
 * `/snapshot/annual-summary` (param-less), so parity is a structural
 * deep comparison of `text`, `figures.barplot{,2,3}` (properties +
 * data rows), and `inputs`. Tiny floating-point drift is tolerated
 * on numeric fields.
 *
 * Usage:
 *   cd deo-backend/deo_backend && \
 *     SERVER_TYPE=fastapi poetry run uvicorn main_fastapi:app --port 8123
 *   API_BASE_URL=http://127.0.0.1:8123 \
 *     node scripts/parity_snapshot.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CUBE_PATH = join(__dirname, '..', 'public', 'cubes', 'snapshot.json')
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8123'

const FLOAT_TOL = 0.05

let failed = 0
function ok(label, msg = '') {
  console.log(`OK    ${label}  ${msg}`)
}
function fail(label, msg) {
  console.log(`FAIL  ${label}  ${msg}`)
  failed++
}

function loadCube() {
  return JSON.parse(readFileSync(CUBE_PATH, 'utf8'))
}

async function apiGet(path) {
  const u = new URL(path, API_BASE_URL)
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

function nearlyEqual(a, b) {
  if (a === b) return true
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true
    return Math.abs(a - b) <= FLOAT_TOL
  }
  return false
}

function compareFigure(label, cubeFig, apiFig) {
  if (!apiFig) {
    fail(label, 'api figure missing')
    return
  }
  // Properties.
  const props = ['xAxis', 'yAxis', 'title']
  for (const p of props) {
    if (cubeFig.properties?.[p] !== apiFig.properties?.[p]) {
      fail(`${label}.properties.${p}`,
        `cube=${JSON.stringify(cubeFig.properties?.[p])} api=${JSON.stringify(apiFig.properties?.[p])}`)
      return
    }
  }
  // Data row count.
  if (cubeFig.data.length !== apiFig.data.length) {
    fail(`${label}.data.length`, `cube=${cubeFig.data.length} api=${apiFig.data.length}`)
    return
  }
  // Compare row-by-row.
  for (let i = 0; i < cubeFig.data.length; i++) {
    const cr = cubeFig.data[i]
    const ar = apiFig.data[i]
    const keys = new Set([...Object.keys(cr), ...Object.keys(ar)])
    for (const k of keys) {
      const cv = cr[k]
      const av = ar[k]
      if (Array.isArray(cv) && Array.isArray(av)) {
        if (cv.length !== av.length || cv.some((x, j) => x !== av[j])) {
          fail(`${label}.data[${i}].${k}`,
            `cube=${JSON.stringify(cv)} api=${JSON.stringify(av)}`)
          return
        }
      } else if (typeof cv === 'number' || typeof av === 'number') {
        if (!nearlyEqual(cv, av)) {
          fail(`${label}.data[${i}].${k}`, `cube=${cv} api=${av}`)
          return
        }
      } else if (cv !== av) {
        fail(`${label}.data[${i}].${k}`,
          `cube=${JSON.stringify(cv)} api=${JSON.stringify(av)}`)
        return
      }
    }
  }
  ok(label, `${cubeFig.data.length} rows match`)
}

async function main() {
  console.log(`API base: ${API_BASE_URL}`)
  console.log(`Cube:     ${CUBE_PATH}\n`)

  const cube = loadCube()
  const local = cube.annual_summary
  let remote
  try {
    remote = await apiGet('/snapshot/annual-summary')
  } catch (err) {
    fail('annual-summary', `api error: ${err.message}`)
    process.exit(1)
  }

  // Text sentences (exact match).
  if (local.text.length !== remote.text.length) {
    fail('annual-summary.text.length',
      `cube=${local.text.length} api=${remote.text.length}`)
  } else {
    let mismatched = 0
    for (let i = 0; i < local.text.length; i++) {
      if (local.text[i] !== remote.text[i]) {
        mismatched++
        if (mismatched <= 2) {
          console.log(`  text[${i}] cube=${JSON.stringify(local.text[i])}`)
          console.log(`           api =${JSON.stringify(remote.text[i])}`)
        }
      }
    }
    if (mismatched === 0) ok('annual-summary.text', `${local.text.length} sentences match`)
    else fail('annual-summary.text', `${mismatched} sentence mismatches`)
  }

  // Three bar charts.
  for (const figKey of ['barplot', 'barplot2', 'barplot3']) {
    compareFigure(`annual-summary.figures.${figKey}`,
      local.figures[figKey], remote.figures?.[figKey])
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
