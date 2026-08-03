import { z } from 'zod'

import { ICON_NAMES } from '../icons'
import type { Block, SectionDefinition } from './types'

export const featureGridArgs = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional(),
  features: z
    .array(
      z.object({
        icon: z.enum(ICON_NAMES),
        title: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .min(1),
})

export type FeatureGridArgs = z.input<typeof featureGridArgs>

export function featureGrid(input: FeatureGridArgs): SectionDefinition {
  const args = featureGridArgs.parse(input)

  const blocks: Block[] = [{ blockType: 'heading', level: 2, text: args.heading, size: 5 }]

  if (args.subheading) {
    blocks.push({ blockType: 'paragraph', text: args.subheading, lead: true })
  }

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
