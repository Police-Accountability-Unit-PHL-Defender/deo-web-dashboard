/**
 * What the parity harness checks. This is the file to edit over time.
 *
 * Two independent things live here:
 *
 *   PAGES  — routes rendered on both the local build and the live site and
 *            compared line by line. Add a route here and it is covered.
 *
 *   CHECKS — assertions about the local build alone. Use these for things a
 *            diff cannot catch, because they'd be "equally wrong" on both
 *            sides, or for invariants that must hold after a data update.
 *
 * A check receives { text, page, quarter } and returns true, false, or a
 * string describing the failure. Returning a string is preferred — it shows
 * up in the report.
 */

export const LIVE_URL = 'https://driving-equality.phillydefenders.org'

export const PAGES = [
  { path: '/', name: 'index' },
  { path: '/snapshot', name: 'snapshot' },
  { path: '/stops', name: 'stops' },
  { path: '/reasons', name: 'reasons' },
  { path: '/neighborhoods', name: 'neighborhoods' },
  { path: '/safety', name: 'safety' },
  { path: '/driving-equality', name: 'driving-equality' },
  { path: '/data', name: 'data' },
  { path: '/glossary', name: 'glossary' },
  { path: '/contact', name: 'contact' },
  // Not on the live site yet (unlinked from nav on purpose), so it is rendered
  // and run through CHECKS like every other page, but `noParity: true` tells
  // parity.mjs to skip the live diff for it — a diff against a page that
  // doesn't exist in production would fail by construction, not signal a
  // regression.
  { path: '/veil-of-darkness', name: 'veil', noParity: true },
]

/**
 * Normalizations applied to both sides before diffing.
 *
 * Only add one when a difference is genuinely not a regression. Every entry
 * here is a blind spot, so keep the list short and say why.
 */
export const NORMALIZERS = [
  // Vercel Analytics injects nothing visible in prod but logs locally; it
  // never contributes page text, so nothing to strip today. Kept as the
  // documented place to add such rules.
]

export const CHECKS = [
  {
    name: 'no raw cube/column keys leaked into axis labels',
    // A rendered axis should never show an internal identifier. This is the
    // class of bug that shipped `x_label` as a visible axis title.
    //
    // `veil` is in scope for the `undefined`/`NaN` half above all: that page
    // interpolates around thirty toFixed() results into its prose, and a
    // model or selector returning undefined would render the word straight
    // into a published statistical claim.
    pages: ['stops', 'safety', 'neighborhoods', 'reasons', 'snapshot', 'veil'],
    assert: ({ text }) => {
      const leaked = ['x_label', 'y_label', 'n_stopped', 'age_range', 'districtoccur', 'undefined', 'NaN']
        .filter((k) => text.includes(k))
      return leaked.length === 0 || `leaked identifier(s) in page text: ${leaked.join(', ')}`
    },
  },
  {
    name: 'race categories render in canonical order',
    // groupSum returns keys alphabetically, which puts "All Other Races"
    // first; the backend's RacialGroup enum puts it last.
    //
    // Scoped to the by-Race chart's tick labels: the demographics table
    // further down the page also contains these words, in frequency order,
    // so searching the whole page would compare the wrong thing.
    pages: ['stops'],
    assert: ({ text }) => {
      const block = /by Race from [^\n]*\n([\s\S]*?)\nRace\n/.exec(text)
      if (!block) return true // chart not present in this page state
      const ticks = block[1].split('\n').map((s) => s.trim()).filter(Boolean)
      const expected = ['Asian', 'Black', 'Latino', 'White', 'All Other Races']
      const got = ticks.filter((t) => expected.includes(t))
      return got.join('|') === expected.join('|')
        || `race ticks were [${got.join(', ')}], expected [${expected.join(', ')}] — check demoOrder() in stops.vue`
    },
  },
  {
    name: 'the most recent quarter appears on the stops page',
    pages: ['stops'],
    assert: ({ text, quarter }) => {
      const [year, q] = quarter.split('-Q')
      const endMonth = { 1: 'Mar', 2: 'Jun', 3: 'Sep', 4: 'Dec' }[q]
      return text.includes(`${endMonth} ${year}`)
        || `expected the range to end at ${endMonth} ${year} (quarter ${quarter})`
    },
  },
  {
    name: 'totals are thousands-separated, not raw integers',
    pages: ['stops'],
    assert: ({ text }) =>
      /made a total of [\d]{1,3}(,[\d]{3})+ traffic stops/.test(text)
      || 'stops total is missing or not thousands-separated',
  },
  {
    name: 'operational trend chart is framed and spelled as published',
    // The legend keys double as the chart's data keys, so a rename that misses
    // one silently drops a series' colour rather than erroring.
    pages: ['reasons'],
    assert: ({ text }) => {
      if (!text.includes('When Philadelphia police gave a reason, how often did police stop drivers for operational'))
        return 'operational trend heading is missing or reworded'
      if (!text.includes('Nonoperational violations')) return 'legend is missing "Nonoperational violations"'
      if (/Non-operational/.test(text)) return 'found hyphenated "Non-operational"; the published spelling is "Nonoperational"'
      return true
    },
  },
  {
    name: 'operational trend chart covers 2022 onward, complete years only',
    pages: ['reasons'],
    assert: ({ text }) => {
      // Axis ticks appear as bare years in the rendered text.
      const block = /how often did police stop drivers for operational[\s\S]{0,3000}/.exec(text)
      if (!block) return 'could not locate the trend chart'
      const years = [...block[0].matchAll(/\b(20\d\d)\b/g)].map((m) => Number(m[1]))
      if (!years.includes(2022)) return 'trend chart does not start at 2022'
      if (years.includes(2021) || years.includes(2014)) return 'trend chart still shows years before 2022'
      return true
    },
  },
  {
    name: 'no empty chart bodies',
    // A chart whose data key stopped matching its axis label renders an empty
    // plot rather than throwing. Axis titles with no tick labels near them is
    // the cheapest signal.
    pages: ['stops', 'safety'],
    assert: ({ text }) =>
      !/\n(Quarter|Year)\n\s*\n/.test(text) || 'an axis rendered with no tick labels',
  },
  {
    name: 'operational trend chart renders both series',
    // The chart is client-rendered from the cube; if the computed returns
    // null or the component throws, the section silently disappears rather
    // than erroring, so assert on the rendered legend.
    pages: ['reasons'],
    assert: ({ text }) => {
      const missing = ['Operational violations', 'Nonoperational violations']
        .filter((s) => !text.includes(s))
      return missing.length === 0 || `operational trend chart missing legend text: ${missing.join(', ')}`
    },
  },
  {
    name: 'majority-white disparity sentence renders a plausible ratio',
    // Guards the published claim itself: a zero population denominator would
    // print Infinity, and a failed demographics fetch would drop the sentence
    // silently rather than erroring.
    pages: ['neighborhoods'],
    assert: ({ text }) => {
      const m = text.match(/In majority white districts, Philadelphia police stopped Black drivers ([\d.]+)x more often than white drivers from the start of .+ through the end of /)
      if (!m) return 'disparity sentence missing from the neighborhoods page'
      const ratio = Number(m[1])
      if (!Number.isFinite(ratio)) return `disparity ratio is not a number: ${m[1]}`
      if (ratio <= 1) return `disparity ratio implausibly low: ${ratio}`
      if (ratio > 20) return `disparity ratio implausibly high: ${ratio}`
      return true
    },
  },
  {
    name: 'veil-of-darkness page renders without console/page errors',
    pages: ['veil'],
    assert: ({ errors }) =>
      !errors || errors.length === 0 || `console/page error(s): ${errors.join(' | ')}`,
  },
  {
    name: "chart 1's Black-motorist count is in the expected range",
    // Regression guard on the cube join, not the exact figure (actual is
    // 36,781) — a wrong join could plausibly still land near it.
    pages: ['veil'],
    assert: ({ text }) => {
      // Chart 1's bar annotations render, in data order (Black then White),
      // right after the y-axis title — e.g. "Number of Motorists Stopped\n
      // 36,781\n5,529". Anchoring on the axis title rather than the "Black
      // motorists" tick label avoids also matching the demographic table
      // further down the page, which repeats the same words.
      const m = /Number of Motorists Stopped\s*\n\s*([\d,]+)\s*\n\s*([\d,]+)/.exec(text)
      if (!m) return 'could not find chart 1\'s bar annotations on the page'
      const n = Number(m[1].replace(/,/g, ''))
      return (n >= 30000 && n <= 45000)
        || `Black-motorist count was ${n.toLocaleString()}, expected 30,000–45,000`
    },
  },
  {
    name: 'chart 3 group frisk rate is at least double the solo frisk rate',
    // Actual is 19.3% against 7.1%. This is the page's central finding, so
    // guard the ratio rather than the exact figures.
    pages: ['veil'],
    assert: ({ text }) => {
      const m = /frisk rate[\s\S]{0,80}?—\s*([\d.]+)%\s*against\s*([\d.]+)%/.exec(text)
      if (!m) return 'could not find the group-vs-solo frisk rate sentence on the page'
      const [group, solo] = [Number(m[1]), Number(m[2])]
      return group >= 2 * solo
        || `group frisk rate ${group}% is not at least double solo frisk rate ${solo}%`
    },
  },
  {
    name: 'Hannon attribution survives on the veil-of-darkness page',
    pages: ['veil'],
    assert: ({ text }) => text.includes('Hannon') || 'the string "Hannon" is missing from the page',
  },
  {
    name: 'intraracial veil panels render with both lighting states',
    // The panels are client-rendered from the cube; if the computed returns
    // null the section vanishes silently rather than erroring.
    pages: ['veil'],
    assert: ({ text }) => {
      const missing = ['under 30 and male', 'Daylight', 'After dark']
        .filter((s) => !text.includes(s))
      return missing.length === 0 || `intraracial panels missing: ${missing.join(', ')}`
    },
  },
]

/**
 * Responsiveness budgets.
 *
 * Each entry drives one real interaction and asserts how long the main thread
 * was blocked. Elapsed time is not the measure that matters: a page can finish
 * in 300ms having been frozen for 250 of them, and freezing is what users
 * notice — during a long task nothing responds, not the hover cursor, not a
 * click, not scrolling. The Source link on this site looked broken for exactly
 * that reason; it was fine, the thread was busy.
 *
 * `script` is evaluated in the page and must resolve once the interaction has
 * settled. Both interactions currently block for 0ms, so a 100ms budget leaves
 * generous headroom for machine variance while still catching a real
 * regression: removing `markRaw` from the stops cube alone takes the map click
 * to 145ms, and a 250ms budget let that pass unnoticed.
 */
export const INTERACTIONS = [
  {
    name: 'neighborhoods demographic toggle',
    page: 'neighborhoods',
    maxBlockingMs: 100,
    script: `
      (async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
        const buttons = () => Array.from(document.querySelectorAll('button'))
        const trigger = buttons().find((b) => /^(race|age range|gender)$/i.test(b.textContent.trim()))
        if (!trigger) return 'no demographic control found'
        const want = /race/i.test(trigger.textContent) ? 'age range' : 'race'
        trigger.click()
        await sleep(600)
        const option = Array.from(document.querySelectorAll('[role="option"],li,button'))
          .find((e) => e.textContent.trim().toLowerCase() === want)
        if (!option) return 'no option ' + want
        option.click()
        await sleep(2500)
        return 'toggled to ' + want
      })()
    `,
  },
  {
    name: 'stops district map click',
    page: 'stops',
    maxBlockingMs: 100,
    script: `
      (async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
        const buttons = () => Array.from(document.querySelectorAll('button'))
        const loc = buttons().find((b) => b.textContent.trim() === 'Philadelphia')
        if (!loc) return 'no location control'
        loc.click()
        await sleep(2500)
        const gran = buttons().find((b) => b.textContent.trim() === 'city')
        if (!gran) return 'no granularity control'
        gran.click()
        await sleep(800)
        const district = Array.from(document.querySelectorAll('[role="option"],li,button'))
          .find((e) => e.textContent.trim().toLowerCase() === 'district')
        if (!district) return 'no district option'
        district.click()
        await sleep(3500)
        // data-region is set by LeafletMap.vue so a specific district can be
        // addressed; the polygons carry no other identifying attribute.
        const target = document.querySelector('path[data-region="District 14"]')
          || document.querySelectorAll('path.leaflet-interactive')[4]
        if (!target) return 'no district polygon'
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
        await sleep(2500)
        return 'clicked district'
      })()
    `,
  },
]

/**
 * First-render blocking budgets.
 *
 * Scoped to the pages that load a cube -- the static pages have nothing to
 * block on, and each entry costs a full page load in wall-clock. The measure
 * is main-thread blocking, exactly as in INTERACTIONS above; see `measureLoad`
 * in parity.mjs for why load needs an observer of its own.
 *
 * Unlike the interaction budgets, these do NOT sit against a measured zero.
 * First render genuinely costs something here: the cube is fetched, decoded
 * and aggregated once before anything is on screen. Measured over three runs
 * of a release build:
 *
 *     snapshot        90-98ms      neighborhoods   155-187ms
 *     stops           88-93ms      safety          0ms
 *     reasons         0-58ms       veil            0ms
 *
 * The budgets below are those maxima with roughly half again as headroom, so
 * an ordinary slow run does not cry wolf. That is loose enough to be quiet and
 * still tight enough for the regression it exists to catch: dropping markRaw
 * from one cube composable costs 128ms on the veil page, which puts every one
 * of these pages over its budget. Veil is the page that prompted all of this and
 * it measures 0ms, because it is the one that has its markRaw -- take it away
 * and the same page blocks for 128ms, well past the 60ms it is held to here.
 *
 * Set these from measurement, never from a round number that looks tidy. If a
 * page legitimately gets slower, move its budget in the same commit that makes
 * it slower and say why -- a budget quietly raised to make a red run green is
 * worse than no budget, because it reads as coverage.
 */
export const LOAD_BUDGETS = [
  { page: 'snapshot', maxBlockingMs: 150 },
  { page: 'stops', maxBlockingMs: 150 },
  { page: 'reasons', maxBlockingMs: 120 },
  { page: 'neighborhoods', maxBlockingMs: 280 },
  { page: 'safety', maxBlockingMs: 60 },
  { page: 'veil', maxBlockingMs: 60 },
]
