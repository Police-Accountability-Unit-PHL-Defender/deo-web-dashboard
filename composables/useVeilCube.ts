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
import type {
  VeilCube,
  VeilIntraracial,
  VeilIntraracialByYear,
  VeilIntraracialGroup,
  VeilIntraracialLighting,
  VeilIntraracialModel,
  VeilIntraracialProbability,
  VeilIntraracialSample,
  VeilIntraracialYearEstimate,
} from '~/utils/veil'

export type {
  VeilIntraracial,
  VeilIntraracialByYear,
  VeilIntraracialGroup,
  VeilIntraracialLighting,
  VeilIntraracialModel,
  VeilIntraracialProbability,
  VeilIntraracialSample,
  VeilIntraracialYearEstimate,
}

export interface VeilCubeBundle {
  cube: VeilCube
}

export function useVeilCube() {
  return useAsyncData<VeilCubeBundle>(
    'veil-cube',
    async () => {
      const cube = await $fetch<VeilCube>('/cubes/veil.json')
      return { cube }
    },
    { server: false, lazy: true },
  )
}
