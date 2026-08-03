import type { Block } from 'payload'

import { benefitsGrid, benefitsGridArgs } from './benefits-grid'
import { community, communityArgs } from './community'
import { contactForm, contactFormArgs } from './contact-form'
import { ctaBanner, ctaBannerArgs } from './cta-banner'
import { faqAccordion, faqAccordionArgs } from './faq-accordion'
import { featureGrid, featureGridArgs } from './feature-grid'
import { heroCentered, heroCenteredArgs } from './hero-centered'
import { logoWall, logoWallArgs } from './logo-wall'
import { newsletter, newsletterArgs } from './newsletter'
import { blockFromSchema } from './payload-fields'
import { serviceList, serviceListArgs } from './service-list'
import { teamGrid, teamGridArgs } from './team-grid'
import { testimonialCarousel, testimonialCarouselArgs } from './testimonial-carousel'

export const presetRegistry = {
  heroCentered: {
    schema: heroCenteredArgs,
    factory: heroCentered,
    singular: 'Hero (centered)',
    plural: 'Heroes (centered)',
  },
  logoWall: {
    schema: logoWallArgs,
    factory: logoWall,
    singular: 'Logo wall',
    plural: 'Logo walls',
  },
  benefitsGrid: {
    schema: benefitsGridArgs,
    factory: benefitsGrid,
    singular: 'Benefits grid',
    plural: 'Benefits grids',
  },
  featureGrid: {
    schema: featureGridArgs,
    factory: featureGrid,
    singular: 'Feature grid',
    plural: 'Feature grids',
  },
  serviceList: {
    schema: serviceListArgs,
    factory: serviceList,
    singular: 'Service list',
    plural: 'Service lists',
  },
  testimonialCarousel: {
    schema: testimonialCarouselArgs,
    factory: testimonialCarousel,
    singular: 'Testimonial carousel',
    plural: 'Testimonial carousels',
  },
  teamGrid: {
    schema: teamGridArgs,
    factory: teamGrid,
    singular: 'Team grid',
    plural: 'Team grids',
  },
  ctaBanner: {
    schema: ctaBannerArgs,
    factory: ctaBanner,
    singular: 'CTA banner',
    plural: 'CTA banners',
  },
  community: {
    schema: communityArgs,
    factory: community,
    singular: 'Community',
    plural: 'Community sections',
  },
  contactForm: {
    schema: contactFormArgs,
    factory: contactForm,
    singular: 'Contact form',
    plural: 'Contact forms',
  },
  newsletter: {
    schema: newsletterArgs,
    factory: newsletter,
    singular: 'Newsletter signup',
    plural: 'Newsletter signups',
  },
  faqAccordion: {
    schema: faqAccordionArgs,
    factory: faqAccordion,
    singular: 'FAQ accordion',
    plural: 'FAQ accordions',
  },
} as const

export type PresetName = keyof typeof presetRegistry

export function presetBlocks(): Block[] {
  return Object.entries(presetRegistry).map(([slug, entry]) =>
    blockFromSchema({
      slug,
      schema: entry.schema,
      singular: entry.singular,
      plural: entry.plural,
    }),
  )
}
