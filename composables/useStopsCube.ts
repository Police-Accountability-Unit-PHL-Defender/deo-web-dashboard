/**
 * Fetch the stops cube and the shared scalars table in parallel.
 *
 * The cube and scalars are static JSON shipped from `public/cubes`.
 * Using `useAsyncData` lets Nuxt cache the parsed data across page
 * navigations and dedupes parallel calls from sibling components.
 */
import type { Cube, Scalars } from '~/utils/cube'

export interface StopsCubeBundle {
  cube: Cube
  scalars: Scalars
}

export function useStopsCube() {
  return useAsyncData<StopsCubeBundle>('stops-cube', async () => {
    const [cube, scalars] = await Promise.all([
      $fetch<Cube>('/cubes/stops.json'),
      $fetch<Scalars>('/cubes/scalars.json'),
    ])
    return { cube, scalars }
  })
}
