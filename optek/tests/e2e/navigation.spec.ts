import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('header brand links to home', async ({ page }) => {
    await page.goto('/blog')
    const brandLink = page.locator('header').getByRole('link', { name: /OpoRuta/i })
    await expect(brandLink).toBeVisible()
    await brandLink.click()
    await expect(page).toHaveURL('/')
  })

  test('blog nav link navigates to blog', async ({ page }) => {
    await page.goto('/')
    const blogLink = page.locator('header').getByRole('link', { name: /blog/i })
    await expect(blogLink).toBeVisible()
    await blogLink.click()
    await expect(page).toHaveURL(/\/blog/)
  })

  test('simulacros nav link navigates to examenes-oficiales', async ({ page }) => {
    await page.goto('/')
    const simulacrosLink = page
      .locator('header')
      .getByRole('link', { name: /simulacros/i })
    await expect(simulacrosLink).toBeVisible()
    await simulacrosLink.click()
    await expect(page).toHaveURL(/\/examenes-oficiales/)
  })

  test('footer blog link navigates to blog', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    const blogLink = footer.getByRole('link', { name: /blog/i })
    await expect(blogLink).toBeVisible()
    await blogLink.click()
    await expect(page).toHaveURL(/\/blog/)
  })

  test('footer simulacros link navigates to examenes-oficiales', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    const simulacrosLink = footer.getByRole('link', { name: /simulacros/i })
    await expect(simulacrosLink).toBeVisible()
    await simulacrosLink.click()
    await expect(page).toHaveURL(/\/examenes-oficiales/)
  })

  test('legal pages are accessible from footer', async ({ page }) => {
    await page.goto('/')

    // Privacy
    const privacyLink = page.locator('footer').getByRole('link', { name: /privacidad/i })
    await expect(privacyLink).toBeVisible()
    await privacyLink.click()
    await expect(page).toHaveURL(/\/legal\/privacidad/)
    await expect(page).toHaveTitle(/Privacidad.*OpoRuta/i)

    // Go back and check terms
    await page.goto('/')
    const termsLink = page.locator('footer').getByRole('link', { name: /términos|condiciones/i })
    await expect(termsLink).toBeVisible()
    await termsLink.click()
    await expect(page).toHaveURL(/\/legal\/terminos/)

    // Go back and check cookies
    await page.goto('/')
    const cookiesLink = page.locator('footer').getByRole('link', { name: /cookies/i })
    await expect(cookiesLink).toBeVisible()
    await cookiesLink.click()
    await expect(page).toHaveURL(/\/legal\/cookies/)
  })
})
