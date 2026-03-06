# E2E Tests (Playwright)

End-to-end tests for OpoRuta using Playwright.

## Setup

1. Install Playwright as a dev dependency:

```bash
pnpm add -D @playwright/test
```

2. Install the Chromium browser (only browser we test against):

```bash
npx playwright install chromium
```

3. Add the test script to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

## Running Tests

```bash
# Run all E2E tests (starts dev server automatically)
pnpm test:e2e

# Run a specific test file
pnpm test:e2e tests/e2e/marketing.spec.ts

# Run in headed mode (see the browser)
pnpm test:e2e --headed

# Run with Playwright UI for debugging
pnpm test:e2e --ui
```

## Test Files

| File | What it tests |
|------|--------------|
| `auth.spec.ts` | Login, register, and forgot-password pages load correctly |
| `marketing.spec.ts` | Landing page, blog, pricing section, footer links |
| `navigation.spec.ts` | All marketing nav links work (header + footer) |

## Notes

- Tests use `baseURL: http://localhost:3000` (configured in `playwright.config.ts`)
- Only Chromium is configured to save CI resources
- The dev server starts automatically if not already running
- These tests do NOT require authentication — they only verify public pages
- Retries: 1 (to handle occasional flakiness in CI)
- Traces are captured on first retry for debugging failures

## Adding New Tests

Keep E2E tests focused on critical user paths:

- Page loads without errors
- Navigation works between pages
- Key content is visible (headings, CTAs, forms)

Avoid testing authenticated flows here unless you set up a test user fixture.
