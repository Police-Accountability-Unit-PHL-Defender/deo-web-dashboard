import { defineConfig, defaultExclude } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Component tests need a DOM and the Vue SFC compiler. Pure util tests keep
// running in the default node environment — only *.test.ts files that mount a
// component opt into happy-dom, via a `@vitest-environment happy-dom` docblock.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    // .claude/worktrees/** holds OTHER sessions' git worktree checkouts of
    // unrelated branches. Their *.test.ts files match vitest's default glob
    // and get collected + executed against that branch's source (relative
    // imports), silently inflating/contaminating this repo's test counts.
    // Keep vitest's own defaults (node_modules, dist, .nuxt, etc.) and add
    // this — do not replace the list, or you lose those default excludes.
    exclude: [...defaultExclude, '**/.claude/worktrees/**'],
  },
})
