import { readFileSync } from 'node:fs'

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
  { path: '/veil-sensitivity', name: 'veil-sensitivity', noParity: true },
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
    name: 'neighborhoods arrest rate uses arrests within intrusions',
    pages: ['neighborhoods'],
    assert: ({ text, quarter }) => {
      text = text.replace(/\s+/g, ' ')
      for (const phrase of [
        'When Philadelphia police intrude during traffic stops, how often do they arrest?',
        'Arrest Rates During Intrusions by Race',
        'Arrest Rate During Intrusions (%)',
        'Arrests during stops without a recorded frisk or search are excluded.',
        "Of all traffic stops, what's the arrest rate?",
        'Arrest Rates of All Stops by Race',
        'Contraband Hit Rates by Year for Black and White Drivers',
        'Arrest Rates During Intrusions by Year for Black and White Drivers',
        'Arrest Rates of All Stops by Year for Black and White Drivers',
        'Dashed segments include partial years.',
      ]) if (!text.includes(phrase)) return `arrest graph lost: ${phrase}`
      const cube = JSON.parse(readFileSync(new URL('../.output/public/cubes/stops.json', import.meta.url), 'utf8'))
      const index = name => cube.dimensions.length + cube.measures.indexOf(name)
      if (!cube.measures.includes('n_arrested_intruded')) return 'arrest graph lacks joint arrest/intrusion counts'
      let intrusions = 0, arrests = 0, allArrests = 0, stops = 0
      for (const row of cube.rows) {
        const q = row[cube.dimensions.indexOf('quarter')]
        if (q < '2014-Q1' || q > quarter) continue
        intrusions += row[index('n_intruded')]
        arrests += row[index('n_arrested_intruded')]
        allArrests += row[index('n_arrested')]
        stops += row[index('n_stopped')]
      }
      const rate = intrusions ? Math.round(1000 * arrests / intrusions) / 10 : 0
      if (!text.includes(`${rate}% of traffic stops involving a frisk or search resulted in at least one arrest`)) {
        return 'arrest summary disagrees with arrests within the selected intrusion denominator'
      }
      const allRate = stops ? Math.round(1000 * allArrests / stops) / 10 : 0
      return text.includes(`${allRate}% of all traffic stops resulted in at least one arrest`)
        || 'all-stops arrest summary disagrees with the selected stops denominator'
    },
  },
  {
    name: 'no raw cube/column keys leaked into axis labels',
    // A rendered axis should never show an internal identifier. This is the
    // class of bug that shipped `x_label` as a visible axis title.
    //
    // `veil` is in scope for the `undefined`/`NaN` half above all: that page
    // interpolates around thirty toFixed() results into its prose, and a
    // model or selector returning undefined would render the word straight
    // into a published statistical claim.
    pages: ['stops', 'safety', 'neighborhoods', 'reasons', 'snapshot', 'veil-sensitivity'],
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
      // Case-insensitive: this check was written against "Non-operational" and
      // sat green while the chart title said "Non-Operational" and a hover
      // label said "non-operational". A spelling guard that only catches one
      // capitalisation of the misspelling is not a guard.
      if (/non-operational/i.test(text)) return 'found hyphenated "Non-operational"; the published spelling is "Nonoperational"'
      return true
    },
  },
  {
    // The published spelling is "Nonoperational", everywhere -- not just on the
    // Reasons page. The glossary carried "non-operational" in its own
    // definition of the term for as long as the guard was scoped to one page.
    name: 'the published spelling "Nonoperational" holds site-wide',
    assert: ({ text }) => {
      if (/non-operational/i.test(text)) return 'found hyphenated "Non-operational"; the published spelling is "Nonoperational"'
      return true
    },
  },
  {
    // Every question on this page promises "when Philadelphia police gave a
    // reason", and as of 2026-08 every chart divides by stops that name one. This guards the wording half of that only: the bar values never
    // reach the DOM as text -- they are bar heights and hover labels, and this
    // assert only ever sees rendered text -- so the figures themselves are
    // pinned in utils/reasons.test.ts (Black 2025 at 63.6%, which is 44.8% if
    // `None` and `Other` return to the denominator). Between them the claim and
    // the number cannot drift apart unnoticed.
    name: 'by-race operational question keeps the recorded-reason framing',
    pages: ['reasons'],
    assert: ({ text }) => {
      if (!text.includes('When Philadelphia police gave a reason, how often did police stop people of different races'))
        return 'by-race question is missing or reworded away from the recorded-reason framing'
      if (/Out of all traffic stops/.test(text))
        return 'by-race question still claims the all-stops denominator'
      return true
    },
  },
  {
    name: 'operational trend chart covers 2022 through the partial year',
    pages: ['reasons'],
    assert: ({ text, quarter }) => {
      // Axis ticks appear as bare years in the rendered text.
      const block = /how often did police stop drivers for operational[\s\S]{0,3000}/.exec(text)
      if (!block) return 'could not locate the trend chart'
      const years = [...block[0].matchAll(/\b(20\d\d)\b/g)].map((m) => Number(m[1]))
      if (!years.includes(2022)) return 'trend chart does not start at 2022'
      if (years.includes(2021) || years.includes(2014)) return 'trend chart still shows years before 2022'
      // The series runs to the pinned quarter's year, including it when it is
      // only part-published — that trailing point is the dashed segment. If it
      // stops short, the partial year has been dropped rather than dashed.
      const pinnedYear = Number(String(quarter).slice(0, 4))
      if (!years.includes(pinnedYear)) return `trend chart stops before ${pinnedYear}; the partial year is missing its dashed point`
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
    name: 'veil-of-darkness pages render without console/page errors',
    pages: ['snapshot', 'veil-sensitivity'],
    assert: ({ errors }) =>
      !errors || errors.length === 0 || `console/page error(s): ${errors.join(' | ')}`,
  },
  {
    name: 'veil supporting overview keeps the pooled denominator and uncertainty explicit',
    pages: ['veil-sensitivity'],
    assert: ({ text }) => {
      text = text.replace(/\s+/g, ' ')
      for (const phrase of [
        'This test compares Black and white drivers. From 2014 to 2025, leaving out 2020, 80.4% of the drivers police stopped in daylight were Black. After dark, it was 79.4% — 1.0 percentage point lower',
        'it should not be there if race played no part in who police stopped, and this test tends to understate it',
        'about 804 were Black in daylight and about 794',
        'runs from -1.3 to -0.7 points', 'Latino, Asian, and other drivers are not part of this comparison', '467,617 evening stops, roughly 5 to 8:30 p.m., of adult non-Latino Black and white',
        'in 5 of 11 comparable years the annual difference alone cannot rule out no change',
        'of recorded stops', "do not measure a driver's personal chance of being stopped",
        'likely understates how much', 'harder time seeing who is driving',
        'Researchers call this the veil of darkness test',
        'Black share of drivers stopped (%)', 'Change in Black share (percentage points)',
      ]) {
        if (!text.includes(phrase)) return `pooled race overview lost: ${phrase}`
      }
      return true
    },
  },
  {
    name: 'veil supporting page keeps sensitivity, annual, subgroup, and district analyses together',
    pages: ['veil-sensitivity'],
    assert: ({ text }) => {
      const order = [
        'Before and After Driving Equality Under Different Occupant Definitions',
        'Black Share of Black and White Drivers Stopped by PPD in Daylight and After Dark, by Year',
        'The after-dark line sits below the daylight line in every year from 2014 to 2025',
        'Change in the Black Share of PPD Traffic Stops After Dark: Men Ages 18–29 Compared to All Adults',
        'Is the after-dark change larger or smaller in districts',
        'Explore the district breakdown by age and gender',
        'Read the method, data limitations, and research source',
      ].map(phrase => [phrase, text.indexOf(phrase)])
      for (const [phrase, index] of order) if (index < 0) return `missing: ${phrase}`
      for (let i = 1; i < order.length; i++) {
        if (order[i][1] < order[i - 1][1]) return `out of order: "${order[i][0]}" before "${order[i - 1][0]}"`
      }
      if (!text.includes('gray 2020 point')) return 'the overview lost its 2020 comparability caveat'
      if (!text.includes('dotted vertical line marks Driving Equality')) return 'the change chart lost its policy marker caption'
      return true
    },
  },
  {
    name: 'veil young-men section leads with its pooled result and direct test',
    pages: ['veil-sensitivity'],
    assert: ({ text }) => {
      for (const phrase of [
        'Among men ages 18–29, 81.7% of those police stopped in daylight were Black. After dark, it was 80.0% — 1.7 percentage points lower, compared to 1.0 for all adults',
        'the after-dark drop was 1.3 points larger for young men (95% confidence interval -1.7 to -0.8',
        'The larger drop for young men is very unlikely to be chance',
        '117,268 stops of young men among the 467,617 adult stops',
        'larger for young men than for all adults in 10 of 11 comparable years',
        'the 2025 young-men estimate (+0.4, interval -1.3 to +2.1) is too wide to show a reversal',
      ]) {
        if (!text.includes(phrase)) return `young-men section lost: ${phrase}`
      }
      return true
    },
  },
  {
    name: 'veil main result follows the fitted pre/post difference and selected definition',
    pages: ['snapshot'],
    assert: ({ text }) => {
      text = text.replace(/\s+/g, ' ')
      for (const phrase of [
        'Percentage of stopped drivers who were Black: darkness vs. daylight',
        'No recorded violation code is required', 'with one person recorded at the stop',
        'adult non-Latino Black and white', '95% confidence interval',
      ]) if (!text.includes(phrase)) return `main veil result lost: ${phrase}`
      const cube = JSON.parse(readFileSync(new URL('../.output/public/cubes/veil-comparison.json', import.meta.url), 'utf8'))
      const r = cube.main
      const significant = r.converged && (r.difference_ci_lo_pp > 0 || r.difference_ci_hi_pp < 0)
      const answer = significant ? 'A statistically significant change.' : 'No statistically significant change.'
      if (!text.includes(answer)) return `headline disagrees with the direct difference interval: expected ${answer}`
      if (!text.includes(`${r.n.toLocaleString()} evening vehicle stops`)) return 'main veil denominator disagrees with its fitted sample'
      const formatDate = date => new Intl.DateTimeFormat('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
      }).format(new Date(date))
      const previous = new Date(cube.effective_date)
      previous.setUTCDate(previous.getUTCDate() - 1)
      for (const phrase of [
        `${formatDate(cube.window_start)} through ${formatDate(previous)}`,
        `${formatDate(cube.effective_date)} through ${formatDate(cube.window_end)}`,
        'We compare stops before Driving Equality', 'with stops after it',
      ]) if (!text.includes(phrase)) return `main veil date explanation lost: ${phrase}`
      if (text.includes('Methods and sensitivity checks')) return 'Snapshot still links to the methods page'
      return true
    },
  },
  {
    name: 'veil sensitivity controls and denominators are explicit',
    pages: ['veil-sensitivity'],
    assert: ({ text }) => {
      for (const phrase of ['Race comparison', 'Recorded violation code', 'Sole occupant', 'Anyone Black',
        'Majority Black', 'Everyone Black', 'Direct pre/post differences', 'Every stop counts once',
        'rather than the main page', 'do not identify the driver']) {
        if (!text.includes(phrase)) return `sensitivity page lost: ${phrase}`
      }
      return true
    },
  },
  {
    name: 'Hannon attribution survives on the supporting analysis page',
    pages: ['veil-sensitivity'],
    assert: ({ text }) => text.includes('Hannon') || 'the string "Hannon" is missing from the page',
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
  { page: 'veil-sensitivity', maxBlockingMs: 60 },
]
