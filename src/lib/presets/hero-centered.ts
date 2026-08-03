import { z } from 'zod'

import { imageArgs } from './media'
import type { Block, SectionDefinition } from './types'

const callToAction = z
  .object({
    label: z.string().min(1),
    href: z.string().min(1),
  })
  .optional()

export const heroCenteredArgs = z.object({
  heading: z.string().min(1),
  subheading: z
    .string()
    .optional()
    .meta({ payload: { type: 'textarea' } }),
  primaryCta: callToAction.meta({
    payload: {
      label: 'Primary call to action',
      description: 'Leave both fields empty to omit this call to action.',
    },
  }),
  secondaryCta: callToAction.meta({
    payload: {
      label: 'Secondary call to action',
      description: 'Leave both fields empty to omit this call to action.',
    },
  }),
  trustBadges: z
    .array(z.string().min(1))
    .default([])
    .meta({ payload: { singular: 'Badge', plural: 'Badges' } }),
  image: imageArgs.optional().meta({ payload: { label: 'Hero image' } }),
  minHeight: z
    .string()
    .optional()
    .meta({ payload: { hidden: true } }),
})

export type HeroCenteredArgs = z.input<typeof heroCenteredArgs>

export function heroCentered(input: HeroCenteredArgs): SectionDefinition {
  const args = heroCenteredArgs.parse(input)

  const blocks: Block[] = [{ blockType: 'heading', level: 1, text: args.heading, size: 7 }]

  if (args.subheading) {
    blocks.push({ blockType: 'paragraph', text: args.subheading, lead: true })
  }

  const buttons = [
    args.primaryCta && { ...args.primaryCta, variant: 'default' as const },
    args.secondaryCta && { ...args.secondaryCta, variant: 'outline' as const },
  ].filter((button) => button !== undefined)

  if (buttons.length > 0) {
    blocks.push({ blockType: 'buttonRow', buttons })
  }

  if (args.trustBadges.length > 0) {
    blocks.push({ blockType: 'badgeRow', badges: args.trustBadges })
  }

  if (args.image) {
    blocks.push({ blockType: 'image', ...args.image })
  }

  return {
    tag: 'section',
    gutter: 'lg',
    minHeight: args.minHeight,
    columnLayout: 1,
    columns: [{ justify: 'center', verticalAlignment: 'middle', blocks }],
  }
}
