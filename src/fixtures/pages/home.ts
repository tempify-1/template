import { heroCentered } from '@/lib/presets/hero-centered'
import type { SectionDefinition } from '@/lib/presets/types'

export const homeSections: SectionDefinition[] = [
  heroCentered({
    heading: 'Build your site at the speed of thought',
    subheading:
      'Compose pages from typed presets instead of bespoke markup. Every section your editors can reach is a section your designers intended.',
    primaryCta: { label: 'Start free trial', href: '/signup' },
    secondaryCta: { label: 'Book a demo', href: '/demo' },
    trustBadges: ['No credit card required', '14-day free trial', 'Cancel anytime'],
    minHeight: '100svh',
  }),
]
