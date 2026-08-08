import { describe, expect, it } from 'vitest'

import { conditionHolds } from '@/lib/forms/conditions'
import { buildSchema } from '@/lib/forms/schema-builder'
import { hiddenValues } from '@/lib/forms/submitted-values'
import type { FieldConfig } from '@/lib/forms/types'

describe('exists condition reads its boolean', () => {
  it('exists: true holds only when the field has a value', () => {
    expect(conditionHolds({ field: 'promo', exists: true }, { promo: 'x' })).toBe(true)
    expect(conditionHolds({ field: 'promo', exists: true }, { promo: '' })).toBe(false)
  })

  it('exists: false holds only when the field is empty', () => {
    expect(conditionHolds({ field: 'promo', exists: false }, { promo: '' })).toBe(true)
    expect(conditionHolds({ field: 'promo', exists: false }, { promo: 'x' })).toBe(false)
    expect(conditionHolds({ field: 'rooms', exists: false }, { rooms: [] })).toBe(true)
    expect(conditionHolds({ field: 'rooms', exists: false }, { rooms: [{ a: 1 }] })).toBe(false)
  })
})

describe('disabled fields skip constraint validation', () => {
  const fields: FieldConfig[] = [
    { name: 'gate', type: 'checkbox', label: 'Gate' },
    {
      name: 'locked',
      type: 'text',
      label: 'Locked',
      required: true,
      enableWhen: { field: 'gate', equals: 'true' },
    },
  ]

  it('a required field disabled by enableWhen produces no issue', () => {
    const parsed = buildSchema(fields).safeParse({ gate: false, locked: '' })
    expect(parsed.success).toBe(true)
  })

  it('the same field enabled is required again', () => {
    const parsed = buildSchema(fields).safeParse({ gate: true, locked: '' })
    expect(parsed.success).toBe(false)
  })
})

describe('step tolerates floating point', () => {
  const fields: FieldConfig[] = [
    { name: 'qty', type: 'number', label: 'Qty', step: 0.1 },
  ]

  it('accepts 0.3 for step 0.1', () => {
    expect(buildSchema(fields).safeParse({ qty: 0.3 }).success).toBe(true)
  })

  it('rejects 0.35 for step 0.1', () => {
    expect(buildSchema(fields).safeParse({ qty: 0.35 }).success).toBe(false)
  })
})

describe('text min/max enforce character lengths', () => {
  const fields: FieldConfig[] = [{ name: 'ref', type: 'text', label: 'Ref', min: 5, max: 10 }]

  it('rejects a value shorter than min', () => {
    expect(buildSchema(fields).safeParse({ ref: 'abc' }).success).toBe(false)
  })

  it('accepts a value within min and max', () => {
    expect(buildSchema(fields).safeParse({ ref: 'abcdef' }).success).toBe(true)
  })

  it('rejects a value longer than max', () => {
    expect(buildSchema(fields).safeParse({ ref: 'abcdefghijk' }).success).toBe(false)
  })
})

describe('hiddenValues leaves disabled fields alone', () => {
  const fields: FieldConfig[] = [
    { name: 'rooms', type: 'fieldArray', label: 'Rooms', fields: [{ name: 'n', type: 'text' }] },
    {
      name: 'phone',
      type: 'tel',
      label: 'Phone',
      enableWhen: { field: 'rooms', exists: true },
    },
    {
      name: 'secret',
      type: 'text',
      label: 'Secret',
      showWhen: { field: 'rooms', exists: true },
    },
  ]

  it('does not reset a disabled-but-visible value', () => {
    const found = hiddenValues(fields, { rooms: [], phone: '0200', secret: '' })
    expect(found.map((f) => f.path)).not.toContain('phone')
  })

  it('still resets a hidden value', () => {
    const found = hiddenValues(fields, { rooms: [], phone: '', secret: 'stale' })
    expect(found.map((f) => f.path)).toContain('secret')
  })
})
