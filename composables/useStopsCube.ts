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
    const event = typeof useRequestEvent === 'function' ? useRequestEvent() : null
    const origin = event ? `http://${event.node.req.headers.host}` : ''
    const [cube, scalars] = await Promise.all([
      $fetch<Cube>(`${origin}/cubes/stops.json`),
      $fetch<Scalars>(`${origin}/cubes/scalars.json`),
    ])
    return { cube, scalars }
  })
}
