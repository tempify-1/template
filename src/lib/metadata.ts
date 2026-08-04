import type { Metadata } from 'next'

import { SITE_NAME, absoluteUrl, pathForSlug } from '@/lib/site'
import { toImage, type ImageArgs } from '@/lib/presets/media'
import type { Media, Page } from '@/payload-types'

function socialImage(image: number | Media | null | undefined): ImageArgs | undefined {
  return toImage(image as Parameters<typeof toImage>[0])
}

export function metadataForPage(page: Page): Metadata {
  const title = page.meta?.title?.trim() || `${page.title} | ${SITE_NAME}`
  const description = page.meta?.description?.trim() || undefined
  const url = absoluteUrl(pathForSlug(page.slug))
  const resolved = socialImage(page.meta?.image)
  const image = resolved ? absoluteUrl(resolved.src) : undefined
  const images = resolved
    ? [
        {
          url: absoluteUrl(resolved.src),
          alt: resolved.alt,
          width: resolved.width,
          height: resolved.height,
        },
      ]
    : undefined

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
