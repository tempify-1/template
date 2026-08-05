import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { getPayload, type Payload } from 'payload'

import { FormBlock } from '@/components/ds/section/form-block'
import { resolveForm } from '@/lib/forms/resolve-form'
import config from '@/payload.config'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterEach(cleanup)

describe('resolveForm', () => {
  it('resolves a code-defined reference to the definition a visitor is shown', async () => {
    const contact = await resolveForm('contact')

    expect(contact).not.toBeNull()
    expect(contact!.fields.map((field) => field.name)).toEqual([
      'name',
      'email',
      'subject',
      'message',
    ])
    expect(contact!.submitLabel).toBe('Send message')
    expect(contact!.summaryField).toBe('email')

    const newsletter = await resolveForm('newsletter')

    expect(newsletter).not.toBeNull()
    expect(newsletter!.fields.map((field) => field.name)).toEqual(['email', 'consent'])
  })

  it('returns null for a reference no source can resolve', async () => {
    expect(await resolveForm('bank-details')).toBeNull()
  })

  it('does not treat an inherited Object key as a form', async () => {
    for (const inherited of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__']) {
      expect(await resolveForm(inherited)).toBeNull()
    }
  })

  it('resolves a published CMS form by slug', async () => {
    const slug = `resolver-test-${Date.now()}`
    await payload.create({
      collection: 'forms',
      data: {
        name: 'Resolver test',
        slug,
        submitLabel: 'Send',
        successMessage: 'Thanks.',
        summaryField: 'email',
        fields: [
          { name: 'name', type: 'text', label: 'Name', required: true },
          { name: 'email', type: 'email', label: 'Email', required: true },
        ],
        _status: 'published',
      },
    })

    const resolved = await resolveForm(slug, payload)

    expect(resolved).not.toBeNull()
    expect(resolved!.fields.map((field) => field.name)).toEqual(['name', 'email'])
    expect(resolved!.submitLabel).toBe('Send')
    expect(resolved!.summaryField).toBe('email')
  })

  it('returns null when a CMS form is unpublished', async () => {
    const slug = `resolver-draft-${Date.now()}`
    await payload.create({
      collection: 'forms',
      data: {
        name: 'Draft test',
        slug,
        submitLabel: 'Send',
        successMessage: 'Thanks.',
        summaryField: 'email',
        fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
        _status: 'draft',
      },
    })

    expect(await resolveForm(slug, payload)).toBeNull()
  })

  it('returns null for a CMS slug that does not exist', async () => {
    expect(await resolveForm('no-such-form-exists', payload)).toBeNull()
  })
})

describe('FormBlock', () => {
  it('tells the visitor the form is unavailable rather than throwing when the reference does not resolve', () => {
    render(<FormBlock block={{ blockType: 'form', formName: 'not-a-form' }} definition={null} />)

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('no longer available')
    expect(screen.queryByRole('form')).toBeNull()
  })
})
