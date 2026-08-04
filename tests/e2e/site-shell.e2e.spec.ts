import { test, expect, type Page } from '@playwright/test'

const DESKTOP = { width: 1280, height: 900 }
const PHONE = { width: 390, height: 844 }

function header(page: Page) {
  return page.locator('header').first()
}

function siteFooter(page: Page) {
  return page.locator('footer').filter({ hasText: 'All rights reserved' })
}

test.describe('SiteShell on desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await page.goto('/')
  })

  test('wraps the page in a header and footer without nesting a second main', async ({ page }) => {
    await expect(header(page)).toBeVisible()
    await expect(siteFooter(page)).toBeVisible()
    await expect(page.locator('main')).toHaveCount(1)
  })

  test('renders the header from config, in the configured order', async ({ page }) => {
    const labels = await header(page)
      .getByRole('navigation')
      .first()
      .locator('a, button')
      .allInnerTexts()

    expect(labels.map((label) => label.trim())).toEqual(['Product', 'Admin', 'Toggle theme'])
  })

  test('opens the dropdown and reveals its configured links', async ({ page }) => {
    const trigger = header(page).getByRole('button', { name: 'Product' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const menu = page.locator('[data-slot="navigation-menu-content"]')

    const expected: [string, string][] = [
      ['Landing page', '/'],
      ['Dashboard', '/dashboard'],
      ['Charts', '/dashboard/charts'],
    ]

    for (const [label, href] of expected) {
      await expect(menu.getByRole('link', { name: new RegExp(`^${label}`) })).toHaveAttribute(
        'href',
        href,
      )
    }
  })

  test('opens the dropdown from the keyboard alone', async ({ page }) => {
    const trigger = header(page).getByRole('button', { name: 'Product' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('runs the named Action rather than navigating', async ({ page }) => {
    const url = page.url()
    const action = header(page).getByRole('button', { name: 'Toggle theme' })
    await expect(action).toHaveAttribute('data-action', 'toggleTheme')

    await expect(page.locator('html')).toHaveClass(/light/)
    await action.click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    expect(page.url()).toBe(url)
  })

  test('keeps the Action choice across a reload', async ({ page }) => {
    await header(page).getByRole('button', { name: 'Toggle theme' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('renders every footer column and marks the off-site link safe', async ({ page }) => {
    const footer = siteFooter(page)

    for (const column of ['Product', 'Resources', 'Company']) {
      await expect(footer.getByRole('navigation', { name: column })).toBeVisible()
    }

    const community = footer.getByRole('link', { name: 'Community' })
    await expect(community).toHaveAttribute('target', '_blank')
    await expect(community).toHaveAttribute('rel', /noopener/)
  })
})

test.describe('SiteShell on a phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(PHONE)
    await page.goto('/')
  })

  test('hides the desktop bar and offers a menu trigger instead', async ({ page }) => {
    await expect(header(page).getByRole('button', { name: 'Product' })).toBeHidden()
    await expect(header(page).getByRole('button', { name: 'Open navigation' })).toBeVisible()
  })

  test('folds the same config into a sheet, including the Action', async ({ page }) => {
    await header(page).getByRole('button', { name: 'Open navigation' }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('link', { name: 'Landing page' })).toBeVisible()
    await expect(sheet.getByRole('link', { name: 'Admin' })).toBeVisible()
    await expect(sheet.getByRole('link', { name: 'Start free trial' })).toBeVisible()

    await sheet.getByRole('button', { name: 'Toggle theme' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('closes the sheet after following a link', async ({ page }) => {
    await header(page).getByRole('button', { name: 'Open navigation' }).click()

    const sheet = page.getByRole('dialog')
    await sheet.getByRole('link', { name: 'Landing page' }).click()

    await expect(sheet).toBeHidden()
  })

  test('does not overflow the viewport horizontally', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )

    expect(overflow).toBeLessThanOrEqual(0)
  })
})

test.describe('SiteShell chrome beyond the home page', () => {
  test('keeps the header and footer on a page that does not exist', async ({ page }) => {
    const response = await page.goto('/no-such-page')

    expect(response?.status()).toBe(404)
    await expect(header(page)).toBeVisible()
    await expect(siteFooter(page)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible()
    await expect(page.locator('main')).toHaveCount(1)
  })

  test('offers a way back from a page that does not exist', async ({ page }) => {
    await page.goto('/no-such-page')
    await page.getByRole('link', { name: 'Back to the home page' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Build your site at the speed of thought',
    )
  })

  test('carries the Action choice across a route group boundary', async ({ page }) => {
    await page.goto('/')
    await header(page).getByRole('button', { name: 'Toggle theme' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.goto('/dashboard')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('points the header call to action at its configured destination', async ({ page }) => {
    await page.goto('/')

    await expect(header(page).getByRole('link', { name: 'Start free trial' })).toHaveAttribute(
      'href',
      '/signup',
    )
  })
})

test.describe('Active page signalling', () => {
  test('marks the current page in the header and footer, and nothing else', async ({ page }) => {
    await page.goto('/')

    const current = page.locator('[aria-current="page"]')
    await expect(current.first()).toBeAttached()

    const hrefs = await current.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href')),
    )
    expect(new Set(hrefs)).toEqual(new Set(['/']))
  })

  test('marks nothing on a shell page no navigation item points at', async ({ page }) => {
    await page.goto('/no-such-page')

    await expect(header(page)).toBeVisible()
    await expect(page.locator('[aria-current="page"]')).toHaveCount(0)
  })
})
