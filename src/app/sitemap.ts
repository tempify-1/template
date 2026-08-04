import type { MetadataRoute } from 'next'

import { publishedPages } from '@/lib/pages'
import { absoluteUrl, pathForSlug } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await publishedPages()
  const byPath = new Map<string, MetadataRoute.Sitemap[number]>()

  byPath.set('/', {
    url: absoluteUrl('/'),
    changeFrequency: 'weekly',
    priority: 1,
  })

  for (const page of pages) {
    const path = pathForSlug(page.slug)

    byPath.set(path, {
      url: absoluteUrl(path),
      lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
      changeFrequency: path === '/' ? 'weekly' : 'monthly',
      priority: path === '/' ? 1 : 0.7,
    })
  }

  return [...byPath.values()]
}
