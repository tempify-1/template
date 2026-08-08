import type { FieldType } from '@/lib/forms/types'

import {
  CheckboxControl,
  NumberControl,
  SelectControl,
  TextControl,
  TextareaControl,
  type FieldControlProps,
} from './fields'

export type FieldControl = (props: FieldControlProps) => React.ReactNode

export type ControlRegistry = Record<Exclude<FieldType, 'submit' | 'fieldArray' | 'combobox'>, FieldControl>

export const fieldRegistry: ControlRegistry = {
  text: TextControl,
  email: TextControl,
  tel: TextControl,
  textarea: TextareaControl,
  select: SelectControl,
  checkbox: CheckboxControl,
  number: NumberControl,
}
