// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, nextTick, ref } from 'vue'
import VeilPage from '../components/VeilSummary.vue'
import SensitivityPage from '../pages/veil-sensitivity.vue'
import CoefficientGraph from '../components/CoefficientGraph.vue'
import SelectVeilGroups from '../components/SelectVeilGroups.vue'
import VeilSensitivityComparison from '../components/VeilSensitivityComparison.vue'
import { hasSignificantVeilChange } from '../utils/veil'

const oldCube = JSON.parse(readFileSync('public/cubes/veil.json', 'utf8'))
const comparison = JSON.parse(readFileSync('public/cubes/veil-comparison.json', 'utf8'))
const bundle = ref({ cube: structuredClone(comparison) })
const content = { template: '<div><slot/></div>' }
const factory = (page = VeilPage) => mount(page, {
  global: { stubs: {
    LayoutPageHeader: { template: '<header><slot name="header"/><slot name="quote"/></header>' },
    Quote: { template: '<div>Professor Lance Hannon<slot name="quoteText"/></div>' },
    Answer: content, AnswerText: content, QuestionHeader: content,
    IconsChevron: true, IconsClose: true, IconsCheckbox: true, SelectOne: true,
  } },
})
beforeEach(() => {
  bundle.value = { cube: structuredClone(comparison) }
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('useAsyncData', (key: string) => ({ data: key === 'veil-comparison' ? bundle : ref({ cube: oldCube }), error: ref(null) }))
  vi.stubGlobal('computed', computed); vi.stubGlobal('ref', ref)
})
afterEach(() => vi.unstubAllGlobals())

describe('Main veil page', () => {
  it('shows the no-MVC sole-occupant pre/post chart without methods links', () => {
    const wrapper = factory()
    const charts = wrapper.findAllComponents(CoefficientGraph)
    expect(charts).toHaveLength(1)
    const result = comparison.main
    expect(charts[0].props('estimates').map(e => [e.x, e.value, e.ciLo, e.ciHi])).toEqual([
      ['Before', result.effects.reference.effect_pp, result.effects.reference.effect_ci_lo_pp, result.effects.reference.effect_ci_hi_pp],
      ['After', result.effects.group.effect_pp, result.effects.group.effect_ci_lo_pp, result.effects.group.effect_ci_hi_pp],
    ])
    expect(charts[0].findAll('circle')).toHaveLength(2)
    expect(charts[0].findAll('.ci-whisker')).toHaveLength(2)
    expect(wrapper.text()).toContain('No statistically significant change.')
    expect(wrapper.text()).toContain('statistically significant both before and after Driving Equality')
    expect(wrapper.text()).toContain('483,531 evening vehicle stops')
    expect(wrapper.text()).toContain('No recorded violation code is required')
    expect(wrapper.find('a[href="/veil-sensitivity"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('by Year')
    expect(wrapper.text()).not.toContain('Among men ages 18–29')
  })

  it('updates period significance independently of the pre/post change', async () => {
    const wrapper = factory()
    bundle.value.cube.main.effects.reference.effect_pp = -2.345
    bundle.value.cube.main.effects.group.effect_ci_hi_pp = 0
    await nextTick()
    expect(wrapper.text()).toContain('statistically significant before Driving Equality, but not after.')
    expect(wrapper.text()).toContain('No statistically significant change.')
    bundle.value.cube.main.effects.reference.effect_ci_hi_pp = 0.5
    await nextTick()
    expect(wrapper.text()).toContain('not statistically significant in either period.')
  })

  it.each([[0.01, 0.5], [-0.5, -0.01]])('changes the answer when the direct difference interval is [%s, %s]', async (lo, hi) => {
    const wrapper = factory()
    // Both period intervals already exclude zero on today's data. They must
    // not control the pre/post answer; only the difference interval does.
    expect(wrapper.text()).toContain('No statistically significant change.')
    bundle.value.cube.main.difference_ci_lo_pp = lo
    bundle.value.cube.main.difference_ci_hi_pp = hi
    await nextTick()
    expect(wrapper.text()).toContain('A statistically significant change.')
    expect(wrapper.text()).not.toContain('No statistically significant change.')
  })

  it.each([VeilPage, SensitivityPage])('derives visible dates and chart hover dates from the current cube', async (page) => {
    const wrapper = factory(page)
    const dates = () => wrapper.find('[aria-label="Pre and post analysis dates"]').text()
    expect(dates()).toContain('January 1, 2014 through March 2, 2022')
    expect(dates()).toContain('March 3, 2022 through December 31, 2025')
    expect(dates()).toContain(page === VeilPage ? 'We leave out 2020' : 'Excluding 2020')
    if (page === VeilPage) {
      expect(dates()).toContain('We compare stops before Driving Equality')
      expect(dates()).toContain('with stops after it')
    } else {
      expect(dates()).toContain('Philadelphia local time')
      expect(dates()).toContain('covering more years before the law than after')
      expect(dates()).toContain('partial years are left out')
    }
    // A future cube must update the visible dates and hovers without a page edit.
    bundle.value.cube.window_start = '2015-01-01'
    bundle.value.cube.window_end = '2026-12-31'
    bundle.value.cube.effective_date = '2022-03-04'
    bundle.value.cube.excluded_years = [2020, 2021]
    await nextTick()
    expect(dates()).toContain('January 1, 2015 through March 3, 2022')
    expect(dates()).toContain('March 4, 2022 through December 31, 2026')
    expect(dates()).toContain(page === VeilPage ? 'We leave out 2020–2021' : 'Excluding 2020–2021')
    expect(dates()).not.toContain('December 31, 2025')
    const points = wrapper.findComponent(CoefficientGraph).props('estimates')
    expect(points[0].hoverText).toContain('January 1, 2015 through March 3, 2022')
    expect(points[1].hoverText).toContain('March 4, 2022 through December 31, 2026')
    expect(points[0].hoverText).toContain('Excluded from the analysis: 2020–2021')
    wrapper.unmount()
  })

  it.each([[0, 0.5], [-0.5, 0], [-0.5, 0.5]])('keeps an interval touching or crossing zero nonsignificant', (lo, hi) => {
    expect(hasSignificantVeilChange({ ...comparison.main, difference_ci_lo_pp: lo, difference_ci_hi_pp: hi })).toBe(false)
  })

  it('does not present a failed fit as a no-change result', () => {
    bundle.value.cube.main.converged = false
    const wrapper = factory()
    expect(wrapper.findComponent(CoefficientGraph).exists()).toBe(false)
    expect(wrapper.text()).toContain('The comparison is unavailable.')
    expect(wrapper.text()).not.toContain('No statistically significant change.')
  })
})

describe('Combined sensitivity page', () => {
  it('moves annual and young-men charts behind the sensitivity comparison', () => {
    const wrapper = factory(SensitivityPage)
    const charts = wrapper.findAllComponents(CoefficientGraph)
    expect(charts).toHaveLength(3)
    expect(charts.map(c => c.findAll('circle').length)).toEqual([8, 24, 24])
    expect(wrapper.text()).toContain('0 of 16 versions show a statistically significant change in the daylight–darkness difference after Driving Equality')
    expect(wrapper.text()).toContain('rather than the main page')
    expect(wrapper.find('a[href="/snapshot#veil-of-darkness"]').exists()).toBe(true)
    const annual = charts[1].props('estimates')
    expect(annual.find(e => e.x === '2025' && e.group === 'Daylight').value).toBeCloseTo(79.9, 1)
  })

  it('changes the plotted data and direct intervals for both denominator and MVC choices', async () => {
    const wrapper = factory(SensitivityPage)
    const comparisonComponent = wrapper.findComponent(VeilSensitivityComparison)
    await comparisonComponent.find('select[aria-label="Race comparison"]').setValue('all_races')
    await comparisonComponent.find('select[aria-label="Recorded violation code"]').setValue('true')
    const chosen = comparison.sensitivity.filter(f => f.universe === 'all_races' && f.require_mvc)
    expect(comparisonComponent.findComponent(CoefficientGraph).props('estimates').map(e => e.value)).toEqual(
      chosen.flatMap(f => [f.result.effects.reference.effect_pp, f.result.effects.group.effect_pp]))
    expect(comparisonComponent.text()).toContain('561,259')
    expect(comparisonComponent.findAll('tbody tr')).toHaveLength(4)
  })

  it('retains the expandable district breakdown', async () => {
    const wrapper = factory(SensitivityPage)
    const details = wrapper.find('details')
    ;(details.element as HTMLDetailsElement).open = true
    await details.trigger('toggle')
    wrapper.findComponent(SelectVeilGroups).vm.$emit('update:modelValue', 'Older woman (30+)')
    await nextTick()
    const chart = wrapper.findAllComponents(CoefficientGraph)[3]
    const moderation = oldCube.intraracial.by_year.district_blackness_moderation.groups.find(e => e.group === 'older_female')
    expect(chart.props('estimates').map(e => e.value)).toEqual(moderation.effects.map(e => e.effect_pp))
  })
})
