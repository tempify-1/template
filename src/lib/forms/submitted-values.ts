import { isVisible } from './conditions'
import { inputFields, type FieldConfig, type FormValues } from './types'

function isRow(value: unknown): value is FormValues {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function submittedValues(fields: FieldConfig[], values: FormValues): FormValues {
  const result: FormValues = {}

  for (const field of inputFields(fields)) {
    if (!isVisible(field, values)) continue

    const value = values[field.name]

    if (field.type === 'fieldArray') {
      const rows = Array.isArray(value) ? value : []
      result[field.name] = rows.map((row) =>
        isRow(row) ? submittedValues(field.fields ?? [], row) : {},
      )
      continue
    }

    result[field.name] = value
  }

  return result
}
