import { z } from 'zod'

import type { Block, SectionDefinition } from './types'

export const faqAccordionArgs = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional().meta({ payload: { type: 'textarea' } }),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1).meta({ payload: { type: 'textarea' } }),
      }),
    )
    .min(1)
    .meta({ payload: { singular: 'Question', plural: 'Questions' } }),
})

export type FaqAccordionArgs = z.input<typeof faqAccordionArgs>

export function faqAccordion(input: FaqAccordionArgs): SectionDefinition {
  const args = faqAccordionArgs.parse(input)

  const blocks: Block[] = [{ blockType: 'heading', level: 2, text: args.heading, size: 5 }]

  if (args.subheading) {
    blocks.push({ blockType: 'paragraph', text: args.subheading, lead: true })
  }

  blocks.push({
    blockType: 'accordion',
    items: args.questions.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
    })),
  })

  return {
    tag: 'section',
    gutter: 'md',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
