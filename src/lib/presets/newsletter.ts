import { z } from 'zod'

import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const newsletterArgs = z.object(sectionHeaderArgs)

export type NewsletterArgs = z.input<typeof newsletterArgs>

export function newsletter(input: NewsletterArgs): SectionDefinition {
  const args = newsletterArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 4)
  blocks.push({ blockType: 'form', formName: 'newsletter' })

  return {
    tag: 'section',
    gutter: 'lg',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
