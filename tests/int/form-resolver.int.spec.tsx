import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { FormBlock } from '@/components/ds/section/form-block'
import { resolveForm } from '@/lib/forms/resolve-form'

afterEach(cleanup)

describe('resolveForm', () => {
  it('resolves a code-defined reference to the definition a visitor is shown', () => {
    const contact = resolveForm('contact')

    expect(contact).not.toBeNull()
    expect(contact!.fields.map((field) => field.name)).toEqual([
      'name',
      'email',
      'subject',
      'message',
    ])
    expect(contact!.submitLabel).toBe('Send message')
    expect(contact!.summaryField).toBe('email')

    const newsletter = resolveForm('newsletter')

    expect(newsletter).not.toBeNull()
    expect(newsletter!.fields.map((field) => field.name)).toEqual(['email', 'consent'])
  })

  it('returns null for a reference no source can resolve', () => {
    expect(resolveForm('bank-details')).toBeNull()
  })

  it('does not treat an inherited Object key as a form', () => {
    for (const inherited of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__']) {
      expect(resolveForm(inherited)).toBeNull()
    }
  })
})

describe('FormBlock', () => {
  it('tells the visitor the form is unavailable rather than throwing when the reference does not resolve', () => {
    render(<FormBlock block={{ blockType: 'form', formName: 'not-a-form' as never }} />)

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('no longer available')
    expect(screen.queryByRole('form')).toBeNull()
  })
})
