import { z } from 'zod'

import type { Block, SectionDefinition } from './types'

export const benefitsGridArgs = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional().meta({ payload: { type: 'textarea' } }),
  benefits: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().meta({ payload: { type: 'textarea' } }),
      }),
    )
    .min(1)
    .meta({ payload: { description: 'Numbered automatically in the order listed here.' } }),
})

export type BenefitsGridArgs = z.input<typeof benefitsGridArgs>

export function benefitsGrid(input: BenefitsGridArgs): SectionDefinition {
  const args = benefitsGridArgs.parse(input)

  const blocks: Block[] = [{ blockType: 'heading', level: 2, text: args.heading, size: 5 }]

  if (args.subheading) {
    blocks.push({ blockType: 'paragraph', text: args.subheading, lead: true })
  }

  blocks.push({
    blockType: 'cardGrid',
    columns: { base: 1, sm: 2, lg: 4 },
    cards: args.benefits.map((benefit, index) => ({
      index: String(index + 1).padStart(2, '0'),
      title: benefit.title,
      description: benefit.description,
    })),
  })

  return {
    tag: 'section',
    gutter: 'md',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
