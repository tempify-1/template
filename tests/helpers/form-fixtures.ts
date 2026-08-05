import type { FieldConfig } from '@/lib/forms/types'

export const tripEnquiry: FieldConfig[] = [
  { name: 'organiser', type: 'text', label: 'Organiser', required: true },
  {
    name: 'rooms',
    type: 'fieldArray',
    label: 'Room',
    min: 1,
    minMessage: 'Add at least one room',
    fields: [
      {
        name: 'travellers',
        type: 'fieldArray',
        label: 'Traveller',
        min: 1,
        max: 4,
        maxMessage: 'No more than four travellers per room',
        fields: [
          { name: 'firstName', type: 'text', label: 'First name', required: true },
          {
            name: 'isChild',
            type: 'select',
            label: 'Child?',
            options: [
              { label: 'No', value: 'no' },
              { label: 'Yes', value: 'yes' },
            ],
          },
          {
            name: 'age',
            type: 'number',
            label: 'Age',
            required: true,
            showWhen: { field: 'isChild', equals: 'yes' },
          },
        ],
      },
    ],
  },
]
