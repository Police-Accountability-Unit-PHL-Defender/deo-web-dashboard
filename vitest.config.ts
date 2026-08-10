import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Component tests need a DOM and the Vue SFC compiler. Pure util tests keep
// running in the default node environment — only *.test.ts files that mount a
// component opt into happy-dom, via a `@vitest-environment happy-dom` docblock.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
  },
})
