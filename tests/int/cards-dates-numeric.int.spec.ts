import { describe, expect, it } from 'vitest'

import { parseIsoDate, toIsoDate } from '@/lib/forms/date'
import { emptyValues } from '@/lib/forms/resolvers'
import { buildSchema } from '@/lib/forms/schema-builder'
import type { FieldConfig } from '@/lib/forms/types'

describe('iso date helpers', () => {
  it('round-trips yyyy-MM-dd', () => {
    expect(toIsoDate(new Date(2026, 7, 8))).toBe('2026-08-08')
    expect(parseIsoDate('2026-08-08')?.getFullYear()).toBe(2026)
    expect(parseIsoDate('2026-13-40')).toBeUndefined()
    expect(parseIsoDate('nonsense')).toBeUndefined()
    expect(parseIsoDate('')).toBeUndefined()
  })
})

describe('date and dateRange schema', () => {
  const fields: FieldConfig[] = [
    { name: 'checkIn', type: 'date', label: 'Check in', required: true },
    { name: 'stay', type: 'dateRange', label: 'Stay' },
  ]
  const schema = buildSchema(fields)

  it('accepts iso strings and a coherent range', () => {
    expect(
      schema.safeParse({ checkIn: '2026-08-08', stay: { start: '2026-08-08', end: '2026-08-12' } })
        .success,
    ).toBe(true)
  })

  it('rejects a range whose end precedes its start, at the field path', () => {
    const parsed = schema.safeParse({
      checkIn: '2026-08-08',
      stay: { start: '2026-08-12', end: '2026-08-08' },
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.map((i) => i.path.join('.'))).toContain('stay')
    }
  })

  it('rejects an empty required date', () => {
    expect(schema.safeParse({ checkIn: '', stay: undefined }).success).toBe(false)
  })
})

describe('checkboxCards and pickers', () => {
  const fields: FieldConfig[] = [
    {
      name: 'boards',
      type: 'checkboxCards',
      label: 'Boards',
      options: [
        { label: 'BB', value: 'bb' },
        { label: 'HB', value: 'hb' },
      ],
    },
    {
      name: 'roomCounts',
      type: 'numberPickerTable',
      label: 'Rooms',
      min: 1,
      max: 4,
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Deluxe', value: 'deluxe' },
      ],
    },
  ]
  const schema = buildSchema(fields)

  it('checkboxCards stores string[]; pickers store a count record', () => {
    expect(
      schema.safeParse({ boards: ['bb'], roomCounts: { standard: 2, deluxe: 1 } }).success,
    ).toBe(true)
    expect(emptyValues(fields)).toEqual({ boards: [], roomCounts: {} })
  })

  it('picker totals respect field min and max', () => {
    expect(schema.safeParse({ boards: [], roomCounts: {} }).success).toBe(false)
    expect(
      schema.safeParse({ boards: [], roomCounts: { standard: 3, deluxe: 2 } }).success,
    ).toBe(false)
    expect(schema.safeParse({ boards: [], roomCounts: { standard: 1 } }).success).toBe(true)
  })

  it('rejects negative or fractional counts', () => {
    expect(schema.safeParse({ boards: [], roomCounts: { standard: -1 } }).success).toBe(false)
    expect(schema.safeParse({ boards: [], roomCounts: { standard: 1.5 } }).success).toBe(false)
  })

  it('an orphaned checked card surfaces at the field path', () => {
    const keyed: FieldConfig[] = [
      { name: 'plan', type: 'select', options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] },
      {
        name: 'addons',
        type: 'checkboxCards',
        optionsFrom: { field: 'plan', map: { a: [{ label: 'X', value: 'x' }], b: [{ label: 'Y', value: 'y' }] } },
      },
    ]
    const parsed = buildSchema(keyed).safeParse({ plan: 'b', addons: ['x'] })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.map((i) => i.path.join('.'))).toContain('addons')
    }
  })

  it('range validates through the numeric pipes', () => {
    const rf: FieldConfig[] = [{ name: 'flex', type: 'range', min: 0, max: 10, step: 1 }]
    expect(buildSchema(rf).safeParse({ flex: 5 }).success).toBe(true)
    expect(buildSchema(rf).safeParse({ flex: 11 }).success).toBe(false)
  })
})
