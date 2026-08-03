import { benefitsGrid } from '@/lib/presets/benefits-grid'
import { community } from '@/lib/presets/community'
import { contactForm } from '@/lib/presets/contact-form'
import { ctaBanner } from '@/lib/presets/cta-banner'
import { faqAccordion } from '@/lib/presets/faq-accordion'
import { featureGrid } from '@/lib/presets/feature-grid'
import { heroCentered } from '@/lib/presets/hero-centered'
import { toImage, type MediaProblem } from '@/lib/presets/media'
import { logoWall } from '@/lib/presets/logo-wall'
import { newsletter } from '@/lib/presets/newsletter'
import { serviceList } from '@/lib/presets/service-list'
import { teamGrid } from '@/lib/presets/team-grid'
import { testimonialCarousel } from '@/lib/presets/testimonial-carousel'
import type { SectionDefinition } from '@/lib/presets/types'
import type { Page } from '@/payload-types'

type SectionBlock = NonNullable<Page['sections']>[number]

interface StoredCallToAction {
  label?: string | null
  href?: string | null
}

function filled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function keepRows<T>(
  rows: T[],
  isComplete: (row: T) => boolean,
  onProblem: MediaProblem,
  label: string,
): T[] {
  const kept = rows.filter(isComplete)
  const dropped = rows.length - kept.length
  if (dropped > 0) onProblem(`${dropped} ${label} row(s) dropped for missing required fields`)
  return kept
}

function toCallToAction(cta: StoredCallToAction | null | undefined) {
  if (!cta?.label || !cta.href) return undefined
  return { label: cta.label, href: cta.href }
}

const presetMappers = {
  heroCentered: (
    block: Extract<SectionBlock, { blockType: 'heroCentered' }>,
    onProblem: MediaProblem,
  ) =>
    heroCentered({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      primaryCta: toCallToAction(block.primaryCta),
      secondaryCta: toCallToAction(block.secondaryCta),
      trustBadges: (block.trustBadges ?? []).map((badge) => badge.text).filter(Boolean),
      image: toImage(block.image, onProblem),
    }),

  benefitsGrid: (block: Extract<SectionBlock, { blockType: 'benefitsGrid' }>) =>
    benefitsGrid({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      benefits: (block.benefits ?? []).map((benefit) => ({
        title: benefit.title,
        description: benefit.description ?? undefined,
      })),
    }),

  featureGrid: (block: Extract<SectionBlock, { blockType: 'featureGrid' }>) =>
    featureGrid({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      features: (block.features ?? []).map((feature) => ({
        icon: feature.icon,
        title: feature.title,
        description: feature.description ?? undefined,
      })),
    }),
  logoWall: (block: Extract<SectionBlock, { blockType: 'logoWall' }>, onProblem: MediaProblem) =>
    logoWall({
      heading: block.heading ?? undefined,
      logos: keepRows(block.logos ?? [], (logo) => filled(logo.name), onProblem, 'logo').map(
        (logo) => ({ name: logo.name, image: toImage(logo.image, onProblem) }),
      ),
    }),

  serviceList: (block: Extract<SectionBlock, { blockType: 'serviceList' }>) =>
    serviceList({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      services: (block.services ?? []).map((service) => ({
        title: service.title,
        description: service.description ?? undefined,
        badge: service.badge ?? undefined,
      })),
    }),

  testimonialCarousel: (
    block: Extract<SectionBlock, { blockType: 'testimonialCarousel' }>,
    onProblem: MediaProblem,
  ) =>
    testimonialCarousel({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      testimonials: keepRows(
        block.testimonials ?? [],
        (entry) => filled(entry.quote) && filled(entry.name),
        onProblem,
        'testimonial',
      ).map((entry) => ({
        quote: entry.quote,
        name: entry.name,
        title: entry.title ?? undefined,
        image: toImage(entry.image, onProblem),
      })),
    }),

  teamGrid: (block: Extract<SectionBlock, { blockType: 'teamGrid' }>, onProblem: MediaProblem) =>
    teamGrid({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      members: keepRows(
        block.members ?? [],
        (member) => filled(member.name) && filled(member.role),
        onProblem,
        'member',
      ).map((member) => ({
        name: member.name,
        role: member.role,
        image: toImage(member.image, onProblem),
        links: (member.links ?? [])
          .filter((link) => filled(link.label) && filled(link.href))
          .map((link) => ({ label: link.label, href: link.href })),
      })),
    }),

  ctaBanner: (block: Extract<SectionBlock, { blockType: 'ctaBanner' }>) =>
    ctaBanner({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      primaryCta: toCallToAction(block.primaryCta),
      secondaryCta: toCallToAction(block.secondaryCta),
    }),

  community: (block: Extract<SectionBlock, { blockType: 'community' }>) =>
    community({
      heading: block.heading,
      body: block.body ?? undefined,
      cta: toCallToAction(block.cta),
    }),

  faqAccordion: (block: Extract<SectionBlock, { blockType: 'faqAccordion' }>) =>
    faqAccordion({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
      questions: (block.questions ?? []).map((entry) => ({
        question: entry.question,
        answer: entry.answer,
      })),
    }),
  contactForm: (block: Extract<SectionBlock, { blockType: 'contactForm' }>) =>
    contactForm({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
    }),

  newsletter: (block: Extract<SectionBlock, { blockType: 'newsletter' }>) =>
    newsletter({
      heading: block.heading,
      subheading: block.subheading ?? undefined,
    }),
} satisfies Record<
  SectionBlock['blockType'],
  (block: never, onProblem: MediaProblem) => SectionDefinition
>

export interface MapPageResult {
  sections: SectionDefinition[]
  skipped: { blockType: string; reason: string }[]
  warnings: { blockType: string; reason: string }[]
}

export function mapPageResult(page: Pick<Page, 'sections'>): MapPageResult {
  const sections: SectionDefinition[] = []
  const skipped: { blockType: string; reason: string }[] = []
  const warnings: { blockType: string; reason: string }[] = []

  for (const block of page.sections ?? []) {
    const map = presetMappers[block.blockType] as
      ((block: SectionBlock, onProblem: MediaProblem) => SectionDefinition) | undefined

    if (!map) {
      skipped.push({ blockType: block.blockType, reason: 'no Preset is registered for this block' })
      continue
    }

    try {
      sections.push(map(block, (reason) => warnings.push({ blockType: block.blockType, reason })))
    } catch (error) {
      skipped.push({
        blockType: block.blockType,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { sections, skipped, warnings }
}

export function mapPage(page: Pick<Page, 'sections'>): SectionDefinition[] {
  return mapPageResult(page).sections
}
