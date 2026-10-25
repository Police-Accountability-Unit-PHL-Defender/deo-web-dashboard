import { markRaw } from 'vue'
import type { VeilComparisonCube } from '~/utils/veil'

export function useVeilComparison() {
  return useAsyncData<{ cube: VeilComparisonCube }>(
    'veil-comparison',
    async () => markRaw({ cube: await $fetch<VeilComparisonCube>('/cubes/veil-comparison.json') }),
    { server: false, lazy: true },
  )
}
