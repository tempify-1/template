import { z } from 'zod'

import type { Block } from './types'

export const sectionHeaderArgs = {
  heading: z.string().min(1),
  subheading: z
    .string()
    .optional()
    .meta({ payload: { type: 'textarea' } }),
}

export interface SectionHeaderInput {
  heading: string
  subheading?: string
}

export function sectionHeaderBlocks(
  args: SectionHeaderInput,
  size: number,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 2,
): Block[] {
  const blocks: Block[] = [{ blockType: 'heading', level, text: args.heading, size }]

  if (args.subheading) {
    blocks.push({ blockType: 'paragraph', text: args.subheading, lead: true })
  }

  return blocks
}
