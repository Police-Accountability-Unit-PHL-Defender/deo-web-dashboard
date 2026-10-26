// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, onMounted, ref, watch } from 'vue'
import { mount } from '@vue/test-utils'
import Graph from './Graph.vue'

const quarters = ['2025-Q1', '2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2']
afterEach(() => vi.unstubAllGlobals())
const render = (ceiling: string, extra = {}) => {
  for (const [key, value] of Object.entries({ computed, onMounted, ref, watch })) vi.stubGlobal(key, value)
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { cubeQuarters: { stops: quarters } } }))
  vi.stubGlobal('useState', () => ({ value: ceiling }))
  return mount(Graph, { props: {
    graphData: [{ Year: 2025, Count: 10 }, { Year: 2026, Count: 5 }],
    axisProperties: { x: 'Year', y: 'Count' }, ...extra,
  } })
}
const opacity = (wrapper, year) => wrapper.findAll('rect')
  .find(node => node.element.__data__?.Year === year)?.element.parentElement.getAttribute('opacity')

describe('Graph annual completeness', () => {
  it('keeps a half-populated year faded when the clock reaches Q4 or the next year', () => {
    for (const ceiling of ['2026-Q4', '2027-Q1']) {
      const wrapper = render(ceiling)
      expect(opacity(wrapper, 2025)).toBe('1')
      expect(opacity(wrapper, 2026)).toBe('0.5')
      wrapper.unmount()
    }
  })
  it('marks partial grouped and stacked annual bars too', () => {
    for (const mode of ['groupName', 'stackName']) {
      const wrapper = render('2027-Q1', {
        graphData: [{ group: 'Stops', Year: 2025, Count: 10 }, { group: 'Stops', Year: 2026, Count: 5 }],
        [mode]: 'group', groupClasses: { Stops: 'fill-purple' },
      })
      const bars = wrapper.findAll('rect')
      expect(bars).toHaveLength(2)
      const getOpacity = node => String(Number(node.attributes('opacity') || 1) * Number(node.element.parentElement.getAttribute('opacity') || 1))
      expect(getOpacity(bars[0])).toBe('1')
      expect(getOpacity(bars[1])).toBe('0.5')
      bars[1].element.dispatchEvent(new MouseEvent('mouseleave'))
      expect(getOpacity(bars[1])).toBe('0.5')
      wrapper.unmount()
    }
  })
  it('respects a backward pin even when all four quarters exist in the cube', () => {
    const wrapper = render('2026-Q2', { quarterValues: [...quarters, '2026-Q3', '2026-Q4'] })
    expect(opacity(wrapper, 2026)).toBe('0.5')
    wrapper.unmount()
  })
  it('uses the chart-specific coverage and restores solid bars when data is complete', () => {
    const wrapper = render('2026-Q4', { quarterValues: [...quarters, '2026-Q3', '2026-Q4'] })
    expect(opacity(wrapper, 2026)).toBe('1')
    wrapper.unmount()
  })
})
