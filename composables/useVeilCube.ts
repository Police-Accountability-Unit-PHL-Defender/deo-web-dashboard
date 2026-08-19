/**
 * Fetch the veil-of-darkness cube (static JSON, shipped from `public/cubes`).
 *
 * Unlike the other cubes this one carries an extra `models` block holding
 * fitted regression results computed at build time.
 *
 * Matches `useReasonsCube`/`useStopsCube`: the `useAsyncData` result's
 * `data` is a `VeilCubeBundle` (`{ cube: VeilCube }`), not the bare cube.
 * The fetched cube spans 2014-2026; callers that want the paper's
 * 2021-2024 study window must call `restrictToYears` from `~/utils/veil`
 * on `data.value.cube` before passing it to any selector.
 */
// The intraracial types are NOT re-exported from here. Nuxt auto-imports
// `utils/veil.ts` and `composables/` alike, so a re-export puts the same
// name in the auto-import registry twice and Nuxt warns on every one of
// them ("Duplicated imports ... has been ignored"). Nothing imported them
// from this module anyway -- import them from `~/utils/veil` directly.
import { markRaw } from 'vue'
import type { VeilCube } from '~/utils/veil'

export interface VeilCubeBundle {
  cube: VeilCube
}

export function useVeilCube() {
  return useAsyncData<VeilCubeBundle>(
    'veil-cube',
    async () => {
      const cube = await $fetch<VeilCube>('/cubes/veil.json')
      return markRaw({ cube })
    },
    { server: false, lazy: true },
  )
}
