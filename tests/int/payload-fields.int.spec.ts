import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type { Field } from 'payload'

import { blockFromSchema, fieldsFromSchema } from '@/lib/presets/payload-fields'
import { presetBlocks, presetBlockSchema, presetRegistry } from '@/lib/presets/registry'

function byName(fields: Field[], name: string) {
  return fields.find((f) => 'name' in f && f.name === name) as never as Record<string, unknown>
}

describe('scalar fields', () => {
  it('requires any string the schema does not mark optional, constrained or not', () => {
    const fields = fieldsFromSchema(z.object({ a: z.string().min(1), b: z.string() }))

    expect(byName(fields, 'a')).toMatchObject({ type: 'text', required: true })
    expect(byName(fields, 'b')).toMatchObject({ type: 'text', required: true })
  })

  it('treats an optional string as not required', () => {
    const fields = fieldsFromSchema(z.object({ a: z.string().min(1).optional() }))

    expect(byName(fields, 'a')).toMatchObject({ required: false })
  })

  it('honours a textarea hint from schema metadata', () => {
    const fields = fieldsFromSchema(
      z.object({
        a: z
          .string()
          .optional()
          .meta({ payload: { type: 'textarea' } }),
      }),
    )

    expect(byName(fields, 'a')).toMatchObject({ type: 'textarea' })
  })

  it('reads a hint placed on either side of optional', () => {
    const outer = fieldsFromSchema(
      z.object({
        a: z
          .string()
          .optional()
          .meta({ payload: { type: 'textarea' } }),
      }),
    )
    const inner = fieldsFromSchema(
      z.object({
        a: z
          .string()
          .meta({ payload: { type: 'textarea' } })
          .optional(),
      }),
    )

    expect(byName(outer, 'a')).toMatchObject({ type: 'textarea' })
    expect(byName(inner, 'a')).toMatchObject({ type: 'textarea' })
  })

  it('maps booleans to checkboxes and enums to selects carrying every option', () => {
    const fields = fieldsFromSchema(
      z.object({ flag: z.boolean(), pick: z.enum(['one', 'two', 'three']) }),
    )

    expect(byName(fields, 'flag')).toMatchObject({ type: 'checkbox' })
    expect(byName(fields, 'pick')).toMatchObject({ type: 'select', required: true })
    expect((byName(fields, 'pick').options as unknown[]).length).toBe(3)
  })

  it('derives a readable label from a camelCase name', () => {
    const fields = fieldsFromSchema(z.object({ primaryCallToAction: z.string() }))

    expect(byName(fields, 'primaryCallToAction')).toMatchObject({ label: 'Primary Call To Action' })
  })
})

describe('groups', () => {
  it('does not mark subfields required when the group itself is optional', () => {
    const fields = fieldsFromSchema(
      z.object({ cta: z.object({ label: z.string().min(1), href: z.string().min(1) }).optional() }),
    )

    const group = byName(fields, 'cta')
    expect(group).toMatchObject({ type: 'group' })
    expect(byName(group.fields as Field[], 'label')).toMatchObject({ required: false })
    expect(byName(group.fields as Field[], 'href')).toMatchObject({ required: false })
  })

  it('keeps subfields required when the group is required', () => {
    const fields = fieldsFromSchema(z.object({ cta: z.object({ label: z.string().min(1) }) }))

    const group = byName(fields, 'cta')
    expect(byName(group.fields as Field[], 'label')).toMatchObject({ required: true })
  })
})

describe('arrays', () => {
  it('expands an array of objects into the row fields', () => {
    const fields = fieldsFromSchema(
      z.object({ items: z.array(z.object({ title: z.string().min(1) })).min(1) }),
    )

    const array = byName(fields, 'items')
    expect(array).toMatchObject({ type: 'array', minRows: 1 })
    expect(byName(array.fields as Field[], 'title')).toMatchObject({ required: true })
  })

  it('wraps an array of scalars in a single named row field', () => {
    const fields = fieldsFromSchema(z.object({ badges: z.array(z.string().min(1)) }))

    const array = byName(fields, 'badges')
    expect((array.fields as Field[]).length).toBe(1)
    expect(byName(array.fields as Field[], 'text')).toMatchObject({ type: 'text' })
  })

  it('lets metadata rename the scalar row field', () => {
    const fields = fieldsFromSchema(
      z.object({
        tags: z.array(z.string()).meta({ payload: { itemField: 'value' } }),
      }),
    )

    expect(byName(byName(fields, 'tags').fields as Field[], 'value')).toBeDefined()
  })
})

describe('generated blocks', () => {
  it('gives each generated block field names matching its Preset schema keys', () => {
    for (const block of presetBlocks()) {
      const entry = presetRegistry[block.slug as keyof typeof presetRegistry]
      const schemaKeys = Object.keys(
        (presetBlockSchema(entry.schema) as never as { def: { shape: Record<string, unknown> } })
          .def.shape,
      )
      const fieldNames = block.fields.map((f) => ('name' in f ? f.name : ''))

      expect(fieldNames.sort(), block.slug).toEqual(schemaKeys.sort())
    }
  })

  it('names block interfaces from the slug so payload-types stays stable', () => {
    const blocks = presetBlocks()

    expect(blocks.find((b) => b.slug === 'heroCentered')?.interfaceName).toBe('HeroCenteredBlock')
    expect(blocks.find((b) => b.slug === 'faqAccordion')?.interfaceName).toBe('FaqAccordionBlock')
  })

  it('marks a min-length array required so Payload rejects a block saved with no rows', () => {
    const fields = fieldsFromSchema(
      z.object({ items: z.array(z.object({ a: z.string() })).min(1) }),
    )

    expect(byName(fields, 'items')).toMatchObject({ minRows: 1, required: true })
  })

  it('attaches an all-or-none validator to an optional group of required fields', () => {
    const fields = fieldsFromSchema(
      z.object({ cta: z.object({ label: z.string().min(1), href: z.string().min(1) }).optional() }),
    )

    const validate = byName(fields, 'cta').validate as (v: unknown) => true | string

    expect(validate({})).toBe(true)
    expect(validate({ label: 'Go', href: '/go' })).toBe(true)
    expect(validate({ label: 'Go' })).toContain('leave them all empty')
    expect(validate({ href: '/go' })).toContain('leave them all empty')
  })

  it('produces a block for every Preset without any hand-written definition', () => {
    for (const [slug, entry] of Object.entries(presetRegistry)) {
      const block = blockFromSchema({
        slug,
        schema: entry.schema,
        singular: entry.singular,
        plural: entry.plural,
      })
      expect(block.fields.length).toBeGreaterThan(0)
    }
  })

  it('rejects a Preset schema that is not an object at its root', () => {
    expect(() => fieldsFromSchema(z.string())).toThrow(/object schema/)
  })
})
