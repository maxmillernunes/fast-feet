import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./test/setup-e2e.ts'],
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  oxc: false,
  resolve: {
    tsconfigPaths: true,
  },
})
