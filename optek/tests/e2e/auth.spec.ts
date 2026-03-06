import { test, expect } from '@playwright/test'

test.describe('Auth pages', () => {
  test('login page loads and has form', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)

    // Should have email and password inputs
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Should have a submit button
    await expect(page.getByRole('button', { name: /iniciar|entrar|login/i })).toBeVisible()
  })

  test('register page loads and has form', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL(/\/register/)

    // Should have email input
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()

    // Should have a submit/register button
    await expect(
      page.getByRole('button', { name: /registr|crear|sign up/i })
    ).toBeVisible()
  })

  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page).toHaveURL(/\/forgot-password/)

    // Should have email input for password recovery
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible()
  })

  test('login page has link to register', async ({ page }) => {
    await page.goto('/login')
    const registerLink = page.getByRole('link', { name: /registr|crear cuenta/i })
    await expect(registerLink).toBeVisible()
  })

  test('login page has link to forgot password', async ({ page }) => {
    await page.goto('/login')
    const forgotLink = page.getByRole('link', { name: /olvidé|recuperar|forgot/i })
    await expect(forgotLink).toBeVisible()
  })
})
