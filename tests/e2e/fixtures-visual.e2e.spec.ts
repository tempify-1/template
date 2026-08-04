import { test, expect } from '@playwright/test'

import { FIXTURE_NAMES } from '@/fixtures/presets'

test.describe('Fixture preview routes', () => {
  test('serves a route for every registered Preset', async ({ request }) => {
    for (const name of FIXTURE_NAMES) {
      const response = await request.get(`/preview/${name}`)
      expect(response.status(), name).toBe(200)
    }
  })

  test('refuses a Preset name that does not exist', async ({ request }) => {
    expect((await request.get('/preview/not-a-preset')).status()).toBe(404)
  })

  test('keeps preview routes out of search results', async ({ page }) => {
    await page.goto('/preview/ctaBanner')

    const robots = await page.locator('meta[name="robots"]').getAttribute('content')
    expect(robots).toMatch(/noindex/)
  })

  test('renders a posted configuration without a deploy', async ({ page }) => {
    const encoded = Buffer.from(
      JSON.stringify({
        tag: 'section',
        gutter: 'lg',
        columnLayout: 1,
        columns: [
          {
            justify: 'center',
            blocks: [{ blockType: 'heading', level: 1, text: 'Posted config' }],
          },
        ],
      }),
    ).toString('base64url')

    await page.goto(`/preview/config?c=${encoded}`)

    await expect(page.getByRole('heading', { name: 'Posted config' })).toBeVisible()
  })

  test('refuses a posted configuration naming an unknown block', async ({ request }) => {
    const encoded = Buffer.from(
      JSON.stringify({ columns: [{ blocks: [{ blockType: 'script', src: 'x' }] }] }),
    ).toString('base64url')

    expect((await request.get(`/preview/config?c=${encoded}`)).status()).toBe(404)
  })
})

test.describe('Fixture visual regression', () => {
  for (const name of FIXTURE_NAMES) {
    test(`${name} renders as committed`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(`/preview/${name}`)
      await page.waitForLoadState('networkidle')

      const section = page.locator('main section').first()
      await expect(section).toBeVisible()
      await expect(section).toHaveScreenshot(`${name}.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.01,
      })
    })
  }
})
