import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

const HEADING = 'Authored in Payload, not in code'

let payload: Payload

test.describe('Home page rendered from Payload', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'pages', where: { slug: { equals: 'home' } } })
    await payload.create({
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
  })

  test.afterAll(async () => {
    await payload.delete({ collection: 'pages', where: { slug: { equals: 'home' } } })
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
