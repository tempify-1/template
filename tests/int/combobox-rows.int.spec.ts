import { describe, expect, it } from 'vitest'

import { buildSchema } from '@/lib/forms/schema-builder'
import { hiddenValues, submittedValues } from '@/lib/forms/submitted-values'
import { defaultValueFor, type FieldConfig } from '@/lib/forms/types'

const travellers: FieldConfig = {
  name: 'travellers',
  type: 'combobox',
  label: 'Travellers',
  singularLabel: 'traveller',
  required: true,
  max: 4,
  reselectOptions: true,
  options: [
    { label: 'Adult', value: 'adult' },
    { label: 'Child', value: 'child' },
  ],
  fields: [
    { name: 'firstName', type: 'text', label: 'First name', required: true },
    { name: 'middleName', type: 'text', label: 'Middle name' },
    { name: 'lastName', type: 'text', label: 'Last name', required: true },
    {
      name: 'age',
      type: 'number',
      label: 'Age',
      showWhen: { field: 'value', equals: 'child' },
    },
  ],
}

const form: FieldConfig[] = [travellers, { name: 'submit', type: 'submit', label: 'Send' }]

const adult = (first: string, last: string) => ({
  value: 'adult',
  label: 'Adult',
  firstName: first,
  middleName: '',
  lastName: last,
})

describe('combobox default value', () => {
  it('is an empty array', () => {
    expect(defaultValueFor(travellers)).toEqual([])
  })
})

describe('combobox rows through the schema', () => {
  const schema = buildSchema(form)

  it('rejects an empty list when required', () => {
    const parsed = schema.safeParse({ travellers: [] })
    expect(parsed.success).toBe(false)
  })

  it('rejects more rows than max', () => {
    const rows = [1, 2, 3, 4, 5].map((i) => adult(`A${i}`, 'B'))
    expect(schema.safeParse({ travellers: rows }).success).toBe(false)
  })

  it('accepts duplicate option rows', () => {
    const rows = [adult('Ana', 'One'), adult('Ben', 'Two')]
    expect(schema.safeParse({ travellers: rows }).success).toBe(true)
  })

  it('places a row-field error at the row path', () => {
    const parsed = schema.safeParse({
      travellers: [{ value: 'adult', label: 'Adult', firstName: '', middleName: '', lastName: 'X' }],
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const paths = parsed.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('travellers.0.firstName')
    }
  })

  it('requires a row field only when its row-scoped condition holds', () => {
    const child = {
      value: 'child',
      label: 'Child',
      firstName: 'Kit',
      middleName: '',
      lastName: 'Y',
      age: 7,
    }
    expect(schema.safeParse({ travellers: [child, adult('Ana', 'Z')] }).success).toBe(true)
  })
})

describe('combobox row shape rules', () => {
  it('accepts a seeded row that carries no label', () => {
    const schema = buildSchema(form)
    const parsed = schema.safeParse({
      travellers: [{ value: 'adult', firstName: 'Ana', middleName: '', lastName: 'One' }],
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects a config whose row field is named value or label', () => {
    const colliding: FieldConfig[] = [
      {
        name: 'rooms',
        type: 'combobox',
        options: [{ label: 'A', value: 'a' }],
        fields: [{ name: 'label', type: 'text' }],
      },
    ]
    expect(() => buildSchema(colliding)).toThrow(/reserved/)
  })
})

describe('combobox rows through submittedValues', () => {
  it('keeps value and label plus declared row fields, drops smuggled keys', () => {
    const out = submittedValues(form, {
      travellers: [{ ...adult('Ana', 'One'), smuggled: 'x' }],
    })
    expect(out).toEqual({
      travellers: [
        { value: 'adult', label: 'Adult', firstName: 'Ana', middleName: '', lastName: 'One' },
      ],
    })
  })

  it('applies row-scoped conditions per row, not against the form root', () => {
    const out = submittedValues(form, {
      travellers: [
        { value: 'child', label: 'Child', firstName: 'Kit', middleName: '', lastName: 'Y', age: 7 },
        { ...adult('Ana', 'Two'), age: 40 },
      ],
    }) as { travellers: Record<string, unknown>[] }
    expect(out.travellers[0]?.age).toBe(7)
    expect('age' in (out.travellers[1] ?? {})).toBe(false)
  })
})

describe('combobox rows through hiddenValues', () => {
  it('reports a stale hidden per-row value at its row path', () => {
    const found = hiddenValues(form, {
      travellers: [{ ...adult('Ana', 'One'), age: 40 }],
    })
    expect(found.map((f) => f.path)).toContain('travellers.0.age')
  })
})
