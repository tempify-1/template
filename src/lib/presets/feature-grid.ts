import { z } from 'zod'

import { ICON_NAMES } from '../icons'
import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const featureGridArgs = z.object({
  ...sectionHeaderArgs,
  features: z
    .array(
      z.object({
        icon: z.enum(ICON_NAMES),
        title: z.string().min(1),
        description: z
          .string()
          .optional()
          .meta({ payload: { type: 'textarea' } }),
      }),
    )
    .min(1)
    .meta({ payload: { singular: 'Feature', plural: 'Features' } }),
})

export type FeatureGridArgs = z.input<typeof featureGridArgs>

export function featureGrid(input: FeatureGridArgs): SectionDefinition {
  const args = featureGridArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 5)

  blocks.push({
    blockType: 'cardGrid',
    columns: { base: 1, sm: 2, lg: 3 },
    cards: args.features.map((feature) => ({
      icon: feature.icon,
      title: feature.title,
      description: feature.description,
    })),
  })

  return {
    tag: 'section',
    gutter: 'md',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
