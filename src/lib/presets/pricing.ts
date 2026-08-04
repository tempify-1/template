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
    .meta({ payload: { singular: 'Feature', plural: 'Features', minRows: 1 } }),
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
  currency: z
    .string()
    .default('USD')
    .meta({ payload: { description: 'ISO currency code, e.g. USD, GBP, EUR.' } }),
  locale: z
    .string()
    .default('en-US')
    .meta({ payload: { description: 'Formats the figures, e.g. en-US, en-GB, de-DE.' } }),
  defaultPeriod: z.enum(BILLING_PERIODS).default('monthly'),
  annualNote: z
    .string()
    .optional()
    .meta({ payload: { description: 'Shown beside the toggle, e.g. "Save 20%".' } }),
  tiers: z.array(tier).meta({ payload: { singular: 'Tier', plural: 'Tiers', minRows: 1 } }),
})

export type PricingArgs = z.input<typeof pricingArgs>

export function pricing(input: PricingArgs): SectionDefinition {
  const args = pricingArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 4)
  let highlighted = false

  if (args.tiers.length > 0) {
    blocks.push({
      blockType: 'pricingTable',
      currency: args.currency,
      locale: args.locale,
      defaultPeriod: args.defaultPeriod,
      annualNote: args.annualNote,
      tiers: args.tiers.map((entry) => {
        const featured = (entry.featured ?? false) && !highlighted
        if (featured) highlighted = true

        return {
          name: entry.name,
          description: entry.description,
          monthlyPrice: entry.monthlyPrice,
          annualPrice: entry.annualPrice,
          features: entry.features,
          cta: { label: entry.ctaLabel, href: entry.ctaHref },
          featured,
        }
      }),
    })
  }

  return {
    tag: 'section',
    gutter: 'lg',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
