import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import type { NextRequest } from 'next/server'

import config from '@/payload.config'

function safeRelativePath(raw: string | null): string | null {
  if (!raw) return null

  const candidate = raw.replace(/\\/g, '/')
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return null

  const resolved = new URL(candidate, 'http://preview.invalid')
  if (resolved.origin !== 'http://preview.invalid') return null

  return `${resolved.pathname}${resolved.search}`
}

export async function GET(request: NextRequest): Promise<Response> {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return new Response('Preview cannot be started from another site.', { status: 403 })
  }

  const path = safeRelativePath(request.nextUrl.searchParams.get('path'))

  if (!path) {
    return new Response('A relative path is required to preview.', { status: 400 })
  }

  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return new Response('You must be logged in to preview drafts.', { status: 401 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
