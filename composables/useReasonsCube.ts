/**
 * Fetch the reasons cube (static JSON, shipped from `public/cubes`).
 *
 * The reasons cube has an extra `violation_category` dimension on top
 * of the standard cube layout. No scalars are shipped with it.
 */
import type { Cube } from '~/utils/cube'

export interface ReasonsCubeBundle {
  cube: Cube
}

export function useReasonsCube() {
  return useAsyncData<ReasonsCubeBundle>('reasons-cube', async () => {
    const event = typeof useRequestEvent === 'function' ? useRequestEvent() : null
    const origin = event ? `http://${event.node.req.headers.host}` : ''
    const cube = await $fetch<Cube>(`${origin}/cubes/reasons.json`)
    return { cube }
  })
}
