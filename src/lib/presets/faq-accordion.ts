import { z } from 'zod'

import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const faqAccordionArgs = z.object({
  ...sectionHeaderArgs,
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z
          .string()
          .min(1)
          .meta({ payload: { type: 'textarea' } }),
      }),
    )
    .meta({ payload: { singular: 'Question', plural: 'Questions', minRows: 1 } }),
})

export type FaqAccordionArgs = z.input<typeof faqAccordionArgs>

export function faqAccordion(input: FaqAccordionArgs): SectionDefinition {
  const args = faqAccordionArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 5)

  if (args.questions.length > 0) {
    blocks.push({
      blockType: 'accordion',
      items: args.questions.map((entry) => ({
        question: entry.question,
        answer: entry.answer,
      })),
    })
  }

  return {
    tag: 'section',
    gutter: 'md',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
