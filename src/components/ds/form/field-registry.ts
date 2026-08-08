import type { FieldType } from '@/lib/forms/types'

import {
  CheckboxControl,
  NumberControl,
  SelectControl,
  TextControl,
  TextareaControl,
  type FieldControlProps,
} from './fields'
import { SearchableSelectControl } from './fields/searchable-select'

export type FieldControl = (props: FieldControlProps) => React.ReactNode

export type ControlRegistry = Record<Exclude<FieldType, 'submit' | 'fieldArray' | 'combobox' | 'cardArray' | 'fieldset' | 'accordion' | 'step'>, FieldControl>

export const fieldRegistry: ControlRegistry = {
  text: TextControl,
  email: TextControl,
  tel: TextControl,
  textarea: TextareaControl,
  select: SelectControl,
  searchableSelect: SearchableSelectControl,
  checkbox: CheckboxControl,
  number: NumberControl,
}
