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
    pages: ['stops', 'safety', 'neighborhoods', 'reasons', 'snapshot'],
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
      const missing = ['Operational violations', 'Non-operational violations']
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
      const m = text.match(/In majority white districts, Black drivers were stopped by Philadelphia police ([\d.]+)x more often/)
      if (!m) return 'disparity sentence missing from the neighborhoods page'
      const ratio = Number(m[1])
      if (!Number.isFinite(ratio)) return `disparity ratio is not a number: ${m[1]}`
      if (ratio <= 1) return `disparity ratio implausibly low: ${ratio}`
      if (ratio > 20) return `disparity ratio implausibly high: ${ratio}`
      return true
    },
  },
]
