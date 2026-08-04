export const SITE_NAME = 'Tempify'

const FALLBACK_ORIGIN = 'http://localhost:3000'

let warned = false

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SERVER_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL

  if (!configured) {
    if (process.env.NODE_ENV === 'production' && !warned) {
      warned = true
      console.warn(
        `NEXT_PUBLIC_SERVER_URL is not set. Canonical URLs, social images and the sitemap will all point at ${FALLBACK_ORIGIN}, which search engines cannot reach.`,
      )
    }
    return FALLBACK_ORIGIN
  }

  return configured.startsWith('http') ? configured : `https://${configured}`
}

export const HOME_SLUG = 'home'

export function isHomeSlug(slug: string): boolean {
  return slug === HOME_SLUG
}

export function pathForSlug(slug: string): string {
  return isHomeSlug(slug) ? '/' : `/${slug}`
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString()
}
