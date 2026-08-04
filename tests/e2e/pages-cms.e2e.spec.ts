import { test, expect, request as playwrightRequest } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

const HEADING = 'Authored in Payload, not in code'

let payload: Payload
let createdId: number | string | undefined

const EDITOR = { email: 'pages-cms@test.local', password: 'test1234' }

async function editorContext(baseURL: string | undefined) {
  const context = await playwrightRequest.newContext({ baseURL })
  const login = await context.post('/api/users/login', { data: EDITOR })
  const { token } = await login.json()

  return { context, token }
}

test.describe('Home page rendered from Payload', () => {
  test.beforeAll(async ({ baseURL }) => {
    payload = await getPayload({ config: await config })

    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      throw new Error(
        'A page with slug "home" already exists in the test database. Refusing to overwrite it; clear it first.',
      )
    }

    await payload.delete({ collection: 'users', where: { email: { equals: EDITOR.email } } })
    await payload.create({ collection: 'users', data: EDITOR as never })

    const { context, token } = await editorContext(baseURL)
    try {
      const response = await context.post('/api/pages', {
        headers: { Authorization: `JWT ${token}` },
        data: {
          title: 'Home',
          slug: 'home',
          _status: 'published',
          sections: [
            {
              blockType: 'heroCentered',
              heading: HEADING,
              subheading: 'Stored as a Preset invocation and dispatched through the mapper.',
              primaryCta: { label: 'Stored primary', href: '/stored-primary' },
              secondaryCta: { label: null, href: null },
              trustBadges: [{ text: 'Stored badge' }],
            },
          ],
        },
      })

      expect(response.ok()).toBe(true)
      createdId = (await response.json()).doc.id
    } finally {
      await context.dispose()
    }
  })

  test.afterAll(async ({}, testInfo) => {
    if (createdId === undefined) return

    const { context, token } = await editorContext(testInfo.project.use.baseURL)

    try {
      await context.delete(`/api/pages/${createdId}`, {
        headers: { Authorization: `JWT ${token}` },
      })

      await expect
        .poll(async () => (await context.get('/')).text(), { timeout: 20_000 })
        .toContain('Build your site at the speed of thought')
    } finally {
      await context.dispose()
      await payload.delete({ collection: 'users', where: { email: { equals: EDITOR.email } } })
    }
  })

  test('renders the stored heading rather than the code Fixture', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HEADING)
    await expect(page.getByText('Build your site at the speed of thought')).toHaveCount(0)
  })

  test('renders the stored call to action and badge', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Stored primary' })).toHaveAttribute(
      'href',
      '/stored-primary',
    )
    await expect(page.getByText('Stored badge')).toBeVisible()
  })

  test('omits the call to action left blank in the admin panel', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Book a demo' })).toHaveCount(0)
  })
})
