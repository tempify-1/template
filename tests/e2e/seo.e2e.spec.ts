import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

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
    expect(body).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/)
  })

  test('lets crawlers fetch the media the social image points at', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()

    expect(body).toMatch(/Allow: \/api\/media\//)
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

  test('adds a page published after the first sitemap request', async ({ request }) => {
    const before = await (await request.get('/sitemap.xml')).text()
    expect(before).not.toContain('/published-later')

    const later = await payload.create({
      collection: 'pages',
      data: { title: 'Published later', slug: 'published-later', _status: 'published' } as never,
    })

    try {
      const after = await (await request.get('/sitemap.xml')).text()
      expect(after).toContain('/published-later')
    } finally {
      await payload.delete({ collection: 'pages', id: later.id })
    }
  })

  test('renders the configured social image as an absolute URL a crawler can fetch', async ({
    page,
    request,
  }) => {
    const png = await sharp({
      create: { width: 1200, height: 630, channels: 3, background: { r: 10, g: 10, b: 10 } },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Sharing image' },
      file: { data: png, mimetype: 'image/png', name: 'og-share.png', size: png.byteLength },
    })

    const shared = await payload.create({
      collection: 'pages',
      data: {
        title: 'Shared page',
        slug: 'shared-page',
        _status: 'published',
        meta: { title: 'Shared page', description: 'Has an image.', image: media.id },
      } as never,
    })

    try {
      await page.goto('/shared-page')

      const src = await page.locator('meta[property="og:image"]').first().getAttribute('content')
      expect(src).toMatch(/^https?:\/\//)
      expect(src).toContain('/api/media/')

      const fetched = await request.get(src!)
      expect(fetched.status()).toBe(200)

      expect(await page.locator('meta[name="twitter:card"]').getAttribute('content')).toBe(
        'summary_large_image',
      )
    } finally {
      await payload.delete({ collection: 'pages', id: shared.id })
      await payload.delete({ collection: 'media', id: media.id })
    }
  })

  test('refuses a slug the router could never serve', async () => {
    await expect(
      payload.create({
        collection: 'pages',
        data: { title: 'Nested', slug: 'about/team', _status: 'published' } as never,
      }),
    ).rejects.toThrow()
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
