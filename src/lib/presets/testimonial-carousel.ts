import { z } from 'zod'

import { imageArgs } from './media'
import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

export const testimonialCarouselArgs = z.object({
  ...sectionHeaderArgs,
  testimonials: z
    .array(
      z.object({
        quote: z
          .string()
          .min(1)
          .meta({ payload: { type: 'textarea' } }),
        name: z.string().min(1),
        title: z.string().optional(),
        image: imageArgs.optional().meta({ payload: { label: 'Portrait' } }),
      }),
    )
    .meta({ payload: { singular: 'Testimonial', plural: 'Testimonials', minRows: 1 } }),
})

export type TestimonialCarouselArgs = z.input<typeof testimonialCarouselArgs>

export function testimonialCarousel(input: TestimonialCarouselArgs): SectionDefinition {
  const args = testimonialCarouselArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 5)

  if (args.testimonials.length > 0) {
    blocks.push({
      blockType: 'testimonialCarousel',
      testimonials: args.testimonials.map((testimonial) => ({
        quote: testimonial.quote,
        name: testimonial.name,
        title: testimonial.title,
        image: testimonial.image,
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
