import { z } from 'zod'

import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const contactFormArgs = z.object(sectionHeaderArgs)

export type ContactFormArgs = z.input<typeof contactFormArgs>

export function contactForm(input: ContactFormArgs): SectionDefinition {
  const args = contactFormArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 4)
  blocks.push({ blockType: 'form', formName: 'contact' })

  return {
    tag: 'section',
    gutter: 'lg',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
