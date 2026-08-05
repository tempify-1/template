import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'

import { tripEnquiry } from '../helpers/form-fixtures'
import { ConfigForm } from '@/components/ds/form/config-form'
import type { FieldConfig } from '@/lib/forms/types'

afterEach(cleanup)

const fields: FieldConfig[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Your name',
    description: 'As you would like it read',
    required: true,
  },
  { name: 'email', type: 'email', label: 'Email', required: true },
  {
    name: 'detail',
    type: 'textarea',
    label: 'Detail',
    showWhen: { field: 'name', notEmpty: true },
  },
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

const oneTraveller = {
  organiser: '',
  rooms: [{ travellers: [{ firstName: 'Ada', isChild: 'no' }] }],
}

describe('ConfigForm field arrays', () => {
  it('renders the rows given in default values, nesting to two levels', () => {
    render(<ConfigForm fields={tripEnquiry} defaultValues={oneTraveller} onSubmit={vi.fn()} />)

    const room = screen.getByRole('group', { name: 'Room 1' })
    const traveller = within(room).getByRole('group', { name: 'Traveller 1' })
    expect(within(traveller).getByLabelText('First name')).toHaveProperty('value', 'Ada')
  })

  it('adds a row to a group when its add control is pressed', async () => {
    render(<ConfigForm fields={tripEnquiry} defaultValues={oneTraveller} onSubmit={vi.fn()} />)

    const room = screen.getByRole('group', { name: 'Room 1' })
    fireEvent.click(within(room).getByRole('button', { name: 'Add Traveller' }))

    await waitFor(() => {
      expect(within(room).getByRole('group', { name: 'Traveller 2' })).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add Room' }))

    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Room 2' })).toBeDefined()
    })
  })

  it('removes a row and its values, so a submission never carries a deleted row', async () => {
    const onSubmit = vi.fn()
    render(
      <ConfigForm
        fields={tripEnquiry}
        defaultValues={{
          organiser: 'Ada',
          rooms: [
            {
              travellers: [
                { firstName: 'First', isChild: 'no' },
                { firstName: 'Second', isChild: 'no' },
              ],
            },
          ],
        }}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Remove Traveller 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]![0]).toEqual({
      organiser: 'Ada',
      rooms: [{ travellers: [{ firstName: 'Second', isChild: 'no' }] }],
    })
  })

  it('reorders rows when the move controls are pressed', async () => {
    const onSubmit = vi.fn()
    render(
      <ConfigForm
        fields={tripEnquiry}
        defaultValues={{
          organiser: 'Ada',
          rooms: [
            {
              travellers: [
                { firstName: 'First', isChild: 'no' },
                { firstName: 'Second', isChild: 'no' },
              ],
            },
          ],
        }}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Move Traveller 2 up' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const rooms = onSubmit.mock.calls[0]![0].rooms as { travellers: { firstName: string }[] }[]
    expect(rooms[0]!.travellers.map((t) => t.firstName)).toEqual(['Second', 'First'])
  })

  it('evaluates a row condition against that row and not a sibling', async () => {
    const childFixture: FieldConfig[] = [
      {
        name: 'travellers',
        type: 'fieldArray',
        label: 'Traveller',
        fields: [
          { name: 'firstName', type: 'text', label: 'First name', required: true },
          { name: 'isChild', type: 'checkbox', label: 'Child' },
          {
            name: 'age',
            type: 'number',
            label: 'Age',
            required: true,
            showWhen: { field: 'isChild', equals: 'true' },
          },
        ],
      },
    ]

    render(
      <ConfigForm
        fields={childFixture}
        defaultValues={{
          travellers: [
            { firstName: 'Kid', isChild: false },
            { firstName: 'Adult', isChild: false },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    )

    const first = screen.getByRole('group', { name: 'Traveller 1' })
    const second = screen.getByRole('group', { name: 'Traveller 2' })

    fireEvent.click(within(first).getByRole('checkbox', { name: 'Child' }))

    await waitFor(() => {
      expect(within(first).queryByLabelText('Age')).not.toBeNull()
      expect(within(second).queryByLabelText('Age')).toBeNull()
    })
  })

  it('shows a validation error against the field inside that row', async () => {
    render(
      <ConfigForm
        fields={tripEnquiry}
        defaultValues={{
          organiser: 'Ada',
          rooms: [
            {
              travellers: [
                { firstName: 'Ada', isChild: 'no' },
                { firstName: '', isChild: 'no' },
              ],
            },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    const second = screen.getByRole('group', { name: 'Traveller 2' })
    await waitFor(() => {
      expect(within(second).getByText('First name is required')).toBeDefined()
    })
    expect(
      within(screen.getByRole('group', { name: 'Traveller 1' })).queryByText(
        'First name is required',
      ),
    ).toBeNull()
  })

  it('submits bare arrays of plain objects with no identity records', async () => {
    const onSubmit = vi.fn()
    render(<ConfigForm fields={tripEnquiry} defaultValues={oneTraveller} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Organiser'), { target: { value: 'Ada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const submitted = onSubmit.mock.calls[0]![0]
    expect(submitted).toEqual({
      organiser: 'Ada',
      rooms: [{ travellers: [{ firstName: 'Ada', isChild: 'no' }] }],
    })

    const rows = submitted.rooms as Record<string, unknown>[]
    const travellerRows = rows[0]!.travellers as Record<string, unknown>[]
    for (const row of [...rows, ...travellerRows]) {
      expect(Object.keys(row)).not.toContain('id')
    }
  })

  it('reports the minimum when submitting below it', async () => {
    render(
      <ConfigForm
        fields={tripEnquiry}
        defaultValues={{ organiser: 'Ada', rooms: [] }}
        onSubmit={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(screen.getByText('Add at least one room')).toBeDefined()
    })
  })

  it('prevents adding beyond the maximum', () => {
    render(
      <ConfigForm
        fields={tripEnquiry}
        defaultValues={{
          organiser: 'Ada',
          rooms: [
            {
              travellers: [
                { firstName: 'A', isChild: 'no' },
                { firstName: 'B', isChild: 'no' },
                { firstName: 'C', isChild: 'no' },
                { firstName: 'D', isChild: 'no' },
              ],
            },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Add Traveller' }).hasAttribute('disabled')).toBe(
      true,
    )
  })
})

describe('ConfigForm field array picker', () => {
  const pickerFields: FieldConfig[] = [
    {
      name: 'guests',
      type: 'fieldArray',
      label: 'Guest',
      max: 2,
      fields: [{ name: 'name', type: 'text', label: 'Name' }],
      picker: {
        label: 'Presets',
        options: [
          { label: 'Ada', value: 'ada', data: { name: 'Ada Lovelace' } },
          { label: 'Grace', value: 'grace', data: { name: 'Grace Hopper' } },
        ],
      },
    },
  ]

  it('adds several rows at once from the picker', async () => {
    render(<ConfigForm fields={pickerFields} defaultValues={{ guests: [] }} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add from Presets' }))

    const dialog = await waitFor(() => screen.getByRole('dialog'))
    fireEvent.click(within(dialog).getByText('Ada'))
    fireEvent.click(within(dialog).getByText('Grace'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add 2 selected' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    const guest1 = screen.getByRole('group', { name: 'Guest 1' })
    const guest2 = screen.getByRole('group', { name: 'Guest 2' })
    expect(within(guest1).getByLabelText('Name')).toHaveProperty('value', 'Ada Lovelace')
    expect(within(guest2).getByLabelText('Name')).toHaveProperty('value', 'Grace Hopper')
  })

  it('does not add rows when the picker is cancelled', async () => {
    render(<ConfigForm fields={pickerFields} defaultValues={{ guests: [] }} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add from Presets' }))

    const dialog = await waitFor(() => screen.getByRole('dialog'))
    fireEvent.click(within(dialog).getByText('Ada'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.queryByRole('group', { name: 'Guest 1' })).toBeNull()
  })

  it('disables the picker button once the array is at the configured maximum', () => {
    render(
      <ConfigForm
        fields={pickerFields}
        defaultValues={{
          guests: [{ name: 'One' }, { name: 'Two' }],
        }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Add from Presets' }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('adds rows in the order they were selected', async () => {
    render(<ConfigForm fields={pickerFields} defaultValues={{ guests: [] }} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add from Presets' }))

    const dialog = await waitFor(() => screen.getByRole('dialog'))
    fireEvent.click(within(dialog).getByText('Grace'))
    fireEvent.click(within(dialog).getByText('Ada'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add 2 selected' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    const guest1 = screen.getByRole('group', { name: 'Guest 1' })
    const guest2 = screen.getByRole('group', { name: 'Guest 2' })
    expect(within(guest1).getByLabelText('Name')).toHaveProperty('value', 'Grace Hopper')
    expect(within(guest2).getByLabelText('Name')).toHaveProperty('value', 'Ada Lovelace')
  })

  it('ignores disabled picker options', async () => {
    const withDisabled: FieldConfig[] = [
      {
        name: 'guests',
        type: 'fieldArray',
        label: 'Guest',
        fields: [{ name: 'name', type: 'text', label: 'Name' }],
        picker: {
          options: [
            { label: 'Ada', value: 'ada', data: { name: 'Ada Lovelace' } },
            { label: 'Unavailable', value: 'unavailable', disabled: true, data: { name: 'X' } },
          ],
        },
      },
    ]

    render(<ConfigForm fields={withDisabled} defaultValues={{ guests: [] }} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add from Guest' }))

    const dialog = await waitFor(() => screen.getByRole('dialog'))
    const unavailable = within(dialog).getByRole('checkbox', { name: 'Unavailable' })
    expect(unavailable.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(within(dialog).getByText('Ada'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add 1 selected' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('group', { name: 'Guest 1' })).toBeDefined()
  })
})
