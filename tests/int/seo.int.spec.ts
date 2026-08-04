import { getPayload, type Payload } from 'payload'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { metadataForPage } from '@/lib/metadata'
import { publishedPages } from '@/lib/pages'
import { absoluteUrl, pathForSlug, siteUrl } from '@/lib/site'
import type { Page } from '@/payload-types'
import config from '@/payload.config'

function pageWith(overrides: Partial<Page>): Page {
  return {
    id: 1,
    title: 'About us',
    slug: 'about',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Page
}

describe('site helpers', () => {
  it('maps the home slug to the site root and everything else to its own path', () => {
    expect(pathForSlug('home')).toBe('/')
    expect(pathForSlug('about')).toBe('/about')
  })

  it('resolves a path against the configured origin', () => {
    expect(absoluteUrl('/about')).toBe(`${siteUrl().replace(/\/$/, '')}/about`)
  })
})

describe('metadataForPage', () => {
  it('prefers the metadata title an editor wrote', () => {
    const meta = metadataForPage(pageWith({ meta: { title: 'Editor title' } }))

    expect(meta.title).toEqual({ absolute: 'Editor title' })
  })

  it('falls back to the page title with the site name when none is written', () => {
    const meta = metadataForPage(pageWith({ meta: {} }))

    expect(meta.title).toEqual({ absolute: 'About us | Tempify' })
  })

  it('marks the title absolute, so the layout template cannot append the site name twice', () => {
    const meta = metadataForPage(pageWith({ meta: { title: 'About us | Tempify' } }))

    expect(meta.title).toEqual({ absolute: 'About us | Tempify' })
    expect(JSON.stringify(meta.title)).not.toContain('Tempify | Tempify')
  })

  it('treats a whitespace-only description as absent rather than emitting a blank tag', () => {
    const meta = metadataForPage(pageWith({ meta: { description: '   ' } }))

    expect(meta.description).toBeUndefined()
    expect(meta.openGraph?.description).toBeUndefined()
  })

  it('points the canonical and social URL at the page own path', () => {
    const meta = metadataForPage(pageWith({ slug: 'about' }))

    expect(meta.alternates?.canonical).toBe(absoluteUrl('/about'))
    expect(meta.openGraph).toMatchObject({ url: absoluteUrl('/about') })
  })

  it('points the home page at the site root rather than /home', () => {
    const meta = metadataForPage(pageWith({ slug: 'home' }))

    expect(meta.alternates?.canonical).toBe(absoluteUrl('/'))
  })

  it('emits an absolute social image and the large card when an image is set', () => {
    const meta = metadataForPage(
      pageWith({
        meta: {
          title: 'About',
          image: {
            id: 3,
            url: '/api/media/file/og.png',
            alt: 'Sharing image',
            width: 1200,
            height: 630,
          } as never,
        },
      }),
    )

    expect(meta.openGraph?.images).toEqual([
      {
        url: absoluteUrl('/api/media/file/og.png'),
        alt: 'Sharing image',
        width: 1200,
        height: 630,
      },
    ])
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' })
  })

  it('omits an image the media helper cannot fully resolve, rather than a partial tag', () => {
    const meta = metadataForPage(
      pageWith({ meta: { image: { id: 3, url: '/api/media/file/og.png' } as never } }),
    )

    expect(meta.openGraph?.images).toBeUndefined()
  })

  it('omits the image rather than emitting an unresolved relationship id', () => {
    const meta = metadataForPage(pageWith({ meta: { image: 7 } }))

    expect(meta.openGraph?.images).toBeUndefined()
    expect(meta.twitter).toMatchObject({ card: 'summary' })
  })
})

describe('publishedPages', () => {
  let payload: Payload
  const created: (number | string)[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    for (const [slug, status] of [
      ['seo-published', 'published'],
      ['seo-draft', 'draft'],
    ] as const) {
      const doc = await payload.create({
        collection: 'pages',
        data: { title: slug, slug, _status: status } as never,
      })
      created.push(doc.id)
    }
  })

  afterAll(async () => {
    for (const id of created) await payload.delete({ collection: 'pages', id })
  })

  it('lists a published page', async () => {
    const slugs = (await publishedPages()).map((page) => page.slug)

    expect(slugs).toContain('seo-published')
  })

  it('leaves a draft out, so an unpublished page is never advertised', async () => {
    const slugs = (await publishedPages()).map((page) => page.slug)

    expect(slugs).not.toContain('seo-draft')
  })

  it('returns a last-modified date the sitemap can use', async () => {
    const page = (await publishedPages()).find((entry) => entry.slug === 'seo-published')

    expect(page?.updatedAt).toBeTruthy()
    expect(Number.isNaN(Date.parse(page!.updatedAt!))).toBe(false)
  })
})
