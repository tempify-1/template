import type { FieldType } from '@/lib/forms/types'

import {
  CheckboxControl,
  ColorControl,
  NumberControl,
  PriceControl,
  SelectControl,
  SlugControl,
  SwitchControl,
  TextControl,
  TextareaControl,
  type FieldControlProps,
} from './fields'
import { MultiSelectControl } from './fields/multi-select'
import { SearchableSelectControl } from './fields/searchable-select'

export type FieldControl = (props: FieldControlProps) => React.ReactNode

export type ControlRegistry = Record<Exclude<FieldType, 'submit' | 'fieldArray' | 'combobox' | 'cardArray' | 'fieldset' | 'accordion' | 'step' | 'paragraph' | 'alert' | 'hidden'>, FieldControl>

export const fieldRegistry: ControlRegistry = {
  text: TextControl,
  email: TextControl,
  tel: TextControl,
  textarea: TextareaControl,
  select: SelectControl,
  searchableSelect: SearchableSelectControl,
  checkbox: CheckboxControl,
  switch: SwitchControl,
  number: NumberControl,
  password: TextControl,
  color: ColorControl,
  slug: SlugControl,
  price: PriceControl,
  multiSelect: MultiSelectControl,
}
