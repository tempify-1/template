import { pathForSlug } from '@/lib/site'

export function previewPath(slug: unknown): string {
  const path = typeof slug === 'string' && slug.length > 0 ? pathForSlug(slug) : '/'

  return `/next/preview?path=${encodeURIComponent(path)}`
}
