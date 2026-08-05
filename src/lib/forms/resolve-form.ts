import { formDefinitions, isFormName, type FormDefinition } from './definitions'

export const FORM_UNAVAILABLE_MESSAGE = 'That form is no longer available.'

export function resolveForm(reference: string): FormDefinition | null {
  return isFormName(reference) ? formDefinitions[reference] : null
}
