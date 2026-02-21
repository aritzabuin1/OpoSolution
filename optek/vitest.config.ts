import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        // Threshold al 80% en lib/ai/ y lib/utils/ — CI falla si no se cumple (0.12.5)
        'lib/ai/**': { lines: 80, functions: 80, branches: 80 },
        'lib/utils/**': { lines: 80, functions: 80, branches: 80 },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
