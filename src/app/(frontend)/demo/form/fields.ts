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
    name: 'title',
    type: 'select',
    label: 'Title',
    optionsFrom: {
      field: 'ageBand',
      map: {
        adult: [
          { label: 'Mr', value: 'mr' },
          { label: 'Ms', value: 'ms' },
          { label: 'Dr', value: 'dr' },
        ],
        child: [
          { label: 'Master', value: 'master' },
          { label: 'Miss', value: 'miss' },
        ],
        infant: [
          { label: 'Master', value: 'master' },
          { label: 'Miss', value: 'miss' },
        ],
      },
    },
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
    name: 'tripStep',
    type: 'step',
    label: 'Trip',
    wizard: { confetti: true },
    fields: [
  {
    name: 'tripBasics',
    type: 'fieldset',
    label: 'Trip basics',
    description: 'Grouping changes presentation, never paths or payloads.',
    fields: [
      {
        name: 'destination',
        type: 'searchableSelect',
        label: 'Destination',
        placeholder: 'Search destinations…',
        required: true,
        options: DESTINATIONS,
      },
      {
        name: 'travelStyle',
        type: 'radioCards',
        label: 'Travel style',
        options: [
          { label: 'Relax', value: 'relax', description: 'Beaches and spas', icon: 'Umbrella' },
          { label: 'Explore', value: 'explore', description: 'Cities and trails', icon: 'Compass' },
          { label: 'Family', value: 'family', description: 'Something for everyone', icon: 'Users' },
        ],
      },
      {
        name: 'season',
        type: 'radioTabs',
        label: 'Season',
        options: [
          { label: 'Spring', value: 'spring' },
          { label: 'Summer', value: 'summer' },
          { label: 'Autumn', value: 'autumn' },
        ],
      },
      {
        name: 'boards',
        type: 'checkboxCards',
        label: 'Board options you would consider',
        max: 2,
        options: [
          { label: 'Bed & breakfast', value: 'bb', description: 'Breakfast included' },
          { label: 'Half board', value: 'hb', description: 'Breakfast and dinner' },
          { label: 'All inclusive', value: 'ai', description: 'Everything covered' },
        ],
      },
      {
        name: 'destinationAsync',
        type: 'searchableSelect',
        label: 'Destination (live search)',
        placeholder: 'Type to search…',
        optionSource: destinationSource,
        description: 'Options load from a stub source with an artificial delay.',
      },
    ],
  },
  {
    name: 'optionalExtras',
    type: 'accordion',
    label: 'Optional extras',
    fields: [
      {
        name: 'extras',
        type: 'combobox',
        label: 'Extras',
        singularLabel: 'extra',
        editableOptions: false,
        optionSource: extrasSource,
        placeholder: 'Type to add extras',
      },
    ],
  },
    ],
  },
  {
    name: 'partyStep',
    type: 'step',
    label: 'Rooms & party',
    fields: [
  {
    name: 'rooms',
    type: 'combobox',
    label: 'Rooms',
    singularLabel: 'room',
    draggable: true,
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
    type: 'cardArray',
    label: 'Party room',
    singularLabel: 'Party room',
    draggable: true,
    max: 3,
    cardDisplay: {
      showCompletionStatus: true,
      description: [
        { text: 'Travellers assigned', showWhen: { field: 'travellers', exists: true } },
        { text: 'No travellers yet', showWhen: { field: 'travellers', exists: false } },
      ],
    },
    picker: {
      label: 'party size',
      options: [
        {
          label: 'Couple',
          value: 'couple',
          data: {
            travellers: [
              { value: 'adult', label: 'Adult' },
              { value: 'adult', label: 'Adult' },
            ],
          },
        },
        {
          label: 'Solo traveller',
          value: 'solo',
          data: { travellers: [{ value: 'adult', label: 'Adult' }] },
        },
      ],
    },
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
  {
    name: 'bunkRooms',
    type: 'fieldArray',
    label: 'Bunk room',
    max: 2,
    fields: [
      {
        name: 'sleepers',
        type: 'combobox',
        label: 'Sleepers',
        singularLabel: 'sleeper',
        reselectOptions: true,
        editableOptions: false,
        options: [
          { label: 'Adult', value: 'adult' },
          { label: 'Child', value: 'child' },
        ],
      },
    ],
  },
    ],
  },
  {
    name: 'detailsStep',
    type: 'step',
    label: 'Details',
    fields: [
      {
        name: 'intro',
        type: 'paragraph',
        description: 'Almost done — a few account details and preferences.',
      },
      {
        name: 'holdWarning',
        type: 'alert',
        label: 'Heads up:',
        severity: 'warning',
        description: 'Rooms are held for 20 minutes.',
      },
      { name: 'tripName', type: 'text', label: 'Trip name', placeholder: 'Summer escape' },
      {
        name: 'tripSlug',
        type: 'slug',
        label: 'Trip link',
        slugFrom: 'tripName',
        description: 'Derived from the trip name until you edit it.',
      },
      {
        name: 'accountPassword',
        type: 'password',
        label: 'Account password',
        autocomplete: 'new-password',
        minLength: 8,
      },
      { name: 'marketingOptIn', type: 'switch', label: 'Send me offers' },
      { name: 'brandColor', type: 'color', label: 'Trip colour' },
      {
        name: 'budget',
        type: 'price',
        label: 'Budget per night',
        currency: 'AUD',
      },
      {
        name: 'amenities',
        type: 'multiSelect',
        label: 'Must-have amenities',
        max: 3,
        options: [
          { label: 'Pool', value: 'pool' },
          { label: 'Gym', value: 'gym' },
          { label: 'Spa', value: 'spa' },
          { label: 'Parking', value: 'parking' },
        ],
      },
      { name: 'checkIn', type: 'date', label: 'Check-in date' },
      { name: 'stay', type: 'dateRange', label: 'Stay window' },
      {
        name: 'flexibility',
        type: 'range',
        label: 'Date flexibility (days)',
        min: 0,
        max: 10,
        step: 1,
      },
      {
        name: 'roomCounts',
        type: 'numberPickerTable',
        label: 'Rooms by type',
        max: 5,
        options: [
          { label: 'Standard', value: 'standard', description: 'Queen bed, courtyard view' },
          { label: 'Deluxe', value: 'deluxe', description: 'King bed, sea view' },
        ],
      },
      {
        name: 'transfers',
        type: 'numberPickerCards',
        label: 'Transfers',
        max: 4,
        options: [
          { label: 'Airport pickup', value: 'airport', icon: 'Plane' },
          { label: 'Station pickup', value: 'station', icon: 'TrainFront' },
        ],
      },
      { name: 'campaign', type: 'hidden' },
    ],
  },
  { name: 'submit', type: 'submit', label: 'Submit enquiry' },
]
