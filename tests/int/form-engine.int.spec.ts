import { describe, it, expect } from 'vitest'

import { buildSchema } from '@/lib/forms/schema-builder'
import { resolveDefaultValues, staticValues } from '@/lib/forms/resolvers'
import { isRequired, isVisible } from '@/lib/forms/conditions'
import { tripEnquiry } from '../helpers/form-fixtures'
import type { FieldConfig } from '@/lib/forms/types'

const contact: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Name', required: true },
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'topic', type: 'select', label: 'Topic', options: [{ label: 'Sales', value: 'sales' }] },
  {
    name: 'budget',
    type: 'text',
    label: 'Budget',
    required: true,
    showWhen: { field: 'topic', equals: 'sales' },
  },
  {
    name: 'message',
    type: 'textarea',
    label: 'Message',
    requiredWhen: { field: 'name', notEmpty: true },
  },
  { name: 'consent', type: 'checkbox', label: 'Consent' },
  { name: 'submit', type: 'submit', label: 'Send' },
]

const base = { name: '', email: '', topic: '', budget: '', message: '', consent: false }

describe('schema builder', () => {
  it('reports required fields that are empty, naming the label', () => {
    const result = buildSchema(contact).safeParse(base)

    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((i) => `${String(i.path[0])}: ${i.message}`)
    expect(messages).toContain('name: Name is required')
    expect(messages).toContain('email: Email is required')
  })

  it('does not require a field whose showWhen condition is false', () => {
    const result = buildSchema(contact).safeParse({
      ...base,
      name: 'Ada',
      email: 'a@b.com',
      message: 'hi',
    })

    expect(result.success).toBe(true)
  })

  it('requires that same field once its showWhen condition holds', () => {
    const result = buildSchema(contact).safeParse({
      ...base,
      name: 'Ada',
      email: 'a@b.com',
      message: 'hi',
      topic: 'sales',
    })

    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.path[0])).toContain('budget')
  })

  it('applies requiredWhen only while its condition holds', () => {
    const withoutTrigger = buildSchema(contact).safeParse({ ...base, email: 'a@b.com' })
    expect(withoutTrigger.error!.issues.map((i) => i.path[0])).not.toContain('message')

    const withTrigger = buildSchema(contact).safeParse({ ...base, name: 'Ada', email: 'a@b.com' })
    expect(withTrigger.error!.issues.map((i) => i.path[0])).toContain('message')
  })

  it('rejects a malformed email but only when one was supplied', () => {
    const bad = buildSchema(contact).safeParse({
      ...base,
      name: 'Ada',
      email: 'nope',
      message: 'hi',
    })
    expect(bad.error!.issues.some((i) => i.message === 'Enter a valid email address')).toBe(true)
  })

  it('rejects a select value that is not one of the configured options', () => {
    const result = buildSchema(contact).safeParse({
      ...base,
      name: 'Ada',
      email: 'a@b.com',
      message: 'hi',
      topic: 'not-an-option',
    })

    expect(result.error!.issues.map((i) => i.path[0])).toContain('topic')
  })

  it('ignores submit fields when building the shape', () => {
    const result = buildSchema(contact).safeParse({
      ...base,
      name: 'Ada',
      email: 'a@b.com',
      message: 'hi',
    })

    expect(result.success).toBe(true)
    expect(Object.keys(result.data!)).not.toContain('submit')
  })
})

describe('conditions', () => {
  it('treats a hidden field as neither visible nor required', () => {
    const budget = contact.find((f) => f.name === 'budget')!

    expect(isVisible(budget, base)).toBe(false)
    expect(isRequired(budget, base)).toBe(false)
    expect(isVisible(budget, { ...base, topic: 'sales' })).toBe(true)
    expect(isRequired(budget, { ...base, topic: 'sales' })).toBe(true)
  })
})

describe('default value resolvers', () => {
  it('seeds bare values, never key/label objects', async () => {
    const values = await resolveDefaultValues(contact)

    expect(values).toEqual(base)
    for (const value of Object.values(values)) {
      expect(['string', 'boolean']).toContain(typeof value)
    }
  })

  it('applies resolvers in order, later ones winning', async () => {
    const values = await resolveDefaultValues(contact, [
      staticValues({ name: 'from-first' }),
      staticValues({ name: 'from-second', topic: 'sales' }),
    ])

    expect(values.name).toBe('from-second')
    expect(values.topic).toBe('sales')
    expect(values.consent).toBe(false)
  })

  it('omits fields the config does not declare', async () => {
    const values = await resolveDefaultValues([{ name: 'only', type: 'text' }])

    expect(Object.keys(values)).toEqual(['only'])
  })
})

describe('field arrays and numbers', () => {
  it('seeds an empty array for a field array and undefined for a number', async () => {
    const values = await resolveDefaultValues([
      { name: 'count', type: 'number' },
      { name: 'rooms', type: 'fieldArray', fields: [{ name: 'firstName', type: 'text' }] },
    ])

    expect(values).toEqual({ count: undefined, rooms: [] })
  })

  it('accepts a valid two-level payload and keeps its bare shape', () => {
    const result = buildSchema(tripEnquiry).safeParse({
      organiser: 'Ada',
      rooms: [
        {
          travellers: [
            { firstName: 'Ada', isChild: 'no' },
            { firstName: 'Grace', isChild: 'yes', age: 9 },
          ],
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.data!.rooms).toEqual([
      {
        travellers: [
          { firstName: 'Ada', isChild: 'no' },
          { firstName: 'Grace', isChild: 'yes', age: 9 },
        ],
      },
    ])
  })

  it('reports a required error at the full nested path', () => {
    const result = buildSchema(tripEnquiry).safeParse({
      organiser: 'Ada',
      rooms: [
        {
          travellers: [
            { firstName: 'Ada', isChild: 'no' },
            { firstName: '', isChild: 'no' },
          ],
        },
      ],
    })

    expect(result.success).toBe(false)
    const issue = result.error!.issues.find((i) => i.message === 'First name is required')
    expect(issue).toBeDefined()
    expect(issue!.path).toEqual(['rooms', 0, 'travellers', 1, 'firstName'])
  })

  it('evaluates a row condition against that row, not a sibling', () => {
    const result = buildSchema(tripEnquiry).safeParse({
      organiser: 'Ada',
      rooms: [
        {
          travellers: [
            { firstName: 'Kid', isChild: 'yes' },
            { firstName: 'Adult', isChild: 'no' },
          ],
        },
      ],
    })

    expect(result.success).toBe(false)
    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0]!.path).toEqual(['rooms', 0, 'travellers', 0, 'age'])
    expect(result.error!.issues[0]!.message).toBe('Age is required')
  })

  it('throws when a row condition targets a field outside its row', () => {
    expect(() =>
      buildSchema([
        {
          name: 'rooms',
          type: 'fieldArray',
          fields: [{ name: 'age', type: 'number', showWhen: { field: 'isChild', equals: 'yes' } }],
        },
      ]),
    ).toThrow(/isChild/)
  })

  it('enforces the minimum row count with the configured message at each level', () => {
    const empty = buildSchema(tripEnquiry).safeParse({ organiser: 'Ada', rooms: [] })

    expect(empty.success).toBe(false)
    expect(empty.error!.issues[0]!.path).toEqual(['rooms'])
    expect(empty.error!.issues[0]!.message).toBe('Add at least one room')

    const nested = buildSchema(tripEnquiry).safeParse({
      organiser: 'Ada',
      rooms: [{ travellers: [] }],
    })

    expect(nested.success).toBe(false)
    expect(nested.error!.issues[0]!.path).toEqual(['rooms', 0, 'travellers'])
    expect(nested.error!.issues[0]!.message).toBe('At least 1 traveller required')
  })

  it('enforces the maximum row count with the configured message', () => {
    const travellers = Array.from({ length: 5 }, (_, i) => ({
      firstName: `T${i}`,
      isChild: 'no',
    }))

    const result = buildSchema(tripEnquiry).safeParse({
      organiser: 'Ada',
      rooms: [{ travellers }],
    })

    expect(result.success).toBe(false)
    expect(result.error!.issues.map((i) => i.message)).toContain(
      'No more than four travellers per room',
    )
  })

  it('rejects a payload the renderer could not have produced', () => {
    const stringAge = buildSchema(tripEnquiry).safeParse({
      organiser: 'Ada',
      rooms: [{ travellers: [{ firstName: 'Ada', isChild: 'yes', age: 'nine' }] }],
    })
    expect(stringAge.success).toBe(false)

    const objectRooms = buildSchema(tripEnquiry).safeParse({ organiser: 'Ada', rooms: { 0: {} } })
    expect(objectRooms.success).toBe(false)

    const wrapperRow = buildSchema(tripEnquiry).safeParse({
      organiser: 'Ada',
      rooms: [{ travellers: [{ id: 'abc', values: { firstName: 'Ada' } }] }],
    })
    expect(wrapperRow.success).toBe(false)
  })

  it('applies numeric bounds to number fields', () => {
    const fields: FieldConfig[] = [{ name: 'age', type: 'number', min: 0, max: 120 }]

    const low = buildSchema(fields).safeParse({ age: -1 })
    expect(low.error!.issues[0]!.message).toBe('Must be at least 0')

    const high = buildSchema(fields).safeParse({ age: 121 })
    expect(high.error!.issues[0]!.message).toBe('Must be at most 120')

    expect(buildSchema(fields).safeParse({ age: 42 }).success).toBe(true)
  })
})
