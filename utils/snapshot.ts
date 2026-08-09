/**
 * Annual summary for the snapshot page, computed from the stops cube.
 *
 * This replaces the prebuilt `snapshot.json`, which was produced by invoking
 * the legacy FastAPI handler `pages/snapshot/annual_summary.py`. Every value
 * here is derivable from the stops cube; the only external input is the city
 * population, which is static census data (see POPULATION_BY_RACE).
 */
import { groupSum, sumMeasure, type Cube } from './cube'
import type { Quarter } from './index'

// Order mirrors deo_backend/models.py RacialGroup.
const RACE_ORDER = ['Asian', 'Black', 'Latino', 'White', 'All Other Races'] as const

/**
 * Philadelphia population by race, 2020 Census.
 *
 * Source: ssuffian/censusify-philly -> csvs/police_service_area.csv, summed
 * across all 65 PSAs. Static; unaffected by a quarterly data update.
 * See pipeline/ASSETS.md for how to regenerate.
 */
const POPULATION_BY_RACE: Record<string, number> = {
  Asian: 132987,
  Black: 613835,
  Latino: 238277,
  White: 550828,
  'All Other Races': 67870,
}

// Driving Equality took effect 2022-03-03. The published comparison uses
// calendar 2021 against the first full year after, both quarter-aligned.
const DEO_BEFORE = { startQuarter: '2021-Q1', endQuarter: '2021-Q4' }
const DEO_AFTER = { startQuarter: '2022-Q2', endQuarter: '2023-Q1' }

const round1 = (n: number) => Math.round(n * 10) / 10
const fmt = (n: number) => n.toLocaleString('en-US')

export interface AnnualSummaryFigure {
  properties: { xAxis: string; yAxis: string; title: string }
  trendlines: never[]
  data: Array<Record<string, unknown>>
}

export interface AnnualSummary {
  text: string[]
  figures: Record<'barplot' | 'barplot2' | 'barplot3', AnnualSummaryFigure>
}

function byRace(cube: Cube, opts: Record<string, string>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const { key, value } of groupSum(cube, 'race', 'n_stopped', opts)) out[key] = value
  return out
}

const totalOf = (m: Record<string, number>) =>
  Object.values(m).reduce((a, b) => a + b, 0)

export function buildAnnualSummary(cube: Cube, mostRecentQuarter: Quarter): AnnualSummary {
  // Trailing four quarters, inclusive.
  let start = mostRecentQuarter
  for (let i = 0; i < 3; i += 1) start = start.getPreviousQuarter()
  const window = { startQuarter: start.toParamString(), endQuarter: mostRecentQuarter.toParamString() }
  const rangeStr = `${start.getStartString()} through ${mostRecentQuarter.getEndString()}`
  const rangeStrFull = `${start.getStartString()} through the end of ${mostRecentQuarter.getEndString()}`

  const total = sumMeasure(cube, 'n_stopped', window)
  // Mirrors get_avg_monthly_value: total / quarters / 3.
  const avgMonthly = Math.round(total / 4 / 3)

  const contraband = sumMeasure(cube, 'n_contraband', window)
  const intruded = sumMeasure(cube, 'n_intruded', window)
  const missRate = round1((1 - contraband / intruded) * 100)

  const stopsByRace = byRace(cube, window)
  const stopsTotal = totalOf(stopsByRace)
  const popTotal = totalOf(POPULATION_BY_RACE)

  const beforeByRace = byRace(cube, DEO_BEFORE)
  const afterByRace = byRace(cube, DEO_AFTER)
  const beforeTotal = totalOf(beforeByRace)
  const afterTotal = totalOf(afterByRace)
  const pctDecrease = round1(((beforeTotal - afterTotal) / beforeTotal) * 100)

  const pctRow = (group: string, race: string, pct: number, hover: string[]) => ({
    group,
    Race: race,
    'Percentage (%)': pct,
    annotation: null,
    hover_text: hover,
  })

  const barplot: AnnualSummaryFigure = {
    properties: {
      xAxis: 'Race',
      yAxis: 'Percentage (%)',
      title: `Racial Demographics of Traffic Stops vs. City Population from ${rangeStr}`,
    },
    trendlines: [],
    data: [
      ...RACE_ORDER.map((r) => {
        const pct = round1(((stopsByRace[r] ?? 0) / stopsTotal) * 100)
        return pctRow('% of traffic stops', r, pct, [r, `${pct}% of traffic stops`])
      }),
      ...RACE_ORDER.map((r) => {
        const pct = round1((POPULATION_BY_RACE[r] / popTotal) * 100)
        return pctRow('% of city population', r, pct, [r, `${pct}% of city population`])
      }),
    ],
  }

  const barplot2: AnnualSummaryFigure = {
    properties: {
      xAxis: 'Race',
      yAxis: 'Percentage (%)',
      title:
        'Racial Demographics of Traffic Stops Before and After Driving Equality vs. City Population',
    },
    trendlines: [],
    data: [
      ...RACE_ORDER.map((r) => {
        const pct = round1(((beforeByRace[r] ?? 0) / beforeTotal) * 100)
        return pctRow('% before Driving Equality', r, pct, [
          'Before Driving Equality', r, `${pct}% of traffic stops`,
        ])
      }),
      ...RACE_ORDER.map((r) => {
        const pct = round1(((afterByRace[r] ?? 0) / afterTotal) * 100)
        return pctRow('% after Driving Equality', r, pct, [
          'After Driving Equality', r, `${pct}% of traffic stops`,
        ])
      }),
      ...RACE_ORDER.map((r) => {
        const pct = round1((POPULATION_BY_RACE[r] / popTotal) * 100)
        return pctRow('% of city population', r, pct, [r, `${pct}% of city population`])
      }),
    ],
  }

  const numRow = (group: string, race: string, n: number, label: string) => ({
    group,
    Race: race,
    'Number of Traffic Stops': n,
    annotation: null,
    hover_text: [label, race, `${fmt(n)} traffic stops`],
  })

  const barplot3: AnnualSummaryFigure = {
    properties: {
      xAxis: 'Race',
      yAxis: 'Number of Traffic Stops',
      title: 'Number of Traffic Stops by Race Before and After Driving Equality',
    },
    trendlines: [],
    data: [
      ...RACE_ORDER.map((r) =>
        numRow('# before Driving Equality', r, beforeByRace[r] ?? 0, 'Before Driving Equality'),
      ),
      ...RACE_ORDER.map((r) =>
        numRow('# after Driving Equality', r, afterByRace[r] ?? 0, 'After Driving Equality'),
      ),
    ],
  }

  const blackDrop = (beforeByRace.Black ?? 0) - (afterByRace.Black ?? 0)
  const whiteDrop = (beforeByRace.White ?? 0) - (afterByRace.White ?? 0)

  return {
    text: [
      `From the start of ${rangeStrFull}, police made a total of <span>${fmt(total)}</span> traffic stops in Philadelphia, or an average of <span>${fmt(avgMonthly)}</span> traffic stops per month.`,
      `traffic stops decreased by <span>${pctDecrease}%</span> from <span>${fmt(beforeTotal)}</span> stops to <span>${fmt(afterTotal)}</span> stops`,
      `In the year after Driving Equality, Philadelphia police stopped <span>${fmt(blackDrop)}</span> fewer Black drivers and <span>${fmt(whiteDrop)}</span> fewer white drivers, compared to 2021.`,
      `From the start of ${rangeStrFull}, Philadelphia police did not find any contraband <span>${missRate}%</span> of the time they intruded on people and/or vehicles.`,
    ],
    figures: { barplot, barplot2, barplot3 },
  }
}
