import { z } from 'zod'

import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const serviceListArgs = z.object({
  ...sectionHeaderArgs,
  services: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z
          .string()
          .optional()
          .meta({ payload: { type: 'textarea' } }),
        badge: z.string().optional(),
      }),
    )
    .meta({ payload: { singular: 'Service', plural: 'Services', minRows: 1 } }),
})

export type ServiceListArgs = z.input<typeof serviceListArgs>

export function serviceList(input: ServiceListArgs): SectionDefinition {
  const args = serviceListArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 5)

  if (args.services.length > 0) {
    blocks.push({
      blockType: 'itemList',
      items: args.services.map((service) => ({
        title: service.title,
        description: service.description,
        badge: service.badge,
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
