import { describe, expect, it } from 'vitest'

import { buildSchema } from '@/lib/forms/schema-builder'
import { hiddenValues, submittedValues } from '@/lib/forms/submitted-values'
import { defaultValueFor, type FieldConfig } from '@/lib/forms/types'

const rooms: FieldConfig = {
  name: 'rooms',
  type: 'cardArray',
  label: 'Rooms',
  singularLabel: 'room',
  required: true,
  max: 3,
  fields: [
    { name: 'boardName', type: 'text', label: 'Board', required: true },
    {
      name: 'age',
      type: 'number',
      label: 'Age',
      showWhen: { field: 'boardName', equals: 'child' },
    },
  ],
}

const form: FieldConfig[] = [rooms, { name: 'submit', type: 'submit', label: 'Send' }]

describe('cardArray rows', () => {
  it('defaults to an empty array', () => {
    expect(defaultValueFor(rooms)).toEqual([])
  })

  it('rows are template-born: a row field named label is allowed', () => {
    const withLabel: FieldConfig[] = [
      {
        name: 'cards',
        type: 'cardArray',
        fields: [{ name: 'label', type: 'text' }],
      },
    ]
    expect(() => buildSchema(withLabel)).not.toThrow()
    expect(
      buildSchema(withLabel).safeParse({ cards: [{ label: 'free text' }] }).success,
    ).toBe(true)
  })

  it('required rejects an empty list; max rejects overflow', () => {
    const schema = buildSchema(form)
    expect(schema.safeParse({ rooms: [] }).success).toBe(false)
    const row = { boardName: 'bb' }
    expect(schema.safeParse({ rooms: [row, row, row, row] }).success).toBe(false)
    expect(schema.safeParse({ rooms: [row] }).success).toBe(true)
  })

  it('row-field errors land at the row path', () => {
    const parsed = buildSchema(form).safeParse({ rooms: [{ boardName: '' }] })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.map((i) => i.path.join('.'))).toContain('rooms.0.boardName')
    }
  })

  it('submittedValues projects declared fields and drops smuggled keys', () => {
    const out = submittedValues(form, {
      rooms: [{ boardName: 'bb', smuggled: 'x' }],
    })
    expect(out).toEqual({ rooms: [{ boardName: 'bb' }] })
  })

  it('row-scoped conditions apply per row', () => {
    const out = submittedValues(form, {
      rooms: [
        { boardName: 'child', age: 7 },
        { boardName: 'bb', age: 40 },
      ],
    }) as { rooms: Record<string, unknown>[] }
    expect(out.rooms[0]?.age).toBe(7)
    expect('age' in (out.rooms[1] ?? {})).toBe(false)
  })

  it('hiddenValues reports stale per-row values at their row path', () => {
    const found = hiddenValues(form, { rooms: [{ boardName: 'bb', age: 40 }] })
    expect(found.map((f) => f.path)).toContain('rooms.0.age')
  })
})
