// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Answer from './Answer.vue'

describe('component test harness', () => {
  it('mounts a real component and renders its slot', () => {
    const wrapper = mount(Answer, { slots: { default: '<p>hello</p>' } })
    expect(wrapper.html()).toContain('hello')
  })
})
