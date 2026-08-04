import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import type { NextRequest } from 'next/server'

import config from '@/payload.config'

export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get('path')

  if (!path || !path.startsWith('/') || path.startsWith('//')) {
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
