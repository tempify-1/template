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

export function mapSection(block: SectionBlock): SectionDefinition | null {
  const map = presetMappers[block.blockType] as ((block: SectionBlock) => SectionDefinition) | undefined
  if (!map) return null
  return map(block)
}

export function mapPage(page: Pick<Page, 'sections'>): SectionDefinition[] {
  return (page.sections ?? [])
    .map(mapSection)
    .filter((section): section is SectionDefinition => section !== null)
}
