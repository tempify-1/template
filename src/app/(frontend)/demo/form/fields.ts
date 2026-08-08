import type { FieldConfig } from '@/lib/forms/types'

const traveller: FieldConfig[] = [
  { name: 'name', type: 'text', label: 'Full name', required: true, autocomplete: 'name' },
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

const DESTINATIONS = [
  { label: 'Lisbon', value: 'lis' },
  { label: 'Ljubljana', value: 'lju' },
  { label: 'London', value: 'lon' },
  { label: 'Lyon', value: 'lyo' },
  { label: 'Madrid', value: 'mad' },
  { label: 'Marrakesh', value: 'rak' },
]

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('aborted', 'AbortError'))
    })
  })

const destinationSource = async (query: string, signal: AbortSignal) => {
  await delay(250, signal)
  if (query.toLowerCase() === 'error') throw new Error('stub failure')
  return DESTINATIONS.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  )
}

const EXTRAS = [
  { label: 'Airport transfer', value: 'transfer' },
  { label: 'Cot', value: 'cot' },
  { label: 'Late checkout', value: 'late-checkout' },
  { label: 'Sea view upgrade', value: 'sea-view' },
]

const extrasSource = async (query: string, signal: AbortSignal) => {
  await delay(250, signal)
  return EXTRAS.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
}

export const allFieldsForm: FieldConfig[] = [
  {
    name: 'destination',
    type: 'searchableSelect',
    label: 'Destination',
    placeholder: 'Search destinations…',
    required: true,
    options: DESTINATIONS,
  },
  {
    name: 'destinationAsync',
    type: 'searchableSelect',
    label: 'Destination (live search)',
    placeholder: 'Type to search…',
    optionSource: destinationSource,
    description: 'Options load from a stub source with an artificial delay.',
  },
  {
    name: 'extras',
    type: 'combobox',
    label: 'Extras',
    singularLabel: 'extra',
    editableOptions: false,
    optionSource: extrasSource,
    placeholder: 'Type to add extras',
  },
  {
    name: 'rooms',
    type: 'combobox',
    label: 'Rooms',
    singularLabel: 'room',
    required: true,
    requiredMessage: 'Add at least one room',
    max: 4,
    reselectOptions: true,
    options: [
      { label: 'Double', value: 'double' },
      { label: 'Twin', value: 'twin' },
      { label: 'Single', value: 'single' },
      { label: 'Suite', value: 'suite' },
    ],
    cardDisplay: {
      title: 'label',
      chips: [{ field: 'board' }],
      showCompletionStatus: true,
    },
    fields: [
      {
        name: 'board',
        type: 'select',
        label: 'Board basis',
        required: true,
        options: [
          { label: 'Bed and breakfast', value: 'bb' },
          { label: 'Half board', value: 'hb' },
          { label: 'Room only', value: 'ro' },
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
    ],
  },
  {
    name: 'phone',
    type: 'tel',
    label: 'Contact phone',
    autocomplete: 'tel',
    inputmode: 'tel',
    enableWhen: { field: 'rooms', exists: true },
    description: 'Enabled once a room is added; disabled it never reaches the payload.',
  },
  {
    name: 'partyRooms',
    type: 'fieldArray',
    label: 'Party room',
    max: 3,
    fields: [
      {
        name: 'travellers',
        type: 'combobox',
        label: 'Travellers',
        singularLabel: 'traveller',
        required: true,
        reselectOptions: true,
        draggable: true,
        options: [
          { label: 'Adult', value: 'adult' },
          { label: 'Child', value: 'child' },
          { label: 'Infant', value: 'infant' },
        ],
        cardDisplay: { showCompletionStatus: true },
        fields: [
          {
            name: 'firstName',
            type: 'text',
            label: 'First name',
            required: true,
            autocomplete: 'given-name',
          },
          {
            name: 'middleName',
            type: 'text',
            label: 'Middle name',
            autocomplete: 'additional-name',
          },
          {
            name: 'lastName',
            type: 'text',
            label: 'Last name',
            required: true,
            autocomplete: 'family-name',
          },
        ],
      },
    ],
  },
  { name: 'submit', type: 'submit', label: 'Submit enquiry' },
]
