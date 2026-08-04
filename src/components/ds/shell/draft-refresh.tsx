import { draftMode } from 'next/headers'

import { siteUrl } from '@/lib/site'

import { RefreshOnSave } from './refresh-on-save'

export async function DraftRefresh() {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return null

  return <RefreshOnSave serverURL={siteUrl()} />
}
