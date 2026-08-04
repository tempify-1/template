import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { getPayload, type Payload } from 'payload'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { pageTag } from '@/lib/cache-tags'
import { publishedPages } from '@/lib/pages'
import { previewPath } from '@/lib/preview'
import config from '@/payload.config'

describe('preview paths', () => {
  it('sends the home page to the site root', () => {
    expect(previewPath('home')).toBe(`/next/preview?path=${encodeURIComponent('/')}`)
  })

  it('sends any other page to its own path', () => {
    expect(previewPath('about')).toBe(`/next/preview?path=${encodeURIComponent('/about')}`)
  })

  it('falls back to the root for a document with no slug yet', () => {
    for (const slug of [undefined, null, '', 7]) {
      expect(previewPath(slug)).toBe(`/next/preview?path=${encodeURIComponent('/')}`)
    }
  })

  it('carries no secret, since the route requires a logged-in user', () => {
    expect(previewPath('about')).not.toMatch(/secret/i)
  })
})

describe('revalidation tags', () => {
  it('keys a tag per document rather than one tag for everything', () => {
    expect(pageTag('about')).toBe('page:about')
    expect(pageTag('home')).not.toBe(pageTag('about'))
  })
})

describe('the preview route', () => {
  const source = readFileSync(
    join(process.cwd(), 'src/app/(payload)/next/preview/route.ts'),
    'utf8',
  )

  it('refuses a path that is not relative, so preview cannot be pointed off-site', () => {
    expect(source).toContain("startsWith('/')")
    expect(source).toContain("startsWith('//')")
  })

  it('requires an authenticated user before enabling draft mode', () => {
    expect(source.indexOf('payload.auth')).toBeLessThan(source.indexOf('draft.enable'))
    expect(source).toContain('if (!user)')
  })
})

describe('the render tree stays server-rendered', () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

  it('mounts the refresh listener from a Server Component that checks draft mode', () => {
    const gate = read('src/components/ds/shell/draft-refresh.tsx')

    expect(gate).not.toContain("'use client'")
    expect(gate).toContain('draftMode()')
    expect(gate).toContain('if (!isEnabled) return null')
  })

  it('keeps only the refresh listener itself on the client', () => {
    expect(read('src/components/ds/shell/refresh-on-save.tsx').startsWith("'use client'")).toBe(
      true,
    )
  })

  it('renders sections through the same Server Component tree in draft and published mode', () => {
    for (const route of ['src/app/(frontend)/page.tsx', 'src/app/(frontend)/[slug]/page.tsx']) {
      const source = read(route)

      expect(source, route).not.toContain("'use client'")
      expect(source, route).toContain('<Page sections=')
    }
  })
})

describe('drafts stay private until published', () => {
  let payload: Payload
  let draftId: number | string

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const created = await payload.create({
      collection: 'pages',
      data: {
        title: 'Unpublished',
        slug: 'preview-draft',
        _status: 'draft',
        sections: [{ blockType: 'ctaBanner', heading: 'Draft heading' }],
      } as never,
    })

    draftId = created.id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'pages', id: draftId })
  })

  it('keeps a draft out of the published list the sitemap reads', async () => {
    const slugs = (await publishedPages()).map((page) => page.slug)

    expect(slugs).not.toContain('preview-draft')
  })

  it('refuses a draft to an anonymous reader', async () => {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'preview-draft' } },
      draft: false,
      overrideAccess: false,
    })

    expect(docs).toHaveLength(0)
  })

  it('autosaves so preview refreshes without a manual save', async () => {
    const pages = payload.config.collections.find((entry) => entry.slug === 'pages')
    const drafts =
      pages?.versions && typeof pages.versions === 'object' ? pages.versions.drafts : undefined
    const autosave = drafts && typeof drafts === 'object' ? drafts.autosave : undefined

    expect(autosave).toBeTruthy()
    expect(typeof autosave === 'object' ? autosave.interval : undefined).toBeLessThanOrEqual(2000)
  })
})
