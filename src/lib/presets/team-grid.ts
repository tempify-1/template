import { z } from 'zod'

import { imageArgs } from './media'
import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const teamGridArgs = z.object({
  ...sectionHeaderArgs,
  members: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        image: imageArgs.optional().meta({ payload: { label: 'Photo' } }),
        links: z
          .array(
            z.object({
              label: z.string().min(1),
              href: z.string().min(1),
            }),
          )
          .default([])
          .meta({ payload: { singular: 'Link', plural: 'Links' } }),
      }),
    )
    .meta({ payload: { singular: 'Member', plural: 'Members', minRows: 1 } }),
})

export type TeamGridArgs = z.input<typeof teamGridArgs>

export function teamGrid(input: TeamGridArgs): SectionDefinition {
  const args = teamGridArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 5)

  if (args.members.length > 0) {
    blocks.push({
      blockType: 'personGrid',
      columns: { base: 1, sm: 2, lg: 4 },
      people: args.members.map((member) => ({
        name: member.name,
        role: member.role,
        image: member.image,
        links: member.links,
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
