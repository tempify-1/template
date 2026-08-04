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
import type { PresetName } from '@/lib/presets/registry'
import { serviceList } from '@/lib/presets/service-list'
import { teamGrid } from '@/lib/presets/team-grid'
import { testimonialCarousel } from '@/lib/presets/testimonial-carousel'
import type { SectionDefinition } from '@/lib/presets/types'

export const presetFixtures: Record<PresetName, SectionDefinition> = {
  heroCentered: heroCentered({
    heading: 'Build your site at the speed of thought',
    subheading:
      'Compose pages from typed presets instead of bespoke markup. Every section your editors can reach is a section your designers intended.',
    primaryCta: { label: 'Start free trial', href: '/signup' },
    secondaryCta: { label: 'Book a demo', href: '/demo' },
    trustBadges: ['No credit card required', '14-day free trial', 'Cancel anytime'],
  }),

  logoWall: logoWall({
    heading: 'Trusted by teams shipping every day',
    logos: ['Northwind', 'Acme', 'Globex', 'Initech', 'Umbra', 'Vertex'].map((name) => ({ name })),
  }),

  benefitsGrid: benefitsGrid({
    heading: 'What you get',
    subheading: 'The parts that usually take a quarter, ready on day one.',
    benefits: [
      { title: 'Typed page config', description: 'A change is a reviewable diff, not a rewrite.' },
      { title: 'One vocabulary', description: 'Editors compose from the presets developers call.' },
      {
        title: 'Server-first rendering',
        description: 'Marketing pages ship almost no JavaScript.',
      },
      { title: 'Dashboard included', description: 'Sidebar, charts and tables arrive configured.' },
    ],
  }),

  featureGrid: featureGrid({
    heading: 'Everything the template already handles',
    subheading: 'Built on shadcn primitives, wired to Payload, covered by tests.',
    features: [
      { icon: 'layers', title: 'Section system', description: 'Renderers as Server Components.' },
      { icon: 'workflow', title: 'Preset registry', description: 'A schema, a factory, one line.' },
      {
        icon: 'shield',
        title: 'Access control',
        description: 'Function per operation, never open.',
      },
      { icon: 'gauge', title: 'Revalidation', description: 'Publishing purges the right routes.' },
      { icon: 'check', title: 'Config-driven forms', description: 'A field list becomes a form.' },
      { icon: 'sparkles', title: 'Live preview', description: 'Drafts render before publishing.' },
    ],
  }),

  serviceList: serviceList({
    heading: 'Grow with the team behind it',
    subheading: 'Optional services for when you want the work done with you.',
    services: [
      {
        title: 'Architecture review',
        description: 'A read of your schema boundaries.',
        badge: 'Pro',
      },
      { title: 'Design system audit', description: 'Token and accessibility pass.', badge: 'Pro' },
      {
        title: 'Migration support',
        description: 'Move an existing site across without a rewrite.',
      },
      { title: 'Ongoing maintenance', description: 'Dependency and upstream updates handled.' },
    ],
  }),

  testimonialCarousel: testimonialCarousel({
    heading: 'Loved by the teams using it',
    subheading: 'What people say after their first project on the template.',
    testimonials: [
      {
        quote: 'We had a marketing site in front of stakeholders on day two.',
        name: 'Priya Raman',
        title: 'Head of Engineering, Northwind',
      },
      {
        quote: 'The generated admin panel is the part that sold it. Nothing drifts.',
        name: 'Tom Beckett',
        title: 'Technical Director, Globex',
      },
      {
        quote: 'Our editors stopped asking us to change layouts for them.',
        name: 'Ade Okonkwo',
        title: 'Product Lead, Vertex',
      },
    ],
  }),

  teamGrid: teamGrid({
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

  ctaBanner: ctaBanner({
    heading: 'Ready to start?',
    subheading: 'Clone the template and have a page on screen in an afternoon.',
    primaryCta: { label: 'Create your account', href: '/signup' },
    secondaryCta: { label: 'Read the docs', href: '/docs' },
  }),

  community: community({
    heading: 'Join the community',
    body: 'Share what you build and get help from people running the same stack.',
    cta: { label: 'Open Discord', href: 'https://discord.gg' },
  }),

  contactForm: contactForm({
    heading: 'Talk to us',
    subheading: 'Tell us what you are building and we will point you at a starting place.',
  }),

  newsletter: newsletter({
    heading: 'Get the release notes',
    subheading: 'One short email whenever a preset or dependency changes.',
  }),

  pricing: pricing({
    heading: 'Pricing that scales with the work, not the seat count',
    subheading: 'Every tier ships the whole template. The difference is support and scale.',
    currency: 'USD',
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
          'Live Preview',
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
        features: ['Everything in Team', 'Architecture review', 'Design system audit'],
        ctaLabel: 'Talk to us',
        ctaHref: '/contact',
      },
    ],
  }),

  faqAccordion: faqAccordion({
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
}

export const FIXTURE_NAMES = Object.keys(presetFixtures) as PresetName[]

export function isFixtureName(value: string): value is PresetName {
  return Object.hasOwn(presetFixtures, value)
}
