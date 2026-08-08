import { describe, expect, it } from 'vitest'

import { mergeSelectedOptions } from '@/lib/forms/option-source'
import type { Option } from '@/lib/forms/types'

const opt = (value: string, label: string): Option => ({ value, label })

describe('mergeSelectedOptions', () => {
  it('keeps a selected option that the new results no longer contain', () => {
    const merged = mergeSelectedOptions([opt('b', 'B')], [opt('a', 'A')])
    expect(merged.map((o) => o.value)).toEqual(['b', 'a'])
  })

  it('does not duplicate a selected option that is also in the results', () => {
    const merged = mergeSelectedOptions([opt('a', 'A'), opt('b', 'B')], [opt('a', 'A')])
    expect(merged.map((o) => o.value)).toEqual(['a', 'b'])
  })

  it('results lead, selections follow, result order preserved', () => {
    const merged = mergeSelectedOptions([opt('c', 'C'), opt('a', 'A')], [opt('b', 'B')])
    expect(merged.map((o) => o.value)).toEqual(['c', 'a', 'b'])
  })

  it('empty results still offer the selections', () => {
    const merged = mergeSelectedOptions([], [opt('a', 'A')])
    expect(merged.map((o) => o.value)).toEqual(['a'])
  })
})

import { conditionHolds } from '@/lib/forms/conditions'
import { buildSchema } from '@/lib/forms/schema-builder'
import type { FieldConfig } from '@/lib/forms/types'

describe('async searchableSelect value shape', () => {
  const source = async () => [opt('lis', 'Lisbon')]
  const fields: FieldConfig[] = [
    { name: 'dest', type: 'searchableSelect', label: 'Dest', required: true, optionSource: source },
  ]

  it('stores and validates {value,label}', () => {
    const schema = buildSchema(fields)
    expect(schema.safeParse({ dest: { value: 'lis', label: 'Lisbon' } }).success).toBe(true)
    expect(schema.safeParse({ dest: undefined }).success).toBe(false)
  })

  it('conditions compare against the object value key', () => {
    expect(conditionHolds({ field: 'dest', equals: 'lis' }, { dest: { value: 'lis', label: 'Lisbon' } })).toBe(true)
    expect(conditionHolds({ field: 'dest', not_equals: 'lis' }, { dest: { value: 'lis', label: 'Lisbon' } })).toBe(false)
    expect(conditionHolds({ field: 'dest', exists: true }, { dest: { value: 'lis', label: 'Lisbon' } })).toBe(true)
  })
})
