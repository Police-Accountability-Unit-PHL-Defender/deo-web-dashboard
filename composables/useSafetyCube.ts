/**
 * Fetch the safety cube (static JSON, shipped from `public/cubes`).
 *
 * The safety cube bundles three sub-structures used by the safety page:
 *
 * - `hin`: a small standard-shape cube of HIN counts grouped by
 *   `[quarter, year, location]` with measures
 *   `[n_stopped_locatable_on_hin, n_stopped_locatable]`. Used by the
 *   bar chart that mirrors `/safety/safety-num-accidents`.
 * - `hin_map`: pre-built flat feature list (HIN road geometry +
 *   sampled stops as Point features) used by the HIN LeafletMap.
 * - `shootings_vs_stops`: pre-computed surge / DEO district-level
 *   feature collections + start/end stop totals used to render the
 *   "X% increase" sentences.
 */
import type { Cube } from '~/utils/cube'

export interface HinMapFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: unknown }
}

export interface ShootingsVsStopsMap {
  title: string
  features: HinMapFeature[]
  n_stopped_start: number
  n_stopped_end: number
}

export interface SafetyCube {
  version: number
  hin: Cube
  hin_map: {
    title: string
    features: HinMapFeature[]
  }
  shootings_vs_stops: {
    surge: ShootingsVsStopsMap
    deo: ShootingsVsStopsMap
  }
}

export interface SafetyCubeBundle {
  cube: SafetyCube
}

export function useSafetyCube() {
  return useAsyncData<SafetyCubeBundle>('safety-cube', async () => {
    const event = typeof useRequestEvent === 'function' ? useRequestEvent() : null
    const origin = event ? `http://${event.node.req.headers.host}` : ''
    const cube = await $fetch<SafetyCube>(`${origin}/cubes/safety.json`)
    return { cube }
  })
}
