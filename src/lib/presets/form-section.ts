import { z } from 'zod'

import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const formSectionArgs = z.object(sectionHeaderArgs)

export type FormSectionArgs = z.input<typeof formSectionArgs>

export function formSection(formName: string) {
  return (input: FormSectionArgs): SectionDefinition => {
    const args = formSectionArgs.parse(input)

    const blocks: Block[] = sectionHeaderBlocks(args, 4)
    blocks.push({ blockType: 'form', formName })

    return {
      tag: 'section',
      gutter: 'lg',
      columnLayout: 1,
      columns: [{ justify: 'center', blocks }],
    }
  }
}
