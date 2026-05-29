/**
 * Fetch the snapshot cube (static JSON, shipped from `public/cubes`).
 *
 * The snapshot vertical has a single param-less endpoint
 * (`/snapshot/annual-summary`), so the cube simply bakes the entire
 * FastAPI JSON response under `annual_summary`. The page consumes
 * that blob directly — no shaping required.
 */

export interface SnapshotAnnualSummaryFigure {
  properties: {
    xAxis: string
    yAxis: string
    title: string
  }
  trendlines: unknown[]
  data: Array<Record<string, unknown>>
}

export interface SnapshotAnnualSummary {
  text: string[]
  figures: {
    barplot: SnapshotAnnualSummaryFigure
    barplot2: SnapshotAnnualSummaryFigure
    barplot3: SnapshotAnnualSummaryFigure
    [key: string]: SnapshotAnnualSummaryFigure
  }
  tables: Record<string, unknown>
  geojsons: unknown[]
  data: Record<string, unknown>
  inputs: Record<string, unknown>
}

export interface SnapshotCube {
  version: number
  annual_summary: SnapshotAnnualSummary
}

export function useSnapshotCube() {
  return useAsyncData<SnapshotCube>(
    'snapshot-cube',
    () => $fetch<SnapshotCube>('/cubes/snapshot.json'),
    { server: false, lazy: true },
  )
}
