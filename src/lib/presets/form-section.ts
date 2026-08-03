import { z } from 'zod'

import type { FormName } from '@/lib/forms/definitions'

import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const formSectionArgs = z.object(sectionHeaderArgs)

export type FormSectionArgs = z.input<typeof formSectionArgs>

export function formSection(formName: FormName) {
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
