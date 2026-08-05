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
  { name: 'label', type: 'text', label: 'Room label', required: true },
  {
    name: 'board',
    type: 'select',
    label: 'Board basis',
    required: true,
    options: [
      { label: 'Room only', value: 'room-only' },
      { label: 'Bed and breakfast', value: 'bb' },
      { label: 'Half board', value: 'half' },
      { label: 'Full board', value: 'full' },
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
  { name: 'text', type: 'text', label: 'text', required: true, placeholder: 'A plain string' },
  { name: 'email', type: 'email', label: 'email', required: true, placeholder: 'you@company.com' },
  { name: 'tel', type: 'tel', label: 'tel', placeholder: '+44 20 7946 0000' },
  {
    name: 'textarea',
    type: 'textarea',
    label: 'textarea',
    min: 10,
    description: 'Minimum ten characters, so you can watch the message appear and clear.',
  },
  {
    name: 'select',
    type: 'select',
    label: 'select',
    required: true,
    options: [
      { label: 'First', value: 'first' },
      { label: 'Second', value: 'second' },
      { label: 'Third (disabled)', value: 'third', disabled: true },
    ],
  },
  { name: 'checkbox', type: 'checkbox', label: 'checkbox' },
  {
    name: 'number',
    type: 'number',
    label: 'number',
    min: 1,
    max: 10,
    description: 'Stored as a number, not a string.',
  },
  {
    name: 'conditionalText',
    type: 'text',
    label: 'conditional text',
    showWhen: { field: 'checkbox', equals: 'true' },
    requiredWhen: { field: 'checkbox', equals: 'true' },
    description: 'Appears only when the checkbox above is ticked, and is required once it does.',
  },
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
        { label: 'Double, bed and breakfast', value: 'double-bb', data: { board: 'bb' } },
        { label: 'Twin, half board', value: 'twin-half', data: { board: 'half' } },
        { label: 'Single, room only', value: 'single-ro', data: { board: 'room-only' } },
      ],
    },
  },
]
