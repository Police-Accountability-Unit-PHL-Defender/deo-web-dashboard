// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { shallowMount } from '@vue/test-utils'
import SelectQuarter from './SelectQuarter.vue'
import { Quarter } from '../utils/index'

afterEach(() => vi.unstubAllGlobals())
describe('SelectQuarter published options', () => {
  it('offers only populated quarters even when the calendar is ahead', () => {
    vi.stubGlobal('Quarter', Quarter)
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('useState', () => ({ value: ['2025-Q4', '2026-Q1', '2026-Q2'] }))
    const wrapper = shallowMount(SelectQuarter, { props: { modelValue: Quarter.fromParamString('2026-Q2'), itemLabelEnd: 'end' } })
    const select = wrapper.findComponent({ name: 'SelectOne' })
    expect(select.props('items').map(q => q.toParamString())).toEqual(['2025-Q4', '2026-Q1', '2026-Q2'])
    expect(Object.values(select.props('itemDisplayText'))).toEqual(['Dec 2025', 'Mar 2026', 'Jun 2026'])
    wrapper.unmount()
  })
})
