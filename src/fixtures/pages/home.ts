import { benefitsGrid } from '@/lib/presets/benefits-grid'
import { community } from '@/lib/presets/community'
import { contactForm } from '@/lib/presets/contact-form'
import { ctaBanner } from '@/lib/presets/cta-banner'
import { faqAccordion } from '@/lib/presets/faq-accordion'
import { featureGrid } from '@/lib/presets/feature-grid'
import { heroCentered } from '@/lib/presets/hero-centered'
import { logoWall } from '@/lib/presets/logo-wall'
import { newsletter } from '@/lib/presets/newsletter'
import { pricing } from '@/lib/presets/pricing'
import { serviceList } from '@/lib/presets/service-list'
import { teamGrid } from '@/lib/presets/team-grid'
import { themed } from '@/lib/presets/theme'
import { testimonialCarousel } from '@/lib/presets/testimonial-carousel'
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

  themed(
    'muted',
    logoWall({
      heading: 'Trusted by teams shipping every day',
      logos: ['Northwind', 'Acme', 'Globex', 'Initech', 'Umbra', 'Vertex'].map((name) => ({
        name,
      })),
    }),
  ),

  benefitsGrid({
    heading: 'What you get',
    subheading: 'The parts that usually take a quarter, ready on day one.',
    benefits: [
      {
        title: 'Typed page config',
        description: 'Pages are data, so a change is a reviewable diff rather than a rewrite.',
      },
      {
        title: 'One vocabulary',
        description: 'Editors compose from the same presets developers call. Nothing drifts.',
      },
      {
        title: 'Server-first rendering',
        description: 'Marketing pages ship almost no JavaScript by construction.',
      },
      {
        title: 'Dashboard included',
        description: 'Sidebar, charts and tables arrive configured rather than built.',
      },
    ],
  }),

  themed(
    'muted',
    featureGrid({
      heading: 'Everything the template already handles',
      subheading: 'Built on shadcn primitives, wired to Payload, covered by tests.',
      features: [
        {
          icon: 'layers',
          title: 'Section system',
          description: 'Page, Section, Column and Block renderers as Server Components.',
        },
        {
          icon: 'workflow',
          title: 'Preset registry',
          description: 'Adding a pattern is a schema, a factory and a registry line.',
        },
        {
          icon: 'shield',
          title: 'Access control',
          description: 'Function-per-operation, with published-only reads for anonymous visitors.',
        },
        {
          icon: 'gauge',
          title: 'Cache revalidation',
          description: 'Publishing, renaming and deleting all purge the right routes.',
        },
        {
          icon: 'check',
          title: 'Config-driven forms',
          description: 'A field list becomes a validated form with conditional logic.',
        },
        {
          icon: 'sparkles',
          title: 'Live preview',
          description: 'Drafts render for editors before anything is published.',
        },
      ],
    }),
  ),

  serviceList({
    heading: 'Grow with the team behind it',
    subheading: 'Optional services for when you want the work done with you rather than by you.',
    services: [
      {
        title: 'Architecture review',
        description: 'A read of your schema and render boundaries before you commit.',
        badge: 'Pro',
      },
      {
        title: 'Design system audit',
        description: 'Token, component and accessibility pass against your brand.',
        badge: 'Pro',
      },
      {
        title: 'Migration support',
        description: 'Move an existing site onto the preset model without a rewrite.',
      },
      {
        title: 'Ongoing maintenance',
        description: 'Dependency and upstream shadcn updates handled for you.',
      },
    ],
  }),

  themed(
    'accent',
    testimonialCarousel({
      heading: 'Loved by the teams using it',
      subheading: 'What people say after their first project on the template.',
      testimonials: [
        {
          quote:
            'We had a marketing site in front of stakeholders on day two, and the editors never once asked us to change a layout for them.',
          name: 'Priya Raman',
          title: 'Head of Engineering, Northwind',
        },
        {
          quote:
            'The generated admin panel is the part that sold it. Nobody maintains a second schema, so nothing drifts.',
          name: 'Tom Beckett',
          title: 'Technical Director, Globex',
        },
        {
          quote:
            'Our designers stopped filing tickets to fix off-brand pages, because the presets simply do not allow them.',
          name: 'Sofia Almeida',
          title: 'Design Lead, Initech',
        },
      ],
    }),
  ),

  teamGrid({
    heading: 'The people behind it',
    subheading: 'A small team that ships and answers its own support.',
    members: [
      {
        name: 'Priya Raman',
        role: 'Engineering',
        links: [{ label: 'Profile', href: '/team/priya' }],
      },
      { name: 'Tom Beckett', role: 'Design', links: [{ label: 'Profile', href: '/team/tom' }] },
      {
        name: 'Sofia Almeida',
        role: 'Product',
        links: [{ label: 'Profile', href: '/team/sofia' }],
      },
      { name: 'Ade Okonkwo', role: 'Support', links: [{ label: 'Profile', href: '/team/ade' }] },
    ],
  }),

  pricing({
    heading: 'Pricing that scales with the work, not the seat count',
    subheading: 'Every tier ships the whole template. The difference is support and scale.',
    currency: '$',
    defaultPeriod: 'monthly',
    annualNote: 'Two months free on annual billing.',
    tiers: [
      {
        name: 'Starter',
        description: 'One site, built by one team.',
        monthlyPrice: 29,
        annualPrice: 290,
        features: ['Every Preset and Block', 'Config-driven forms', 'Community support'],
        ctaLabel: 'Start free trial',
        ctaHref: '/signup',
      },
      {
        name: 'Team',
        description: 'Several sites and the people to run them.',
        monthlyPrice: 89,
        annualPrice: 890,
        features: [
          'Everything in Starter',
          'Unlimited editors',
          'Live Preview and drafts',
          'Priority support',
        ],
        ctaLabel: 'Start free trial',
        ctaHref: '/signup',
        featured: true,
      },
      {
        name: 'Scale',
        description: 'For agencies shipping client work.',
        monthlyPrice: 249,
        annualPrice: 2490,
        features: [
          'Everything in Team',
          'Architecture review',
          'Design system audit',
          'Migration support',
        ],
        ctaLabel: 'Talk to us',
        ctaHref: '/contact',
      },
    ],
  }),

  themed(
    'muted',
    faqAccordion({
      heading: 'Common questions',
      subheading: 'The things teams ask before they start.',
      questions: [
        {
          question: 'Can editors build pages without a developer?',
          answer:
            'Yes. Every preset a developer can call is a block an editor can pick, with the same arguments and no extra schema to maintain.',
        },
        {
          question: 'What happens when a preset changes?',
          answer:
            'The Payload block is generated from the preset argument schema, so the admin panel follows automatically and cannot drift from the code.',
        },
        {
          question: 'Does the marketing site ship a lot of JavaScript?',
          answer:
            'Almost none. The page tree renders as Server Components; only genuinely interactive pieces such as this accordion are client components.',
        },
        {
          question: 'Is the dashboard included?',
          answer:
            'Yes, assembled from shadcn blocks rather than hand-built, with the sidebar, charts and data table already configured.',
        },
      ],
    }),
  ),

  themed(
    'brand',
    ctaBanner({
      heading: 'Ready to start?',
      subheading: 'Clone the template and have a page on screen in an afternoon.',
      primaryCta: { label: 'Create your account', href: '/signup' },
      secondaryCta: { label: 'Read the docs', href: '/docs' },
    }),
  ),

  community({
    heading: 'Join the community',
    body: 'Share what you build and get help from people running the same stack.',
    cta: { label: 'Open Discord', href: 'https://discord.gg' },
  }),

  themed(
    'muted',
    newsletter({
      heading: 'Get the release notes',
      subheading: 'One short email whenever a preset, block or upstream dependency changes.',
    }),
  ),

  contactForm({
    heading: 'Talk to us',
    subheading: 'Tell us what you are building and we will point you at the right starting place.',
  }),
]
