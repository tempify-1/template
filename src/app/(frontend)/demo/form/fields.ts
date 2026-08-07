import type { FieldConfig } from '@/lib/forms/types'

const traveller: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Full name', required: true },
  {
    name: 'ageBand',
    type: 'select',
    label: 'Age band',
    required: true,
    options: [
      { label: 'Adult', value: 'adult' },
      { label: 'Child', value: 'child' },
      { label: 'Infant', value: 'infant' },
    ],
  },
  {
    name: 'age',
    type: 'number',
    label: 'Age',
    min: 0,
    max: 17,
    showWhen: { field: 'ageBand', equals: 'child' },
    requiredWhen: { field: 'ageBand', equals: 'child' },
    description: 'Only asked for children, and only then is it required.',
  },
  {
    name: 'requirements',
    type: 'textarea',
    label: 'Dietary or access requirements',
    placeholder: 'Optional',
  },
]

const room: FieldConfig[] = [
  {
    name: 'type',
    type: 'combobox',
    label: 'Room type',
    required: true,
    options: [
      { label: 'Double', value: 'double' },
      { label: 'Twin', value: 'twin' },
      { label: 'Single', value: 'single' },
      { label: 'Suite', value: 'suite' },
    ],
  },
  {
    name: 'travellers',
    type: 'fieldArray',
    label: 'Traveller',
    min: 1,
    max: 6,
    fields: traveller,
    picker: {
      label: 'party template',
      options: [
        { label: 'Two adults', value: 'two-adults', data: { ageBand: 'adult' } },
        { label: 'One adult', value: 'one-adult', data: { ageBand: 'adult' } },
        { label: 'One child (age 8)', value: 'child-8', data: { ageBand: 'child', age: 8 } },
        { label: 'One infant', value: 'infant', data: { ageBand: 'infant' } },
      ],
    },
  },
]

export const allFieldsForm: FieldConfig[] = [
  {
    name: 'rooms',
    type: 'fieldArray',
    label: 'Room',
    min: 1,
    max: 4,
    fields: room,
    picker: {
      label: 'room type',
      options: [
        { label: 'Double, bed and breakfast', value: 'double-bb', data: { type: 'double' } },
        { label: 'Twin, half board', value: 'twin-half', data: { type: 'twin' } },
        { label: 'Single, room only', value: 'single-ro', data: { type: 'single' } },
      ],
    },
  },
]