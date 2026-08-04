import { blockRegistry } from '@/components/ds/section/block-renderer'
import type { SectionDefinition } from '@/lib/presets/types'

export const MAX_ENCODED_LENGTH = 20_000

export function decodeSections(encoded: string): SectionDefinition[] | null {
  if (encoded.length > MAX_ENCODED_LENGTH) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  const sections = Array.isArray(parsed) ? parsed : [parsed]
  return sections.every(isSection) ? (sections as SectionDefinition[]) : null
}

function isSection(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false

  const columns = (value as { columns?: unknown }).columns
  if (columns === undefined) return true
  if (!Array.isArray(columns)) return false

  return columns.every((column) => {
    if (typeof column !== 'object' || column === null) return false

    const blocks = (column as { blocks?: unknown }).blocks
    if (blocks === undefined) return true
    if (!Array.isArray(blocks)) return false

    return blocks.every(
      (block) =>
        typeof block === 'object' &&
        block !== null &&
        typeof (block as { blockType?: unknown }).blockType === 'string' &&
        Object.hasOwn(blockRegistry, (block as { blockType: string }).blockType),
    )
  })
}
