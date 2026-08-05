import { describe, expect, it } from 'vitest'

import { tripEnquiry } from '../helpers/form-fixtures'
import { hiddenValues, submittedValues } from '@/lib/forms/submitted-values'
import type { FieldConfig } from '@/lib/forms/types'

const fields: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Name' },
  { name: 'wantsCall', type: 'checkbox', label: 'Call me' },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone',
    showWhen: { field: 'wantsCall', equals: 'true' },
  },
  { name: 'submit', type: 'submit', label: 'Send' },
]

describe('submittedValues', () => {
  it('keeps a field whose condition holds', () => {
    expect(submittedValues(fields, { name: 'Ada', wantsCall: true, phone: '0200' })).toEqual({
      name: 'Ada',
      wantsCall: true,
      phone: '0200',
    })
  })

  it('drops a field whose condition does not hold, even when it carries a value', () => {
    expect(submittedValues(fields, { name: 'Ada', wantsCall: false, phone: '0200' })).toEqual({
      name: 'Ada',
      wantsCall: false,
    })
  })

  it('drops a key that is not a field in the form', () => {
    expect(submittedValues(fields, { name: 'Ada', wantsCall: false, smuggled: 'x' })).toEqual({
      name: 'Ada',
      wantsCall: false,
    })
  })

  it('carries a value the visitor never touched, so seeded rows survive', () => {
    expect(submittedValues(fields, { name: '', wantsCall: false })).toEqual({
      name: '',
      wantsCall: false,
    })
  })

  it('never emits a submit field', () => {
    expect(Object.keys(submittedValues(fields, { name: 'Ada', wantsCall: false }))).not.toContain(
      'submit',
    )
  })

  it('evaluates a row condition against that row, not the form root', () => {
    const result = submittedValues(tripEnquiry, {
      organiser: 'Ada',
      rooms: [
        {
          travellers: [
            { firstName: 'Adult', isChild: 'no', age: 44 },
            { firstName: 'Child', isChild: 'yes', age: 8 },
          ],
        },
      ],
    })

    expect(result).toEqual({
      organiser: 'Ada',
      rooms: [
        {
          travellers: [
            { firstName: 'Adult', isChild: 'no' },
            { firstName: 'Child', isChild: 'yes', age: 8 },
          ],
        },
      ],
    })
  })

  it('drops a hidden field array entirely', () => {
    const conditional: FieldConfig[] = [
      { name: 'wantsRooms', type: 'checkbox', label: 'Rooms?' },
      {
        name: 'rooms',
        type: 'fieldArray',
        label: 'Room',
        showWhen: { field: 'wantsRooms', equals: 'true' },
        fields: [{ name: 'label', type: 'text', label: 'Label' }],
      },
    ]

    expect(submittedValues(conditional, { wantsRooms: false, rooms: [{ label: 'Sea view' }] })).toEqual(
      { wantsRooms: false },
    )
  })

  it('emits an empty array for a visible field array with no rows', () => {
    expect(submittedValues(tripEnquiry, { organiser: 'Ada' })).toEqual({
      organiser: 'Ada',
      rooms: [],
    })
  })

  it('keeps a dot-path field nested, rather than dropping it', () => {
    const dotted: FieldConfig[] = [
      { name: 'address.city', type: 'text', label: 'City' },
      { name: 'address.postcode', type: 'text', label: 'Postcode' },
      { name: 'billingSame', type: 'checkbox', label: 'Billing same' },
    ]

    expect(
      submittedValues(dotted, {
        address: { city: 'Leeds', postcode: 'LS1' },
        billingSame: true,
      }),
    ).toEqual({ address: { city: 'Leeds', postcode: 'LS1' }, billingSame: true })
  })

  it('drops a dot-path field whose condition does not hold, keeping its siblings', () => {
    const dotted: FieldConfig[] = [
      { name: 'address.city', type: 'text', label: 'City' },
      {
        name: 'address.postcode',
        type: 'text',
        label: 'Postcode',
        showWhen: { field: 'billingSame', equals: 'true' },
      },
      { name: 'billingSame', type: 'checkbox', label: 'Billing same' },
    ]

    expect(
      submittedValues(dotted, {
        address: { city: 'Leeds', postcode: 'LS1' },
        billingSame: false,
      }),
    ).toEqual({ address: { city: 'Leeds' }, billingSame: false })
  })
})

describe('hiddenValues', () => {
  it('reports a hidden field that still holds a value, with the empty to reset it to', () => {
    expect(hiddenValues(fields, { name: 'Ada', wantsCall: false, phone: '0200' })).toEqual([
      { path: 'phone', empty: '' },
    ])
  })

  it('reports nothing when the hidden field is already empty', () => {
    expect(hiddenValues(fields, { name: 'Ada', wantsCall: false, phone: '' })).toEqual([])
  })

  it('reports nothing when the field is visible', () => {
    expect(hiddenValues(fields, { name: 'Ada', wantsCall: true, phone: '0200' })).toEqual([])
  })

  it('reports a hidden field inside a row at that row index only', () => {
    expect(
      hiddenValues(tripEnquiry, {
        organiser: 'Ada',
        rooms: [
          {
            travellers: [
              { firstName: 'Adult', isChild: 'no', age: 44 },
              { firstName: 'Child', isChild: 'yes', age: 8 },
            ],
          },
        ],
      }),
    ).toEqual([{ path: 'rooms.0.travellers.0.age', empty: undefined }])
  })

  it('reports a hidden field array so its rows are cleared, not retained', () => {
    const conditional: FieldConfig[] = [
      { name: 'wantsRooms', type: 'checkbox', label: 'Rooms?' },
      {
        name: 'rooms',
        type: 'fieldArray',
        label: 'Room',
        showWhen: { field: 'wantsRooms', equals: 'true' },
        fields: [{ name: 'label', type: 'text', label: 'Label' }],
      },
    ]

    expect(hiddenValues(conditional, { wantsRooms: false, rooms: [{ label: 'Sea view' }] })).toEqual(
      [{ path: 'rooms', empty: [] }],
    )
  })
})
