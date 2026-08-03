import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type { Field } from 'payload'

import { blockFromSchema, fieldsFromSchema } from '@/lib/presets/payload-fields'
import { presetBlocks, presetRegistry } from '@/lib/presets/registry'

function byName(fields: Field[], name: string) {
  return fields.find((f) => 'name' in f && f.name === name) as never as Record<string, unknown>
}

describe('scalar fields', () => {
  it('makes a min-length string required and a bare string optional', () => {
    const fields = fieldsFromSchema(z.object({ a: z.string().min(1), b: z.string() }))

    expect(byName(fields, 'a')).toMatchObject({ type: 'text', required: true })
    expect(byName(fields, 'b')).toMatchObject({ type: 'text', required: false })
  })

  it('treats an optional string as not required', () => {
    const fields = fieldsFromSchema(z.object({ a: z.string().min(1).optional() }))

    expect(byName(fields, 'a')).toMatchObject({ required: false })
  })

  it('honours a textarea hint from schema metadata', () => {
    const fields = fieldsFromSchema(
      z.object({ a: z.string().optional().meta({ payload: { type: 'textarea' } }) }),
    )

    expect(byName(fields, 'a')).toMatchObject({ type: 'textarea' })
  })

  it('reads a hint placed on either side of optional', () => {
    const outer = fieldsFromSchema(
      z.object({ a: z.string().optional().meta({ payload: { type: 'textarea' } }) }),
    )
    const inner = fieldsFromSchema(
      z.object({ a: z.string().meta({ payload: { type: 'textarea' } }).optional() }),
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
    const fields = fieldsFromSchema(
      z.object({ cta: z.object({ label: z.string().min(1) }) }),
    )

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
  it('generates one block per registered Preset with a stable interface name', () => {
    const blocks = presetBlocks()

    expect(blocks.map((b) => b.slug).sort()).toEqual(['benefitsGrid', 'featureGrid', 'heroCentered'])
    expect(blocks.find((b) => b.slug === 'heroCentered')?.interfaceName).toBe('HeroCenteredBlock')
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
