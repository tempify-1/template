import { heroCentered } from '@/lib/presets/hero-centered'
import type { SectionDefinition } from '@/lib/presets/types'
import type { Page } from '@/payload-types'

type SectionBlock = NonNullable<Page['sections']>[number]

interface StoredCallToAction {
  label?: string | null
  href?: string | null
}

function toCallToAction(cta: StoredCallToAction | null | undefined) {
  if (!cta?.label || !cta.href) return undefined
  return { label: cta.label, href: cta.href }
}

const presetMappers = {
  heroCentered: (block: Extract<SectionBlock, { blockType: 'heroCentered' }>) =>
    heroCentered({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      primaryCta: toCallToAction(block.primaryCta),
      secondaryCta: toCallToAction(block.secondaryCta),
      trustBadges: (block.trustBadges ?? []).map((badge) => badge.text).filter(Boolean),
    }),
} satisfies Record<SectionBlock['blockType'], (block: never) => SectionDefinition>

export interface MapPageResult {
  sections: SectionDefinition[]
  skipped: { blockType: string; reason: string }[]
}

export function mapPageResult(page: Pick<Page, 'sections'>): MapPageResult {
  const sections: SectionDefinition[] = []
  const skipped: { blockType: string; reason: string }[] = []

  for (const block of page.sections ?? []) {
    const map = presetMappers[block.blockType] as
      | ((block: SectionBlock) => SectionDefinition)
      | undefined

    if (!map) {
      skipped.push({ blockType: block.blockType, reason: 'no Preset is registered for this block' })
      continue
    }

    try {
      sections.push(map(block))
    } catch (error) {
      skipped.push({
        blockType: block.blockType,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { sections, skipped }
}

export function mapPage(page: Pick<Page, 'sections'>): SectionDefinition[] {
  return mapPageResult(page).sections
}
