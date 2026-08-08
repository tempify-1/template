import type { FieldType } from '@/lib/forms/types'

import {
  CheckboxControl,
  ColorControl,
  NumberControl,
  PriceControl,
  SelectControl,
  RangeControl,
  SlugControl,
  SwitchControl,
  TextControl,
  TextareaControl,
  type FieldControlProps,
} from './fields'
import { DateControl, DateRangeControl } from './fields/date'
import { MultiSelectControl } from './fields/multi-select'
import {
  NumberPickerCardsControl,
  NumberPickerTableControl,
} from './fields/number-picker'
import {
  CheckboxCardsControl,
  RadioCardsControl,
  RadioTabsControl,
} from './fields/option-cards'
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
  radioCards: RadioCardsControl,
  radioTabs: RadioTabsControl,
  checkboxCards: CheckboxCardsControl,
  date: DateControl,
  dateRange: DateRangeControl,
  range: RangeControl,
  numberPickerCards: NumberPickerCardsControl,
  numberPickerTable: NumberPickerTableControl,
}
