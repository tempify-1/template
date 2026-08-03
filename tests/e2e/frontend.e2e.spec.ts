import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('renders the hero Section from a Preset call', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toHaveText('Build your site at the speed of thought')

    await expect(
      page.getByText('Compose pages from typed presets', { exact: false }),
    ).toBeVisible()
  })

  test('renders both calls to action as links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Start free trial' })).toHaveAttribute(
      'href',
      '/signup',
    )
    await expect(page.getByRole('link', { name: 'Book a demo' })).toHaveAttribute('href', '/demo')
  })

  test('renders the trust badges', async ({ page }) => {
    for (const badge of ['No credit card required', '14-day free trial', 'Cancel anytime']) {
      await expect(page.getByText(badge)).toBeVisible()
    }
  })

  test('renders the hero inside a section landmark with a single h1', async ({ page }) => {
    await expect(page.locator('main section')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })

  test('stamps a block index on every block wrapper so stagger cannot break', async ({ page }) => {
    const blocks = page.locator('main section [data-block]')
    await expect(blocks.first()).toBeVisible()

    const indexes = await blocks.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLElement).style.getPropertyValue('--block-index')),
    )
    expect(indexes.length).toBeGreaterThan(1)
    expect(indexes).toEqual(indexes.map((_, i) => String(i)))
  })

  test('is legible on a phone viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )
    expect(overflows).toBe(false)
  })
})
