import { presetFixtures } from '@/fixtures/presets'
import { themed } from '@/lib/presets/theme'
import type { SectionDefinition } from '@/lib/presets/types'

export const homeSections: SectionDefinition[] = [
  { ...presetFixtures.heroCentered, minHeight: '100svh' },
  themed('muted', presetFixtures.logoWall),
  presetFixtures.benefitsGrid,
  themed('muted', presetFixtures.featureGrid),
  presetFixtures.serviceList,
  themed('accent', presetFixtures.testimonialCarousel),
  presetFixtures.teamGrid,
  presetFixtures.pricing,
  themed('muted', presetFixtures.faqAccordion),
  themed('brand', presetFixtures.ctaBanner),
  presetFixtures.community,
  themed('muted', presetFixtures.newsletter),
  presetFixtures.contactForm,
]
