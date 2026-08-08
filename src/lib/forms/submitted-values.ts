import { isVisible, isEnabled } from './conditions'
import { getAtPath, setAtPath } from './paths'
import { inputFields, defaultValueFor, type FieldConfig, type FormValues } from './types'

function isRow(value: unknown): value is FormValues {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function submittedValues(fields: FieldConfig[], values: FormValues): FormValues {
  const result: Record<string, unknown> = {}

  for (const field of inputFields(fields)) {
    if (!isVisible(field, values)) continue
    if (!isEnabled(field, values)) continue

    const value = getAtPath(values, field.name)

    if (field.type === 'fieldArray' || field.type === 'combobox' || field.type === 'cardArray') {
      const rows = Array.isArray(value) ? value : []
      setAtPath(
        result,
        field.name,
        rows.map((row) => {
          if (!isRow(row)) return {}
          const projected = submittedValues(field.fields ?? [], row)
          if (field.type === 'combobox') {
            return { value: row.value, label: row.label, ...projected }
          }
          return projected
        }),
      )
      continue
    }

    setAtPath(result, field.name, value)
  }

  return result as FormValues
}

export interface HiddenValue {
  path: string
  empty: unknown
}

export function hiddenValues(
  fields: FieldConfig[],
  values: FormValues,
  basePath = '',
): HiddenValue[] {
  const found: HiddenValue[] = []
  const prefix = basePath ? `${basePath}.` : ''

  for (const field of inputFields(fields)) {
    const path = `${prefix}${field.name}`

    if (!isVisible(field, values)) {
      const current = getAtPath(values, field.name)
      const empty = defaultValueFor(field)
      if (JSON.stringify(current) !== JSON.stringify(empty)) {
        found.push({ path, empty })
      }
      continue
    }

    if (field.type === 'fieldArray' || field.type === 'combobox' || field.type === 'cardArray') {
      const rows = getAtPath(values, field.name)
      if (!Array.isArray(rows)) continue
      rows.forEach((row, index) => {
        if (isRow(row)) {
          found.push(...hiddenValues(field.fields ?? [], row, `${path}.${index}`))
        }
      })
    }
  }

  return found
}