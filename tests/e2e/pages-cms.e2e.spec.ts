import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

const HEADING = 'Authored in Payload, not in code'

let payload: Payload
let createdId: number | string | undefined

test.describe('Home page rendered from Payload', () => {
  test.beforeAll(async () => {
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

    const created = await payload.create({
      collection: 'pages',
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

    createdId = created.id
  })

  test.afterAll(async () => {
    if (createdId === undefined) return
    await payload.delete({ collection: 'pages', id: createdId })
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
