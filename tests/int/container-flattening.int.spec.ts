import { describe, expect, it } from 'vitest'

import { assertConditionTargetsExist } from '@/lib/forms/conditions'
import { emptyValues } from '@/lib/forms/resolvers'
import { buildSchema } from '@/lib/forms/schema-builder'
import { hiddenValues, submittedValues } from '@/lib/forms/submitted-values'
import type { FieldConfig } from '@/lib/forms/types'

const flat: FieldConfig[] = [
  { name: 'wantsCall', type: 'checkbox', label: 'Call me' },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone',
    required: true,
    showWhen: { field: 'wantsCall', equals: 'true' },
  },
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'submit', type: 'submit', label: 'Send' },
]

const contained: FieldConfig[] = [
  { name: 'wantsCall', type: 'checkbox', label: 'Call me' },
  {
    name: 'contactDetails',
    type: 'fieldset',
    label: 'Contact details',
    fields: [
      {
        name: 'phone',
        type: 'tel',
        label: 'Phone',
        required: true,
        showWhen: { field: 'wantsCall', equals: 'true' },
      },
      { name: 'email', type: 'email', label: 'Email', required: true },
    ],
  },
  { name: 'submit', type: 'submit', label: 'Send' },
]

const values = { wantsCall: true, phone: '0200', email: 'a@b.co' }

describe('containers group presentation, never paths', () => {
  it('a condition may target a field that moved into a fieldset', () => {
    expect(() => assertConditionTargetsExist(contained)).not.toThrow()
  })

  it('a condition inside a fieldset may target a field outside it', () => {
    expect(() => assertConditionTargetsExist(contained)).not.toThrow()
    const parsed = buildSchema(contained).safeParse({ wantsCall: true, phone: '', email: 'a@b.co' })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.map((i) => i.path.join('.'))).toContain('phone')
    }
  })

  it('the schema is identical in effect: same values pass and fail either way', () => {
    expect(buildSchema(flat).safeParse(values).success).toBe(true)
    expect(buildSchema(contained).safeParse(values).success).toBe(true)
    const bad = { wantsCall: false, phone: '', email: '' }
    expect(buildSchema(flat).safeParse(bad).success).toBe(false)
    expect(buildSchema(contained).safeParse(bad).success).toBe(false)
  })

  it('submittedValues is byte-identical between flat and contained configs', () => {
    expect(submittedValues(contained, values)).toEqual(submittedValues(flat, values))
  })

  it('hiddenValues reports the same paths either way', () => {
    const state = { wantsCall: false, phone: 'stale', email: '' }
    expect(hiddenValues(contained, state)).toEqual(hiddenValues(flat, state))
  })

  it('emptyValues seeds children at the top level, never under the container name', () => {
    const seeded = emptyValues(contained)
    expect(seeded).toHaveProperty('phone')
    expect(seeded).toHaveProperty('email')
    expect(seeded).not.toHaveProperty('contactDetails')
  })

  it('a container carrying a condition is rejected at config time', () => {
    const bad: FieldConfig[] = [
      { name: 'gate', type: 'checkbox' },
      {
        name: 'group',
        type: 'fieldset',
        showWhen: { field: 'gate', equals: 'true' },
        fields: [{ name: 'x', type: 'text' }],
      },
    ]
    expect(() => assertConditionTargetsExist(bad)).toThrow(/presentation only/)
  })

  it('a container contributes no value of its own', () => {
    const out = submittedValues(contained, { ...values, contactDetails: 'smuggled' })
    expect(out).not.toHaveProperty('contactDetails')
  })
})
