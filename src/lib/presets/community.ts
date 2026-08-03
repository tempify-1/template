import { z } from 'zod'

import type { Block, SectionDefinition } from './types'

export const communityArgs = z.object({
  heading: z.string().min(1),
  body: z.string().optional().meta({ payload: { type: 'textarea' } }),
  cta: z
    .object({
      label: z.string().min(1),
      href: z.string().min(1),
    })
    .optional()
    .meta({
      payload: {
        label: 'Call to action',
        description: 'Leave both fields empty to omit the button.',
      },
    }),
})

export type CommunityArgs = z.input<typeof communityArgs>

export function community(input: CommunityArgs): SectionDefinition {
  const args = communityArgs.parse(input)

  const blocks: Block[] = [{ blockType: 'heading', level: 2, text: args.heading, size: 4 }]

  if (args.body) {
    blocks.push({ blockType: 'paragraph', text: args.body })
  }

  if (args.cta) {
    blocks.push({
      blockType: 'buttonRow',
      buttons: [{ ...args.cta, variant: 'outline' as const }],
    })
  }

  return {
    tag: 'section',
    gutter: 'md',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
