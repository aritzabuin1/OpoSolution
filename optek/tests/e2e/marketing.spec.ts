import { test, expect } from '@playwright/test'

test.describe('Marketing pages', () => {
  test('landing page loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/OpoRuta/)
  })

  test('landing page has hero section with CTA', async ({ page }) => {
    await page.goto('/')

    // Should have the brand name visible
    await expect(page.getByText('OpoRuta').first()).toBeVisible()

    // Should have at least one call-to-action button
    const ctaButtons = page.getByRole('link', { name: /empezar|probar|registr/i })
    await expect(ctaButtons.first()).toBeVisible()
  })

  test('landing page has pricing section', async ({ page }) => {
    await page.goto('/')
    const pricingSection = page.locator('#precios')
    await expect(pricingSection).toBeAttached()

    // Scroll to pricing and verify it's visible
    await pricingSection.scrollIntoViewIfNeeded()
    await expect(pricingSection).toBeVisible()
  })

  test('landing page has FAQ section', async ({ page }) => {
    await page.goto('/')
    const faqSection = page.locator('#faq')
    await expect(faqSection).toBeAttached()
  })

  test('blog page loads and has posts', async ({ page }) => {
    await page.goto('/blog')
    await expect(page).toHaveTitle(/Blog.*OpoRuta/i)

    // Should have at least one blog post link
    const articleLinks = page.getByRole('link').filter({ hasText: /.{20,}/ })
    await expect(articleLinks.first()).toBeVisible()
  })

  test('examenes oficiales page loads', async ({ page }) => {
    await page.goto('/examenes-oficiales')
    await expect(page).toHaveTitle(/Simulacros.*INAP|Examen.*INAP/i)
  })

  test('footer has legal links', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    await expect(footer.getByRole('link', { name: /privacidad/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /términos|condiciones/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /cookies/i })).toBeVisible()
  })
})
