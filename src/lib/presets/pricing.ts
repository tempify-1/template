import { z } from 'zod'

import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const BILLING_PERIODS = ['monthly', 'annual'] as const

export type BillingPeriod = (typeof BILLING_PERIODS)[number]

const tier = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  monthlyPrice: z.number().nonnegative(),
  annualPrice: z.number().nonnegative(),
  features: z
    .array(z.string().min(1))
    .min(1)
    .meta({ payload: { singular: 'Feature', plural: 'Features' } }),
  ctaLabel: z.string().min(1),
  ctaHref: z.string().min(1),
  featured: z
    .boolean()
    .optional()
    .meta({
      payload: {
        label: 'Highlight this tier',
        description: 'Only one tier should be highlighted.',
      },
    }),
})

export const pricingArgs = z.object({
  ...sectionHeaderArgs,
  currency: z.string().min(1).default('$'),
  defaultPeriod: z.enum(BILLING_PERIODS).default('monthly'),
  annualNote: z
    .string()
    .optional()
    .meta({ payload: { description: 'Shown beside the toggle, e.g. "Save 20%".' } }),
  tiers: z
    .array(tier)
    .min(1)
    .meta({ payload: { singular: 'Tier', plural: 'Tiers' } }),
})

export type PricingArgs = z.input<typeof pricingArgs>

export function pricing(input: PricingArgs): SectionDefinition {
  const args = pricingArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 4)

  blocks.push({
    blockType: 'pricingTable',
    currency: args.currency,
    defaultPeriod: args.defaultPeriod,
    annualNote: args.annualNote,
    tiers: args.tiers.map((entry) => ({
      name: entry.name,
      description: entry.description,
      monthlyPrice: entry.monthlyPrice,
      annualPrice: entry.annualPrice,
      features: entry.features,
      cta: { label: entry.ctaLabel, href: entry.ctaHref },
      featured: entry.featured ?? false,
    })),
  })

  return {
    tag: 'section',
    gutter: 'lg',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
