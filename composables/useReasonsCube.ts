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
    const cube = await $fetch<Cube>('/cubes/reasons.json')
    return { cube }
  })
}
