import type { FieldConfig } from './types'

export interface FormDefinition {
  fields: FieldConfig[]
  submitLabel: string
  successMessage: string
  summaryField: string
}

const contact: FormDefinition = {
  submitLabel: 'Send message',
  successMessage: 'Thanks — we have your message and will reply shortly.',
  summaryField: 'email',
  fields: [
    { name: 'name', type: 'text', label: 'Your name', required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
    { name: 'subject', type: 'text', label: 'Subject', required: true },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      required: true,
      min: 10,
      description: 'Tell us what you need. A sentence or two is plenty.',
    },
  ],
}

const newsletter: FormDefinition = {
  submitLabel: 'Subscribe',
  successMessage: 'You are on the list. Check your inbox to confirm.',
  summaryField: 'email',
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      required: true,
      placeholder: 'you@company.com',
    },
    { name: 'consent', type: 'checkbox', label: 'Send me occasional product updates' },
  ],
}

export const formDefinitions = { contact, newsletter } as const

export type FormName = keyof typeof formDefinitions

export const FORM_NAMES = Object.keys(formDefinitions) as [FormName, ...FormName[]]

export function isFormName(value: string): value is FormName {
  return Object.hasOwn(formDefinitions, value)
}
