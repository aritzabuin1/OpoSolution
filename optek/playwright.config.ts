import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration for OpoRuta.
 *
 * Setup:
 *   pnpm add -D @playwright/test
 *   npx playwright install chromium
 *
 * Run:
 *   pnpm test:e2e
 *
 * Requires the dev server running at http://localhost:3000
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start dev server automatically if not running */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
