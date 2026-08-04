import { test, expect, type Page } from '@playwright/test'

function pricingSection(page: Page) {
  return page
    .locator('main section')
    .filter({ has: page.getByRole('heading', { name: /Pricing that scales/ }) })
}

function tier(page: Page, name: string) {
  return pricingSection(page).locator(`li[data-tier="${name}"]`)
}

test.describe('Pricing Preset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('heading', { name: /Pricing that scales/ }).scrollIntoViewIfNeeded()
  })

  test('renders three tiers with figures, features and a call to action', async ({ page }) => {
    await expect(pricingSection(page).locator('li[data-tier]')).toHaveCount(3)

    for (const [name, price, cta] of [
      ['Starter', '$29', 'Start free trial'],
      ['Team', '$89', 'Start free trial'],
      ['Scale', '$249', 'Talk to us'],
    ]) {
      const card = tier(page, name!)
      await expect(card).toContainText(price!)
      await expect(card.getByRole('link', { name: cta })).toBeVisible()
    }

    await expect(tier(page, 'Starter').locator('ul > li')).toHaveCount(3)
  })

  test('switches every tier to annual and back', async ({ page }) => {
    const starter = tier(page, 'Starter')
    await expect(starter).toContainText('$29')
    await expect(starter).toContainText('per month')

    await page.getByRole('button', { name: 'Annual' }).click()
    await expect(starter).toContainText('$290')
    await expect(starter).toContainText('per year')
    await expect(tier(page, 'Scale')).toContainText('$2,490')

    await page.getByRole('button', { name: 'Monthly' }).click()
    await expect(starter).toContainText('$29')
    await expect(starter).toContainText('per month')
  })

  test('shows the annual note only when annual is selected', async ({ page }) => {
    const note = pricingSection(page).getByText('Two months free on annual billing.')

    await expect(note).toBeHidden()
    await page.getByRole('button', { name: 'Annual' }).click()
    await expect(note).toBeVisible()
  })

  test('marks the highlighted tier in text, not colour alone', async ({ page }) => {
    await expect(pricingSection(page).locator('li[data-tier][data-featured]')).toHaveCount(1)
    await expect(tier(page, 'Team')).toHaveAttribute('data-featured', 'true')
    await expect(tier(page, 'Team').getByText('Most popular')).toBeVisible()
    await expect(tier(page, 'Starter').getByText('Most popular')).toHaveCount(0)
  })

  test('sends every tier call to action to its configured destination', async ({ page }) => {
    for (const [name, href] of [
      ['Starter', '/signup'],
      ['Team', '/signup'],
      ['Scale', '/contact'],
    ] as [string, string][]) {
      await expect(tier(page, name).getByRole('link')).toHaveAttribute('href', href)
    }
  })

  test('announces the billing period change to assistive technology', async ({ page }) => {
    const status = pricingSection(page).locator('[aria-live="polite"]')

    await expect(status).toHaveText('Showing monthly pricing')
    await page.getByRole('button', { name: 'Annual' }).click()
    await expect(status).toHaveText('Showing annual pricing')
  })

  test('names the toggle for assistive technology and reports its state', async ({ page }) => {
    const group = pricingSection(page).getByRole('group', { name: 'Billing period' })
    await expect(group).toBeVisible()

    const monthly = page.getByRole('button', { name: 'Monthly' })
    await expect(monthly).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Annual' }).click()
    await expect(monthly).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('Pricing is server-rendered apart from the toggle', () => {
  test('ships both figures in the server HTML, so the toggle only reveals them', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text()

    for (const figure of ['$29', '$290', '$89', '$890', '$249', '$2,490']) {
      expect(html, figure).toContain(figure)
    }
  })

  test('renders the tiers before any JavaScript runs', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')

    await expect(tier(page, 'Team')).toContainText('$89')
    await expect(tier(page, 'Team').getByRole('link', { name: 'Start free trial' })).toBeVisible()

    await context.close()
  })
})
