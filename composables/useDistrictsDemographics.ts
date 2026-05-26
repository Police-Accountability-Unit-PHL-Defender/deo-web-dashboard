/**
 * Per-district demographic totals derived from
 * `data/demographics/police_service_area.csv`.
 *
 * Shipped as a small static JSON in `public/cubes/districts.json`,
 * keyed by zero-padded district code (e.g. `"22"`). Each entry has
 *  - `total`     – total residents
 *  - `white`     – white residents
 *  - `whiteness` – `100 * white / total`, rounded to one decimal
 *
 * Used by the neighborhoods page to order districts from
 * "majority non-white" to "majority white".
 */

export interface DistrictDemographics {
  total: number
  white: number
  whiteness: number
}

export type DistrictsDemographics = Record<string, DistrictDemographics>

export function useDistrictsDemographics() {
  return useAsyncData<DistrictsDemographics>('districts-demographics', () => {
    const event = typeof useRequestEvent === 'function' ? useRequestEvent() : null
    const origin = event ? `http://${event.node.req.headers.host}` : ''
    return $fetch<DistrictsDemographics>(`${origin}/cubes/districts.json`)
  })
}
