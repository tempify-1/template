import type { Metadata } from 'next'

import { SITE_NAME, absoluteUrl, pathForSlug } from '@/lib/site'
import type { Media, Page } from '@/payload-types'

function imageUrl(image: number | Media | null | undefined): string | undefined {
  if (!image || typeof image === 'number') return undefined
  return image.url ? absoluteUrl(image.url) : undefined
}

export function metadataForPage(page: Page): Metadata {
  const title = page.meta?.title?.trim() || `${page.title} | ${SITE_NAME}`
  const description = page.meta?.description?.trim() || undefined
  const url = absoluteUrl(pathForSlug(page.slug))
  const image = imageUrl(page.meta?.image)
  const images = image ? [{ url: image, alt: page.meta?.title?.trim() || page.title }] : undefined

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}
