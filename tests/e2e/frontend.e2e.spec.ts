import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the hero Section from a Preset call', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toHaveText('Build your site at the speed of thought')

    await expect(
      page.getByText('Compose pages from typed presets', { exact: false }),
    ).toBeVisible()
  })

  test('renders both calls to action as unique links across the whole page', async ({ page }) => {
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

  test('renders every Section inside main with exactly one h1 on the page', async ({ page }) => {
    await expect(page.locator('main section').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })

  test('stamps a block index on every block wrapper so stagger cannot break', async ({ page }) => {
    const blocks = page.locator('main section').first().locator('[data-block]')
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

test.describe('Grid Presets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the benefits grid with automatic numbering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'What you get' })).toBeVisible()

    for (const [index, title] of ['Typed page config', 'One vocabulary'].entries()) {
      await expect(page.getByText(title)).toBeVisible()
      await expect(page.getByText(String(index + 1).padStart(2, '0'), { exact: true })).toBeVisible()
    }
  })

  test('renders the feature grid with a resolved icon per card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Everything the template already handles' })).toBeVisible()

    const grids = page.locator('.ds-card-grid')
    await expect(grids).toHaveCount(2)
    await expect(grids.nth(1).locator('svg')).toHaveCount(6)
  })
})

test.describe('Card-based Presets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders all five card-based Sections', async ({ page }) => {
    for (const heading of [
      'Grow with the team behind it',
      'Common questions',
      'Ready to start?',
      'Join the community',
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
    await expect(page.getByText('Northwind')).toBeVisible()
  })

  test('FAQ accordion is keyboard navigable and announces expanded state', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Can editors build pages without a developer?' })

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText('Every preset a developer can call', { exact: false })).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('every accordion trigger is reachable by keyboard alone', async ({ page }) => {
    const triggers = page.getByRole('button', { name: /\?$/ })
    const count = await triggers.count()
    expect(count).toBe(4)

    await triggers.first().focus()
    await expect(triggers.first()).toBeFocused()

    for (let index = 1; index < count; index += 1) {
      await page.keyboard.press('Tab')
      await expect(triggers.nth(index)).toBeFocused()
    }

    await page.keyboard.press('Space')
    await expect(triggers.nth(count - 1)).toHaveAttribute('aria-expanded', 'true')
  })

  test('expanding one question does not reveal another answer', async ({ page }) => {
    const first = page.getByRole('button', { name: 'Can editors build pages without a developer?' })
    const second = page.getByRole('button', { name: 'What happens when a preset changes?' })

    await first.click()
    await expect(first).toHaveAttribute('aria-expanded', 'true')
    await expect(second).toHaveAttribute('aria-expanded', 'false')
  })
})
