import { describe, it, expect } from 'vitest'

import { buildSchema } from '@/lib/forms/schema-builder'
import { resolveDefaultValues, staticValues } from '@/lib/forms/resolvers'
import { isRequired, isVisible } from '@/lib/forms/conditions'
import type { FieldConfig } from '@/lib/forms/types'

const contact: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Name', required: true },
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'topic', type: 'select', label: 'Topic', options: [{ label: 'Sales', value: 'sales' }] },
  { name: 'budget', type: 'text', label: 'Budget', required: true, showWhen: { field: 'topic', equals: 'sales' } },
  { name: 'message', type: 'textarea', label: 'Message', requiredWhen: { field: 'name', notEmpty: true } },
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
    const result = buildSchema(contact).safeParse({ ...base, name: 'Ada', email: 'a@b.com', message: 'hi' })

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
    const bad = buildSchema(contact).safeParse({ ...base, name: 'Ada', email: 'nope', message: 'hi' })
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
    const result = buildSchema(contact).safeParse({ ...base, name: 'Ada', email: 'a@b.com', message: 'hi' })

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
