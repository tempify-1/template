import { z } from 'zod'

import type { Block, SectionDefinition } from './types'

export const serviceListArgs = z.object({
  heading: z.string().min(1),
  subheading: z.string().optional().meta({ payload: { type: 'textarea' } }),
  services: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional().meta({ payload: { type: 'textarea' } }),
        badge: z.string().optional(),
      }),
    )
    .min(1)
    .meta({ payload: { singular: 'Service', plural: 'Services' } }),
})

export type ServiceListArgs = z.input<typeof serviceListArgs>

export function serviceList(input: ServiceListArgs): SectionDefinition {
  const args = serviceListArgs.parse(input)

  const blocks: Block[] = [{ blockType: 'heading', level: 2, text: args.heading, size: 5 }]

  if (args.subheading) {
    blocks.push({ blockType: 'paragraph', text: args.subheading, lead: true })
  }

  blocks.push({
    blockType: 'itemList',
    items: args.services.map((service) => ({
      title: service.title,
      description: service.description,
      badge: service.badge,
    })),
  })

  return {
    tag: 'section',
    gutter: 'md',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
