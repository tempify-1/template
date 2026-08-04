import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import { FIXTURE_NAMES } from '@/fixtures/presets'
import config from '@/payload.config'

const EDITOR = { email: 'fixtures@test.local', password: 'test1234' }

let payload: Payload

test.describe('Fixture preview routes', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'users', where: { email: { equals: EDITOR.email } } })
    await payload.create({ collection: 'users', data: EDITOR as never })
  })

  test.afterAll(async () => {
    await payload.delete({ collection: 'users', where: { email: { equals: EDITOR.email } } })
  })

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

  test('refuses a posted configuration to an anonymous visitor', async ({ request }) => {
    const encoded = Buffer.from(
      JSON.stringify({ columns: [{ blocks: [{ blockType: 'paragraph', text: 'hi' }] }] }),
    ).toString('base64url')

    expect((await request.get(`/preview/config?c=${encoded}`)).status()).toBe(404)
  })

  test('renders a posted configuration without a deploy', async ({ page, context }) => {
    const login = await page.request.post('/api/users/login', { data: EDITOR })
    expect(login.ok()).toBe(true)
    await context.addCookies(
      (await login.headersArray())
        .filter((header) => header.name.toLowerCase() === 'set-cookie')
        .map((header) => {
          const [pair] = header.value.split(';')
          const [name, value] = pair!.split('=')
          return { name: name!, value: value!, domain: 'localhost', path: '/' }
        }),
    )

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

  test('refuses a posted configuration naming an unknown block, even when signed in', async ({
    page,
  }) => {
    await page.request.post('/api/users/login', { data: EDITOR })

    const encoded = Buffer.from(
      JSON.stringify({ columns: [{ blocks: [{ blockType: 'script', src: 'x' }] }] }),
    ).toString('base64url')

    expect((await page.request.get(`/preview/config?c=${encoded}`)).status()).toBe(404)
  })
})

test.describe('Fixture visual regression', () => {
  test.skip(
    process.env.VISUAL !== '1',
    'Baselines are platform specific. Run with VISUAL=1, regenerating with --update-snapshots on a new platform.',
  )

  for (const name of FIXTURE_NAMES) {
    test(`${name} renders as committed`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(`/preview/${name}`)
      await page.waitForLoadState('networkidle')

      const section = page.locator('main section').first()
      await expect(section).toBeVisible()
      await expect(section).toHaveScreenshot(`${name}.png`, {
        animations: 'disabled',
        mask: [page.locator('header').first()],
        maxDiffPixelRatio: 0.001,
      })
    })
  }
})
