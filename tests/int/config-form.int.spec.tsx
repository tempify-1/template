import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

import { ConfigForm } from '@/components/ds/form/config-form'
import type { FieldConfig } from '@/lib/forms/types'

afterEach(cleanup)

const fields: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Your name', description: 'As you would like it read', required: true },
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'detail', type: 'textarea', label: 'Detail', showWhen: { field: 'name', notEmpty: true } },
  { name: 'consent', type: 'checkbox', label: 'Keep me posted' },
  { name: 'submit', type: 'submit', label: 'Send it' },
]

const defaults = { name: '', email: '', detail: '', consent: false }

function renderForm(onSubmit = vi.fn()) {
  render(<ConfigForm fields={fields} defaultValues={defaults} onSubmit={onSubmit} />)
  return onSubmit
}

describe('ConfigForm', () => {
  it('renders a label and description per field, and the submit label from config', () => {
    renderForm()

    expect(screen.getByText('Your name')).toBeDefined()
    expect(screen.getByText('As you would like it read')).toBeDefined()
    expect(screen.getByText('Email')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Send it' })).toBeDefined()
  })

  it('does not render a field whose showWhen condition is unmet', () => {
    renderForm()

    expect(screen.queryByText('Detail')).toBeNull()
  })

  it('renders that field once the condition holds', async () => {
    renderForm()

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ada' } })

    await waitFor(() => expect(screen.queryByText('Detail')).not.toBeNull())
  })

  it('shows a message naming the field when a required value is missing', async () => {
    const onSubmit = renderForm()

    fireEvent.click(screen.getByRole('button', { name: 'Send it' }))

    await waitFor(() => {
      expect(screen.getByText('Your name is required')).toBeDefined()
      expect(screen.getByText('Email is required')).toBeDefined()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a malformed email with a readable message', async () => {
    renderForm()

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nope' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send it' }))

    await waitFor(() => expect(screen.getByText('Enter a valid email address')).toBeDefined())
  })

  it('submits bare values, never key/label objects', async () => {
    const onSubmit = renderForm()

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send it' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))

    const submitted = onSubmit.mock.calls[0]![0] as Record<string, unknown>
    expect(submitted.name).toBe('Ada')
    expect(submitted.email).toBe('ada@example.com')
    expect(submitted.consent).toBe(false)
    for (const value of Object.values(submitted)) {
      expect(['string', 'boolean']).toContain(typeof value)
    }
  })
})

describe('two ConfigForms on one page', () => {
  it('gives each control a document-unique id so labels do not cross forms', () => {
    render(
      <>
        <ConfigForm fields={fields} defaultValues={defaults} onSubmit={vi.fn()} />
        <ConfigForm fields={fields} defaultValues={defaults} onSubmit={vi.fn()} />
      </>,
    )

    const ids = screen.getAllByLabelText('Email').map((input) => input.id)

    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
    expect(ids.every(Boolean)).toBe(true)
  })

  it('points each description at the control in its own form', () => {
    render(
      <>
        <ConfigForm fields={fields} defaultValues={defaults} onSubmit={vi.fn()} />
        <ConfigForm fields={fields} defaultValues={defaults} onSubmit={vi.fn()} />
      </>,
    )

    const describedBy = screen
      .getAllByLabelText('Your name')
      .map((input) => input.getAttribute('aria-describedby'))

    expect(describedBy[0]).not.toBe(describedBy[1])
    for (const id of describedBy) {
      expect(document.getElementById(id!)?.textContent).toBe('As you would like it read')
    }
  })
})
