import { z } from 'zod'

import type { BlockType, SectionDefinition } from '@/lib/presets/types'

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

const blockShapes = {
  heading: { level: z.number().int().min(1).max(6), text, size: z.number().optional() },
  paragraph: { text, lead: z.boolean().optional() },
  buttonRow: { buttons: z.array(link.extend({ variant: z.string().optional() })) },
  badgeRow: { badges: z.array(text) },
  cardGrid: {
    columns: z.unknown().optional(),
    cards: z.array(
      z.object({
        title: text,
        description: text.optional(),
        icon: text.optional(),
        index: text.optional(),
      }),
    ),
  },
  logoRow: { logos: z.array(z.object({ name: text, image: image.optional() })) },
  itemList: {
    items: z.array(z.object({ title: text, description: text.optional(), badge: text.optional() })),
  },
  accordion: { items: z.array(z.object({ question: text, answer: text })) },
  image: { ...image.shape, priority: z.boolean().optional() },
  testimonialCarousel: {
    testimonials: z.array(
      z.object({ quote: text, name: text, title: text.optional(), image: image.optional() }),
    ),
  },
  personGrid: {
    columns: z.unknown().optional(),
    people: z.array(
      z.object({
        name: text,
        role: text,
        image: image.optional(),
        links: z.array(link).optional(),
      }),
    ),
  },
  form: { formName: z.string() },
  pricingTable: {
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
  },
} satisfies Record<BlockType, z.ZodRawShape>

export const BLOCK_TYPES = Object.keys(blockShapes) as BlockType[]

const blockOptions = BLOCK_TYPES.map((blockType) =>
  z.object({ blockType: z.literal(blockType), ...blockShapes[blockType] }),
)

const block = z.discriminatedUnion(
  'blockType',
  blockOptions as unknown as [(typeof blockOptions)[number], (typeof blockOptions)[number]],
)

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

  try {
    const result = previewSections.safeParse(Array.isArray(parsed) ? parsed : [parsed])
    return result.success ? (result.data as SectionDefinition[]) : null
  } catch {
    return null
  }
}
