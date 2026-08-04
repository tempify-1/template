import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

let payload: Payload
let createdId: number | string | undefined

test.describe('SEO routes and metadata', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'about' } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      throw new Error('A page with slug "about" already exists in the test database.')
    }

    const created = await payload.create({
      collection: 'pages',
      data: {
        title: 'About us',
        slug: 'about',
        _status: 'published',
        meta: {
          title: 'About us | Tempify',
          description: 'Who builds the template and why.',
        },
        sections: [{ blockType: 'ctaBanner', heading: 'About us', subheading: 'A small team.' }],
      } as never,
    })

    createdId = created.id
  })

  test.afterAll(async () => {
    if (createdId === undefined) return
    await payload.delete({ collection: 'pages', id: createdId })
  })

  test('serves a robots route that points at the sitemap and keeps crawlers out of the admin', async ({
    request,
  }) => {
    const body = await (await request.get('/robots.txt')).text()

    expect(body).toContain('User-Agent: *')
    expect(body).toMatch(/Disallow: \/admin/)
    expect(body).toMatch(/Disallow: \/api/)
    expect(body).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/)
  })

  test('lists the home route and every published page in the sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    expect(xml).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/)
    expect(xml).toContain('/about</loc>')
    expect(xml).toContain('<lastmod>')
  })

  test('renders a published page at its own route', async ({ page }) => {
    const response = await page.goto('/about')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'About us' })).toBeVisible()
  })

  test('emits the editor metadata for search and social sharing', async ({ page }) => {
    await page.goto('/about')

    await expect(page).toHaveTitle('About us | Tempify')

    const meta = async (selector: string) => page.locator(selector).first().getAttribute('content')

    expect(await meta('meta[name="description"]')).toBe('Who builds the template and why.')
    expect(await meta('meta[property="og:title"]')).toBe('About us | Tempify')
    expect(await meta('meta[property="og:description"]')).toBe('Who builds the template and why.')
    expect(await meta('meta[property="og:url"]')).toMatch(/\/about$/)
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/\/about$/)
  })

  test('does not append the site name twice to a title that already carries it', async ({
    page,
  }) => {
    await page.goto('/about')

    const title = await page.title()
    expect(title).toBe('About us | Tempify')
    expect(title).not.toContain('Tempify | Tempify')
  })

  test('leaves an unpublished page out of the sitemap and off the site', async ({ request }) => {
    const draft = await payload.create({
      collection: 'pages',
      data: { title: 'Secret', slug: 'secret-draft', _status: 'draft' } as never,
    })

    try {
      const xml = await (await request.get('/sitemap.xml')).text()
      expect(xml).not.toContain('/secret-draft')

      const response = await request.get('/secret-draft')
      expect(response.status()).toBe(404)
    } finally {
      await payload.delete({ collection: 'pages', id: draft.id })
    }
  })
})
