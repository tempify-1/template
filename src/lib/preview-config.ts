import { z } from 'zod'

import type { SectionDefinition } from '@/lib/presets/types'

export const MAX_ENCODED_LENGTH = 20_000

const text = z.string().max(2_000)
const href = z
  .string()
  .max(2_000)
  .refine(
    (value) => /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/.test(value),
    'unsupported link target',
  )

const link = z.object({ label: text, href })
const image = z.object({
  src: href,
  alt: text,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

const block = z.discriminatedUnion('blockType', [
  z.object({
    blockType: z.literal('heading'),
    level: z.number().int().min(1).max(6),
    text,
    size: z.number().optional(),
  }),
  z.object({ blockType: z.literal('paragraph'), text, lead: z.boolean().optional() }),
  z.object({
    blockType: z.literal('buttonRow'),
    buttons: z.array(link.extend({ variant: z.string().optional() })),
  }),
  z.object({ blockType: z.literal('badgeRow'), badges: z.array(text) }),
  z.object({
    blockType: z.literal('cardGrid'),
    columns: z.unknown().optional(),
    cards: z.array(
      z.object({
        title: text,
        description: text.optional(),
        icon: text.optional(),
        index: text.optional(),
      }),
    ),
  }),
  z.object({
    blockType: z.literal('logoRow'),
    logos: z.array(z.object({ name: text, image: image.optional() })),
  }),
  z.object({
    blockType: z.literal('itemList'),
    items: z.array(z.object({ title: text, description: text.optional(), badge: text.optional() })),
  }),
  z.object({
    blockType: z.literal('accordion'),
    items: z.array(z.object({ question: text, answer: text })),
  }),
  z.object({ blockType: z.literal('image'), ...image.shape, priority: z.boolean().optional() }),
  z.object({
    blockType: z.literal('testimonialCarousel'),
    testimonials: z.array(
      z.object({ quote: text, name: text, title: text.optional(), image: image.optional() }),
    ),
  }),
  z.object({
    blockType: z.literal('personGrid'),
    columns: z.unknown().optional(),
    people: z.array(
      z.object({
        name: text,
        role: text,
        image: image.optional(),
        links: z.array(link).optional(),
      }),
    ),
  }),
  z.object({ blockType: z.literal('form'), formName: z.enum(['contact', 'newsletter']) }),
  z.object({
    blockType: z.literal('pricingTable'),
    currency: text,
    locale: text,
    defaultPeriod: z.enum(['monthly', 'annual']),
    annualNote: text.optional(),
    tiers: z.array(
      z.object({
        name: text,
        description: text.optional(),
        monthlyPrice: z.number().nonnegative(),
        annualPrice: z.number().nonnegative(),
        features: z.array(text),
        cta: link,
        featured: z.boolean(),
      }),
    ),
  }),
])

const section = z.object({
  tag: z.enum(['header', 'section', 'footer']).optional(),
  theme: z.enum(['muted', 'accent', 'brand']).optional(),
  gutter: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).optional(),
  columnLayout: z.unknown().optional(),
  minHeight: z.string().max(40).optional(),
  columns: z
    .array(
      z.object({
        colSpan: z.unknown().optional(),
        justify: z.enum(['left', 'center', 'right']).optional(),
        verticalAlignment: z.enum(['top', 'middle', 'bottom']).optional(),
        blocks: z.array(block).max(50).optional(),
      }),
    )
    .max(10)
    .optional(),
})

export const previewSections = z.array(section).min(1).max(20)

export function decodeSections(encoded: string): SectionDefinition[] | null {
  if (encoded.length > MAX_ENCODED_LENGTH) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  const result = previewSections.safeParse(Array.isArray(parsed) ? parsed : [parsed])
  return result.success ? (result.data as SectionDefinition[]) : null
}
