import { getPayload, type Payload } from 'payload'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { z } from 'zod'
import type { Field } from 'payload'

import config from '@/payload.config'
import { fieldsFromSchema } from '@/lib/presets/payload-fields'
import { presetBlocks } from '@/lib/presets/registry'
import { mapPageResult } from '@/mappers/page'

const SLUG = 'int-generated-block'

function byName(fields: Field[], name: string) {
  return fields.find((f) => 'name' in f && f.name === name) as never as Record<string, unknown>
}

describe('zod introspection assumptions', () => {
  it('still exposes the internals the generator walks', () => {
    const object = z.object({ a: z.string().min(1) })
    const array = z
      .array(z.object({ b: z.string() }))
      .min(1)
      .max(3)
    const enumeration = z.enum(['one', 'two'])

    expect((object as never as { def: Record<string, unknown> }).def.shape).toBeDefined()
    expect((array as never as { def: Record<string, unknown> }).def.element).toBeDefined()
    expect((enumeration as never as { def: Record<string, unknown> }).def.entries).toBeDefined()

    const checks = (array as never as { def: { checks: { _zod: { def: { check: string } } }[] } })
      .def.checks
    expect(checks.map((c) => c._zod.def.check).sort()).toEqual(['max_length', 'min_length'])
  })

  it('refuses a zod kind it has no Payload mapping for, rather than emitting a text field', () => {
    expect(() => fieldsFromSchema(z.object({ when: z.date() }))).toThrow(/no Payload field mapping/)
    expect(() => fieldsFromSchema(z.object({ any: z.union([z.string(), z.number()]) }))).toThrow(
      /no Payload field mapping/,
    )
  })
})

describe('required-ness follows optionality, not constraints', () => {
  it('treats a constraint-free string as required and an optional one as not', () => {
    const fields = fieldsFromSchema(
      z.object({ plain: z.string(), mail: z.email(), maybe: z.string().optional() }),
    )

    expect(byName(fields, 'plain')).toMatchObject({ required: true })
    expect(byName(fields, 'mail')).toMatchObject({ required: true })
    expect(byName(fields, 'maybe')).toMatchObject({ required: false })
  })

  it('keeps array rows required even when the array itself is optional', () => {
    const fields = fieldsFromSchema(z.object({ tags: z.array(z.string().min(1)).default([]) }))

    const rows = byName(fields, 'tags').fields as Field[]
    expect(byName(rows, 'text')).toMatchObject({ required: true })
  })

  it('drops minRows when the containing group is optional, so the group can stay blank', () => {
    const fields = fieldsFromSchema(
      z.object({
        panel: z.object({ items: z.array(z.object({ t: z.string() })).min(1) }).optional(),
      }),
    )

    const group = byName(fields, 'panel')
    expect(byName(group.fields as Field[], 'items').minRows).toBeUndefined()
  })

  it('carries upper bounds through to Payload', () => {
    const fields = fieldsFromSchema(
      z.object({ rows: z.array(z.string()).max(3), note: z.string().max(140) }),
    )

    expect(byName(fields, 'rows')).toMatchObject({ maxRows: 3 })
    expect(byName(fields, 'note')).toMatchObject({ maxLength: 140 })
  })
})

describe('array and enum labelling', () => {
  it('never mangles a singular label by stripping letters from the plural', () => {
    for (const block of presetBlocks()) {
      for (const field of block.fields) {
        if ('type' in field && field.type === 'array' && 'labels' in field) {
          const singular = String(field.labels?.singular ?? '')
          expect(singular).not.toMatch(/(Featur|Badg|Benefi)$/)
        }
      }
    }
  })

  it('builds select options from enum values, not enum keys', () => {
    const fields = fieldsFromSchema(z.object({ size: z.enum(['sm', 'lg']) }))
    const options = byName(fields, 'size').options as { value: string }[]

    expect(options.map((o) => o.value).sort()).toEqual(['lg', 'sm'])
  })
})

describe('a generated block round-trips through the Local API and the mapper', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'pages', where: { slug: { equals: SLUG } } })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'pages', where: { slug: { equals: SLUG } } })
  })

  it('accepts a document shaped by the generated fields and maps it back to Sections', async () => {
    const created = await payload.create({
      collection: 'pages',
      data: {
        title: 'Generated block round trip',
        slug: SLUG,
        _status: 'published',
        sections: [
          {
            blockType: 'heroCentered',
            heading: 'From a generated block',
            primaryCta: { label: 'Go', href: '/go' },
            secondaryCta: { label: null, href: null },
            trustBadges: [{ text: 'Badge' }],
          },
          {
            blockType: 'featureGrid',
            heading: 'Features',
            features: [{ icon: 'zap', title: 'Fast' }],
          },
        ],
      },
    })

    const { sections, skipped } = mapPageResult(created)

    expect(skipped).toHaveLength(0)
    expect(sections).toHaveLength(2)
  })

  it('leaves a hero authored without a minHeight unconstrained', async () => {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: SLUG } },
      limit: 1,
      overrideAccess: false,
    })

    const [hero] = mapPageResult(docs[0]!).sections
    expect(hero!.minHeight).toBeUndefined()
  })
})
