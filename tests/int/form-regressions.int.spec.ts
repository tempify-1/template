import { describe, it, expect } from 'vitest'

import { buildSchema } from '@/lib/forms/schema-builder'
import { emptyValues } from '@/lib/forms/resolvers'
import { conditionHolds } from '@/lib/forms/conditions'
import { getAtPath, setAtPath } from '@/lib/forms/paths'
import type { FieldConfig } from '@/lib/forms/types'

describe('length constraints respect visibility', () => {
  const fields: FieldConfig[] = [
    {
      name: 'topic',
      type: 'select',
      options: [
        { label: 'Sales', value: 'sales' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'reason', type: 'textarea', min: 10, showWhen: { field: 'topic', equals: 'other' } },
  ]

  it('does not apply min to a field hidden by showWhen', () => {
    const result = buildSchema(fields).safeParse({ topic: 'sales', reason: '' })

    expect(result.success).toBe(true)
  })

  it('applies min once the field is visible and non-empty', () => {
    const result = buildSchema(fields).safeParse({ topic: 'other', reason: 'short' })

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.message).toBe('Must be at least 10 characters')
  })

  it('does not apply min to an optional visible field left empty', () => {
    const result = buildSchema([{ name: 'bio', type: 'textarea', min: 10 }]).safeParse({ bio: '' })

    expect(result.success).toBe(true)
  })
})

describe('dot-path field names', () => {
  const fields: FieldConfig[] = [
    { name: 'address.city', type: 'text', label: 'City', required: true },
    { name: 'address.postcode', type: 'text', label: 'Postcode' },
    { name: 'billingSame', type: 'checkbox', label: 'Billing same' },
  ]

  it('builds a nested schema matching the shape react-hook-form produces', () => {
    const ok = buildSchema(fields).safeParse({
      address: { city: 'Leeds', postcode: 'LS1' },
      billingSame: true,
    })

    expect(ok.success).toBe(true)
  })

  it('reports a required error at the nested path, not a flat key', () => {
    const result = buildSchema(fields).safeParse({ address: { city: '' }, billingSame: false })

    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.path).toEqual(['address', 'city'])
    expect(result.error!.issues[0]!.message).toBe('City is required')
  })

  it('seeds nested defaults rather than a flat key', () => {
    expect(emptyValues(fields)).toEqual({
      address: { city: '', postcode: '' },
      billingSame: false,
    })
  })

  it('evaluates a condition targeting a nested field', () => {
    const values = { address: { city: 'Leeds' } }

    expect(conditionHolds({ field: 'address.city', equals: 'Leeds' }, values)).toBe(true)
    expect(conditionHolds({ field: 'address.city', notEmpty: true }, values)).toBe(true)
    expect(conditionHolds({ field: 'address.city', equals: 'York' }, values)).toBe(false)
  })
})

describe('condition targets are validated', () => {
  it('throws when a showWhen targets a field that does not exist', () => {
    expect(() =>
      buildSchema([
        { name: 'planType', type: 'text' },
        {
          name: 'consent',
          type: 'checkbox',
          required: true,
          showWhen: { field: 'plan_type', equals: 'pro' },
        },
      ]),
    ).toThrow(/plan_type/)
  })

  it('throws when a requiredWhen targets a field that does not exist', () => {
    expect(() =>
      buildSchema([{ name: 'a', type: 'text', requiredWhen: { field: 'nope', notEmpty: true } }]),
    ).toThrow(/nope/)
  })

  it('accepts conditions targeting real fields', () => {
    expect(() =>
      buildSchema([
        { name: 'planType', type: 'text' },
        { name: 'consent', type: 'checkbox', showWhen: { field: 'planType', equals: 'pro' } },
      ]),
    ).not.toThrow()
  })
})

describe('missing keys produce the configured message', () => {
  it('reports the required message rather than a raw zod type error', () => {
    const result = buildSchema([
      { name: 'a', type: 'checkbox' },
      { name: 'b', type: 'text', label: 'B', required: true },
    ]).safeParse({})

    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.message)).toEqual(['B is required'])
  })
})

describe('path helpers', () => {
  it('reads a missing branch as undefined rather than throwing', () => {
    expect(getAtPath({ a: 1 }, 'b.c.d')).toBeUndefined()
  })

  it('creates intermediate objects when setting a nested path', () => {
    const target: Record<string, unknown> = {}
    setAtPath(target, 'a.b.c', 'x')

    expect(target).toEqual({ a: { b: { c: 'x' } } })
  })
})
