import { draftMode, headers } from 'next/headers'

import { siteUrl } from '@/lib/site'

import { ExitPreview } from './exit-preview'
import { RefreshOnSave } from './refresh-on-save'

async function requestOrigin(): Promise<string> {
  const incoming = await headers()
  const host = incoming.get('x-forwarded-host') ?? incoming.get('host')
  if (!host) return siteUrl()

  const protocol =
    incoming.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

export async function DraftRefresh() {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return null

  return (
    <>
      <RefreshOnSave serverURL={await requestOrigin()} />
      <ExitPreview />
    </>
  )
}
