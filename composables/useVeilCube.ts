/**
 * Fetch the veil-of-darkness cube (static JSON, shipped from `public/cubes`).
 *
 * Unlike the other cubes this one carries an extra `models` block holding
 * fitted regression results computed at build time.
 */
import type { VeilCube } from '~/utils/veil'

export function useVeilCube() {
  return useAsyncData<VeilCube>(
    'veil-cube',
    () => $fetch<VeilCube>('/cubes/veil.json'),
    { server: false, lazy: true },
  )
}
