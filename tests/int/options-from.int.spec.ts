import { describe, expect, it } from 'vitest'

import { resolveRowOptions } from '@/lib/forms/options-from'
import { buildSchema } from '@/lib/forms/schema-builder'
import type { FieldConfig } from '@/lib/forms/types'

const title: FieldConfig = {
  name: 'title',
  type: 'select',
  label: 'Title',
  optionsFrom: {
    field: 'board',
    map: {
      family: [
        { label: 'Adult', value: 'adult' },
        { label: 'Child', value: 'child' },
      ],
      single: [{ label: 'Adult', value: 'adult' }],
    },
  },
}

describe('resolveRowOptions', () => {
  it('selects the list keyed by the sibling value', () => {
    expect(resolveRowOptions(title, { board: 'family' }).map((o) => o.value)).toEqual([
      'adult',
      'child',
    ])
    expect(resolveRowOptions(title, { board: 'single' }).map((o) => o.value)).toEqual(['adult'])
  })

  it('offers nothing for a missing key', () => {
    expect(resolveRowOptions(title, { board: 'suite' })).toEqual([])
    expect(resolveRowOptions(title, {})).toEqual([])
  })

  it('falls back to static options when no optionsFrom is declared', () => {
    const plain: FieldConfig = {
      name: 'x',
      type: 'select',
      options: [{ label: 'A', value: 'a' }],
    }
    expect(resolveRowOptions(plain, {}).map((o) => o.value)).toEqual(['a'])
  })
})

describe('orphaned per-row values surface as invalid', () => {
  const rooms: FieldConfig[] = [
    {
      name: 'rooms',
      type: 'cardArray',
      label: 'Rooms',
      fields: [
        {
          name: 'board',
          type: 'select',
          label: 'Board',
          options: [
            { label: 'Family', value: 'family' },
            { label: 'Single', value: 'single' },
          ],
        },
        title,
      ],
    },
  ]

  it('accepts a value the current key offers', () => {
    const parsed = buildSchema(rooms).safeParse({
      rooms: [{ board: 'family', title: 'child' }],
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects a stored value the changed key no longer offers, at the row path', () => {
    const parsed = buildSchema(rooms).safeParse({
      rooms: [{ board: 'single', title: 'child' }],
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.map((i) => i.path.join('.'))).toContain('rooms.0.title')
    }
  })

  it('does not reject an empty value under any key', () => {
    const parsed = buildSchema(rooms).safeParse({ rooms: [{ board: 'single', title: '' }] })
    expect(parsed.success).toBe(true)
  })
})
