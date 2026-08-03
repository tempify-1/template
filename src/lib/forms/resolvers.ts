import { defaultValueFor, isInputField, type FieldConfig, type FormValues, type ValueResolver } from './types'

export function emptyValues(fields: FieldConfig[]): FormValues {
  const values: FormValues = {}
  for (const field of fields.filter(isInputField)) {
    values[field.name] = defaultValueFor(field)
  }
  return values
}

export function staticValues(seed: FormValues): ValueResolver {
  return (current) => ({ ...current, ...seed })
}

export async function resolveDefaultValues(
  fields: FieldConfig[],
  resolvers: ValueResolver[] = [],
): Promise<FormValues> {
  let values = emptyValues(fields)

  for (const resolver of resolvers) {
    const next = await resolver(values)
    values = { ...values, ...next }
  }

  return values
}
