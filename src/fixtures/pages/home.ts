import { benefitsGrid } from '@/lib/presets/benefits-grid'
import { featureGrid } from '@/lib/presets/feature-grid'
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
  }),

  benefitsGrid({
    heading: 'What you get',
    subheading: 'The parts that usually take a quarter, ready on day one.',
    benefits: [
      { title: 'Typed page config', description: 'Pages are data, so a change is a reviewable diff rather than a rewrite.' },
      { title: 'One vocabulary', description: 'Editors compose from the same presets developers call. Nothing drifts.' },
      { title: 'Server-first rendering', description: 'Marketing pages ship almost no JavaScript by construction.' },
      { title: 'Dashboard included', description: 'Sidebar, charts and tables arrive configured rather than built.' },
    ],
  }),

  featureGrid({
    heading: 'Everything the template already handles',
    subheading: 'Built on shadcn primitives, wired to Payload, covered by tests.',
    features: [
      { icon: 'layers', title: 'Section system', description: 'Page, Section, Column and Block renderers as Server Components.' },
      { icon: 'workflow', title: 'Preset registry', description: 'Adding a pattern is a schema, a factory and a registry line.' },
      { icon: 'shield', title: 'Access control', description: 'Function-per-operation, with published-only reads for anonymous visitors.' },
      { icon: 'gauge', title: 'Cache revalidation', description: 'Publishing, renaming and deleting all purge the right routes.' },
      { icon: 'check', title: 'Config-driven forms', description: 'A field list becomes a validated form with conditional logic.' },
      { icon: 'sparkles', title: 'Live preview', description: 'Drafts render for editors before anything is published.' },
    ],
  }),
]
