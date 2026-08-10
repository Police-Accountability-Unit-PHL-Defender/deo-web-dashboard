/**
 * Fetch the veil-of-darkness cube (static JSON, shipped from `public/cubes`).
 *
 * Unlike the other cubes this one carries an extra `models` block holding
 * fitted regression results computed at build time.
 *
 * Returns the `useAsyncData` result directly (i.e. `{ data, pending,
 * error, ... }` with `data` typed as `VeilCube | null`) — unlike
 * `useReasonsCube`, it does not wrap the cube in a `{ cube }` object.
 * The fetched cube spans 2014-2026; callers that want the paper's
 * 2021-2024 study window must call `restrictToYears` from `~/utils/veil`
 * on `data.value` before passing it to any selector.
 */
import type { VeilCube } from '~/utils/veil'

export function useVeilCube() {
  return useAsyncData<VeilCube>(
    'veil-cube',
    () => $fetch<VeilCube>('/cubes/veil.json'),
    { server: false, lazy: true },
  )
}
