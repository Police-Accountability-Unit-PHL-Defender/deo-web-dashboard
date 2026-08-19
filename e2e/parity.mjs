#!/usr/bin/env node
/**
 * End-to-end parity harness: renders the local static build and the live site
 * in a real browser and diffs the visible text of every page.
 *
 * Why a browser: cube data is fetched client-side, so the shipped HTML is
 * nearly empty. Fetching the HTML would compare almost nothing.
 *
 * Why the quarter is pinned: `mostRecentQuarter` is derived from today's date,
 * not from the data. If the local build has newer data than production, every
 * page differs on date ranges and the diff is useless. Pinning the local build
 * to the quarter production was built from isolates "did the code change what
 * we render" from "did the data move forward".
 *
 * Usage:
 *   node e2e/parity.mjs --quarter 2026-Q1 --cubes ../path/to/q1/cubes
 *   node e2e/parity.mjs --checks-only          # no live comparison
 *   node e2e/parity.mjs --only stops,safety
 *   node e2e/parity.mjs --skip-build           # reuse .output/public
 *
 * Requires: agent-browser on PATH (npm i -g agent-browser).
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CHECKS, INTERACTIONS, LIVE_URL, NORMALIZERS, PAGES } from './config.mjs'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const OUT_DIR = join(ROOT, '.output', 'public')
const ARTIFACT_DIR = join(ROOT, 'e2e', '.artifacts')
const PORT = Number(process.env.E2E_PORT || 8899)

// ---------------------------------------------------------------- arg parsing

function parseArgs(argv) {
  const args = { only: null, quarter: null, cubes: null, skipBuild: false, checksOnly: false, liveUrl: LIVE_URL }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--only') args.only = argv[++i].split(',').map((s) => s.trim())
    else if (a === '--quarter') args.quarter = argv[++i]
    else if (a === '--cubes') args.cubes = resolve(argv[++i])
    else if (a === '--live-url') args.liveUrl = argv[++i]
    else if (a === '--skip-build') args.skipBuild = true
    else if (a === '--checks-only') args.checksOnly = true
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0) }
    else { console.error(`Unknown argument: ${a}`); printHelp(); process.exit(2) }
  }
  return args
}

function printHelp() {
  const header = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]
  console.log(header.replace(/^#!.*\n/, '').replace(/^\/\*\*?\n?/, '').replace(/^ ?\* ?/gm, ''))
}

// ------------------------------------------------------------------ utilities

function sh(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts })
}

/** Mirrors plugins/mostRecentQuarter.js: the previous calendar quarter. */
function previousCalendarQuarter(now = new Date()) {
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return q === 1 ? `${now.getFullYear() - 1}-Q4` : `${now.getFullYear()}-Q${q - 1}`
}

function haveAgentBrowser() {
  const r = spawnSync('agent-browser', ['--version'], { encoding: 'utf8' })
  return r.status === 0
}

/**
 * Start the static server as a child process and resolve once it is listening.
 *
 * It must be a separate process: this harness drives the browser with
 * synchronous child_process calls, which block the event loop. An in-process
 * server would never answer the browser while we sat waiting for it.
 */
function startServer(dir, port) {
  const child = spawn(process.execPath, [join(ROOT, 'e2e', 'static-server.mjs'), dir, String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return new Promise((res, rej) => {
    const timer = setTimeout(() => rej(new Error(`static server did not start on port ${port}`)), 10000)
    child.stdout.on('data', (buf) => {
      if (buf.toString().includes('ready')) { clearTimeout(timer); res(child) }
    })
    child.stderr.on('data', (buf) => {
      const msg = buf.toString()
      if (msg.includes('EADDRINUSE')) {
        clearTimeout(timer)
        rej(new Error(`port ${port} is already in use — set E2E_PORT to something else`))
      }
    })
    child.on('exit', (code) => { clearTimeout(timer); rej(new Error(`static server exited (${code})`)) })
  })
}

// ------------------------------------------------------------------ rendering

/**
 * Render a URL and return its visible text.
 *
 * Charts are drawn after the cube fetch resolves, and the cubes are several
 * megabytes, so "networkidle" alone is not enough. Poll the body text until
 * two consecutive reads match, which is a real readiness signal rather than a
 * guessed sleep.
 */
function renderText(session, url, { tries = 12, settleMs = 1200 } = {}) {
  const ab = (...a) => {
    const r = spawnSync('agent-browser', ['--session', session, ...a], {
      encoding: 'utf8',
      env: { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: process.env.AGENT_BROWSER_DEFAULT_TIMEOUT || '90000' },
    })
    return r.stdout || ''
  }
  ab('open', url)
  ab('wait', '--load', 'networkidle')

  let previous = null
  for (let i = 0; i < tries; i += 1) {
    const current = ab('get', 'text', 'body')
    if (previous !== null && current === previous && current.trim().length > 0) return current
    previous = current
    ab('wait', String(settleMs))
  }
  return previous ?? ''
}


/**
 * Drive an interaction in the page and report how long the main thread was
 * blocked while it ran.
 *
 * Elapsed time alone hides the thing users actually feel. A cube query that
 * scans every row, or a framework proxying a 138k-row structure, shows up as a
 * single long task during which nothing responds — no hover, no click, no
 * scroll. Interactions here once blocked for over a second while still
 * "working", so this measures blocking, not duration.
 */
function measureInteraction(session, url, script) {
  const ab = (...a) => {
    const r = spawnSync('agent-browser', ['--session', session, ...a], {
      encoding: 'utf8',
      env: { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: process.env.AGENT_BROWSER_DEFAULT_TIMEOUT || '120000' },
    })
    return r.stdout || ''
  }
  const evalFile = (body) =>
    spawnSync('agent-browser', ['--session', session, 'eval', '--stdin'], {
      encoding: 'utf8',
      input: body,
      env: { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: process.env.AGENT_BROWSER_DEFAULT_TIMEOUT || '120000' },
    }).stdout || ''

  ab('open', url)
  ab('wait', '--load', 'networkidle')
  // The cubes are fetched client-side; give the first render time to settle so
  // load-time work is not counted against the interaction.
  ab('wait', '8000')

  evalFile(OBSERVER_SNIPPET)
  const out = evalFile(script)
  // Return a bare number and parse digits: agent-browser wraps eval output as
  // a JSON string, and round-tripping structured data through that is fragile.
  const raw = evalFile("String((window.__e2eLongTasks || []).reduce((a, b) => a + b, 0))")
  const m = raw.match(/(\d+)/)
  const blockedMs = m ? Number(m[1]) : null
  return { blockedMs, scriptOutput: out.trim() }
}

const OBSERVER_SNIPPET = `
window.__e2eLongTasks = []
new PerformanceObserver((l) => {
  for (const e of l.getEntries()) window.__e2eLongTasks.push(Math.round(e.duration))
}).observe({ entryTypes: ['longtask'] })
'installed'
`

// ------------------------------------------------------------------- diffing

function normalize(text) {
  let out = text.replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n')
  for (const fn of NORMALIZERS) out = fn(out)
  return out
}

function diffLines(a, b) {
  const left = normalize(a).split('\n')
  const right = normalize(b).split('\n')
  // Longest common subsequence over lines, then emit the non-matching ones.
  const n = left.length, m = right.length
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (left[i] === right[j]) { i += 1; j += 1 }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(`- ${left[i++]}`)
    else out.push(`+ ${right[j++]}`)
  }
  while (i < n) out.push(`- ${left[i++]}`)
  while (j < m) out.push(`+ ${right[j++]}`)
  return out
}

// ---------------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const pages = args.only ? PAGES.filter((p) => args.only.includes(p.name)) : PAGES
  if (pages.length === 0) { console.error('No pages selected.'); process.exit(2) }

  if (!haveAgentBrowser()) {
    console.error('agent-browser not found on PATH. Install it with: npm i -g agent-browser')
    process.exit(2)
  }

  if (args.cubes && !existsSync(args.cubes)) {
    console.error(`--cubes path not found: ${args.cubes}`)
    process.exit(2)
  }

  if (!args.skipBuild) {
    console.log(`Building${args.quarter ? ` (quarter pinned to ${args.quarter})` : ''}…`)
    sh('npm', ['run', 'generate'], {
      cwd: ROOT,
      stdio: ['ignore', 'ignore', 'inherit'],
      env: { ...process.env, NUXT_PUBLIC_PINNED_MOST_RECENT_QUARTER: args.quarter || '' },
    })
  }
  if (!existsSync(OUT_DIR)) { console.error(`No build at ${OUT_DIR}. Drop --skip-build.`); process.exit(2) }

  // Swap the comparison cubes into the build output rather than public/, so a
  // parity run never leaves an older data vintage sitting in the source tree.
  if (args.cubes) {
    console.log(`Serving cubes from ${args.cubes}`)
    cpSync(args.cubes, join(OUT_DIR, 'cubes'), { recursive: true })
  }

  rmSync(ARTIFACT_DIR, { recursive: true, force: true })
  mkdirSync(ARTIFACT_DIR, { recursive: true })

  const server = await startServer(OUT_DIR, PORT)
  const localBase = `http://127.0.0.1:${PORT}`
  const failures = []
  // Checks need a concrete quarter. When nothing is pinned the site derives it
  // from today's date (previous calendar quarter), so mirror that here.
  const quarter = args.quarter || previousCalendarQuarter()

  try {
    for (const page of pages) {
      const notes = []
      const localText = renderText('e2e-local', `${localBase}${page.path}`)
      writeFileSync(join(ARTIFACT_DIR, `local_${page.name}.txt`), localText)

      if (!args.checksOnly) {
        const liveText = renderText('e2e-live', `${args.liveUrl}${page.path}`)
        writeFileSync(join(ARTIFACT_DIR, `live_${page.name}.txt`), liveText)
        const d = diffLines(liveText, localText)
        if (d.length) {
          failures.push({ page: page.name, kind: 'diff', detail: d })
          notes.push(`differs from live (${d.length} lines)`)
        } else {
          notes.push('matches live')
        }
      }

      for (const check of CHECKS) {
        if (check.pages && !check.pages.includes(page.name)) continue
        let result
        try {
          result = check.assert({ text: localText, page: page.name, quarter })
        } catch (err) {
          result = `threw: ${err.message}`
        }
        if (result !== true) {
          failures.push({ page: page.name, kind: 'check', name: check.name, detail: [String(result)] })
          notes.push(`✗ ${check.name}`)
        }
      }
      console.log(`${page.name.padEnd(18)} ${notes.join('; ') || 'ok'}`)
    }

    // Responsiveness budgets. Run after the page comparisons so a failure here
    // is clearly separate from a content difference.
    const interactions = INTERACTIONS.filter(
      (it) => !args.only || args.only.includes(it.page),
    )
    if (interactions.length) {
      console.log('')
      for (const it of interactions) {
        const { blockedMs, scriptOutput } = measureInteraction(
          'e2e-interaction',
          `${localBase}/${it.page}`,
          it.script,
        )
        if (blockedMs === null) {
          failures.push({
            page: it.page,
            kind: 'check',
            name: it.name,
            detail: [`could not read blocking time; script returned: ${scriptOutput.slice(0, 200)}`],
          })
          console.log(`${it.name.padEnd(46)} could not measure`)
          continue
        }
        const ok = blockedMs <= it.maxBlockingMs
        if (!ok) {
          failures.push({
            page: it.page,
            kind: 'check',
            name: it.name,
            detail: [
              `main thread blocked ${blockedMs}ms, budget ${it.maxBlockingMs}ms.`,
              'Blocking means the page is frozen: no hover, no click, no scroll.',
              'Suspects, in the order they have actually bitten here: a cube that',
              'is reactive (see markRaw in the composables), a query that scans',
              'every row instead of a district slice, or a chart redraw that forces',
              'layout in a loop.',
            ],
          })
        }
        console.log(`${it.name.padEnd(46)} blocked ${blockedMs}ms (budget ${it.maxBlockingMs}ms) ${ok ? 'ok' : 'FAIL'}`)
      }
    }
  } finally {
    server.kill()
    for (const s of ['e2e-local', 'e2e-live']) spawnSync('agent-browser', ['--session', s, 'close'])
  }

  console.log('\n')
  if (failures.length === 0) {
    console.log(`PASS — ${pages.length} page(s) checked${args.checksOnly ? '' : `, identical to ${args.liveUrl}`}`)
    return 0
  }

  console.log(`FAIL — ${failures.length} problem(s)\n`)
  for (const f of failures) {
    console.log(f.kind === 'diff'
      ? `── ${f.page}: differs from live (- live / + local)`
      : `── ${f.page}: check failed — ${f.name}`)
    for (const line of f.detail.slice(0, 40)) console.log(`   ${line}`)
    if (f.detail.length > 40) console.log(`   … ${f.detail.length - 40} more`)
    console.log('')
  }
  console.log(`Rendered text saved to ${ARTIFACT_DIR}`)
  return 1
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(err)
  process.exit(1)
})
