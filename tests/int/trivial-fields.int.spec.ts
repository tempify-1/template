import { describe, expect, it } from 'vitest'

import { formatMinorUnits, parseToMinorUnits } from '@/lib/forms/price'
import { emptyValues } from '@/lib/forms/resolvers'
import { buildSchema } from '@/lib/forms/schema-builder'
import { slugify } from '@/lib/forms/slug'
import { submittedValues } from '@/lib/forms/submitted-values'
import type { FieldConfig } from '@/lib/forms/types'

describe('slugify', () => {
  it('lowercases, hyphenates and strips', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('  Crème  Brûlée!  ')).toBe('creme-brulee')
    expect(slugify('a--b---c')).toBe('a-b-c')
    expect(slugify('-lead and trail-')).toBe('lead-and-trail')
  })
})

describe('price minor units', () => {
  it('parses display strings to integer minor units', () => {
    expect(parseToMinorUnits('49.99')).toBe(4999)
    expect(parseToMinorUnits('$1,299.50')).toBe(129950)
    expect(parseToMinorUnits('0')).toBe(0)
    expect(parseToMinorUnits('49.999')).toBeUndefined()
    expect(parseToMinorUnits('abc')).toBeUndefined()
    expect(parseToMinorUnits('')).toBeUndefined()
  })

  it('formats minor units back and round-trips', () => {
    expect(formatMinorUnits(4999)).toBe('49.99')
    expect(formatMinorUnits(0)).toBe('0.00')
    expect(parseToMinorUnits(formatMinorUnits(129950))).toBe(129950)
  })

  it('the schema stores an integer and rejects floats', () => {
    const fields: FieldConfig[] = [{ name: 'amount', type: 'price', label: 'Amount' }]
    expect(buildSchema(fields).safeParse({ amount: 4999 }).success).toBe(true)
    expect(buildSchema(fields).safeParse({ amount: 49.99 }).success).toBe(false)
  })
})

describe('paragraph and alert carry no value', () => {
  const fields: FieldConfig[] = [
    { name: 'intro', type: 'paragraph', label: 'Intro', description: 'Welcome.' },
    { name: 'warning', type: 'alert', label: 'Heads up' },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'submit', type: 'submit' },
  ]

  it('are excluded from payload and seeding like submit', () => {
    expect(emptyValues(fields)).toEqual({ email: '' })
    const out = submittedValues(fields, { email: 'a@b.co', intro: 'smuggled' })
    expect(out).toEqual({ email: 'a@b.co' })
  })
})

describe('multiSelect stores bare string arrays', () => {
  const fields: FieldConfig[] = [
    {
      name: 'tags',
      type: 'multiSelect',
      label: 'Tags',
      required: true,
      max: 2,
      options: [
        { label: 'Pool', value: 'pool' },
        { label: 'Gym', value: 'gym' },
        { label: 'Spa', value: 'spa' },
      ],
    },
  ]

  it('accepts string[], rejects empty when required and overflow past max', () => {
    const schema = buildSchema(fields)
    expect(schema.safeParse({ tags: ['pool', 'gym'] }).success).toBe(true)
    expect(schema.safeParse({ tags: [] }).success).toBe(false)
    expect(schema.safeParse({ tags: ['pool', 'gym', 'spa'] }).success).toBe(false)
  })

  it('defaults to an empty array', () => {
    expect(emptyValues(fields)).toEqual({ tags: [] })
  })
})
