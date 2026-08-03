import { test, expect } from '@playwright/test'

test.describe('Newsletter Preset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('heading', { name: 'Get the release notes' }).scrollIntoViewIfNeeded()
  })

  function newsletterForm(page: import('@playwright/test').Page) {
    return page.locator('form').filter({ has: page.getByRole('button', { name: 'Subscribe' }) })
  }

  test('reports a missing email against the field rather than submitting', async ({ page }) => {
    const form = newsletterForm(page)
    await form.getByRole('button', { name: 'Subscribe' }).click()

    await expect(form.locator('[data-field="email"]')).toContainText(/required/i)
    await expect(page.getByText('You are on the list')).toHaveCount(0)
  })

  test('rejects a malformed email before it reaches the server', async ({ page }) => {
    const form = newsletterForm(page)
    await form.getByLabel('Email').fill('not-an-email')
    await form.getByRole('button', { name: 'Subscribe' }).click()

    await expect(form.locator('[data-field="email"]')).toContainText(/email/i)
  })

  test('confirms a successful subscription in place of the form', async ({ page }) => {
    const form = newsletterForm(page)
    await form.getByLabel('Email').fill(`e2e-${Date.now()}@example.com`)
    await form.getByRole('button', { name: 'Subscribe' }).click()

    await expect(page.getByText('You are on the list')).toBeVisible()
    await expect(newsletterForm(page)).toHaveCount(0)
  })
})

test.describe('Contact Preset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('heading', { name: 'Talk to us' }).scrollIntoViewIfNeeded()
  })

  function contactFormLocator(page: import('@playwright/test').Page) {
    return page.locator('form').filter({ has: page.getByRole('button', { name: 'Send message' }) })
  }

  test('reports every missing field at once', async ({ page }) => {
    const form = contactFormLocator(page)
    await form.getByRole('button', { name: 'Send message' }).click()

    for (const field of ['name', 'email', 'subject', 'message']) {
      await expect(form.locator(`[data-field="${field}"]`)).toContainText(/required/i)
    }
  })

  test('accepts a complete message and confirms it was received', async ({ page }) => {
    const form = contactFormLocator(page)
    await form.getByLabel('Your name').fill('Priya')
    await form.getByLabel('Email').fill(`e2e-${Date.now()}@example.com`)
    await form.getByLabel('Subject').fill('Pricing')
    await form.getByLabel('Message').fill('Could you tell me more about the team plan?')
    await form.getByRole('button', { name: 'Send message' }).click()

    await expect(page.getByText('we have your message')).toBeVisible()
  })
})
