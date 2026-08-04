export const SITE_NAME = 'Tempify'

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SERVER_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL

  if (!configured) return 'http://localhost:3000'
  return configured.startsWith('http') ? configured : `https://${configured}`
}

export function pathForSlug(slug: string): string {
  return slug === 'home' ? '/' : `/${slug}`
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString()
}
