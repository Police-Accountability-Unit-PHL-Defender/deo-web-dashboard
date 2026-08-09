#!/usr/bin/env node
/**
 * Quarterly data update, staged.
 *
 * Runs zip -> SQLite -> cubes, then reports what moved and runs the e2e
 * checks. Stage 3 is the point of the whole thing: historical numbers should
 * not change between backups, and if they do you want to know now rather than
 * after publishing.
 *
 * Usage: npm run update-data -- --zip car_ped_stops_2026-10-20T03_45_06.zip
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const PIPELINE = join(ROOT, 'pipeline')
const CUBES = join(ROOT, 'public', 'cubes')
const TOPICS = ['stops', 'reasons', 'safety', 'scalars']

const argv = process.argv.slice(2)
const zipIdx = argv.indexOf('--zip')
if (zipIdx === -1 || !argv[zipIdx + 1]) {
  console.error('Usage: npm run update-data -- --zip <file in pipeline/data/>')
  process.exit(2)
}
const zip = argv[zipIdx + 1]
if (!existsSync(join(PIPELINE, 'data', zip))) {
  console.error(`Not found: pipeline/data/${zip}`)
  process.exit(2)
}

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', encoding: 'utf8' })

console.log(`\n[1/4] Building SQLite from ${zip} (this takes ~25 minutes)`)
run('uv', ['run', 'python', 'update_db.py', '--zip', zip], PIPELINE)

const dbName = `open_data_philly_${zip.replace('car_ped_stops_', '').split('T')[0].replace(/-/g, '_')}.db`
console.log(`\n[2/4] Building cubes from ${dbName}`)
const staging = mkdtempSync(join(tmpdir(), 'deo-cubes-'))
run('uv', ['run', 'python', 'build_cubes.py', '--db', join('data', dbName), '--out', staging], PIPELINE)

console.log('\n[3/4] Diffing against the published cubes')
const qkey = (q) => { const [y, n] = q.split('-Q'); return Number(y) * 10 + Number(n) }
const SEP = ''
let historicalChanges = 0
for (const topic of ['stops', 'reasons']) {
  const oldCube = JSON.parse(readFileSync(join(CUBES, `${topic}.json`), 'utf8'))
  const newCube = JSON.parse(readFileSync(join(staging, `${topic}.json`), 'utf8'))
  const nd = oldCube.dimensions.length
  const qi = oldCube.dimensions.indexOf('quarter')
  const index = (c) => {
    const m = new Map()
    for (const r of c.rows) m.set(r.slice(0, nd).join(SEP), r.slice(nd).join(SEP))
    return m
  }
  const a = index(oldCube), b = index(newCube)
  const newQuarters = [...new Set(newCube.rows.map((r) => r[qi]))]
    .filter((q) => !oldCube.rows.some((r) => r[qi] === q))
  const cutoff = newQuarters.length ? Math.min(...newQuarters.map(qkey)) : Infinity
  let changed = 0
  for (const [k, v] of a) {
    if (qkey(k.split(SEP)[qi]) >= cutoff) continue
    if (b.get(k) !== v) changed += 1
  }
  historicalChanges += changed
  const added = newQuarters.length ? ` + ${newQuarters.sort().join(', ')} added` : ' no new quarter'
  console.log(`      ${topic}:${added}, ~ ${changed} historical cells changed`)
}
if (historicalChanges > 0) {
  console.log(`\n      NOTE: ${historicalChanges} historical cells moved. Expected only if`)
  console.log('      Open Data Philly revised past records. If the backup predates')
  console.log('      open-data-philly-downloader 0.1.1, suspect unordered row output.')
}

for (const t of TOPICS) copyFileSync(join(staging, `${t}.json`), join(CUBES, `${t}.json`))
console.log(`      cubes written to public/cubes/`)

console.log('\n[4/4] Running e2e checks')
run('node', [join(ROOT, 'e2e', 'parity.mjs'), '--checks-only'], ROOT)

console.log('\nDone. Next: review `git diff --stat public/cubes/`, commit, and open a beta PR.')
