'use client'

import * as React from 'react'

import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'
import type { Option } from '@/lib/forms/types'

import type { FieldControlProps } from '../fields'

export function MultiSelectControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const theme = useSectionTheme()
  const anchorRef = useComboboxAnchor()
  const [inputValue, setInputValue] = React.useState('')
  const options = config.options ?? []
  const query = inputValue.trim().toLowerCase()
  const offered =
    query === ''
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(query))
  const stored = Array.isArray(field.value) ? (field.value as string[]) : []
  const atMax = config.max !== undefined && stored.length >= config.max

  const selectedOptions = stored.map(
    (value) => options.find((option) => option.value === value) ?? { value, label: value },
  )

  const handleChange = (next: Option[]) => {
    setInputValue('')
    field.onChange(next.map((option) => option.value))
  }

  return (
    <span
      onKeyDown={(event) => {
        const target = event.target as HTMLElement
        if (event.key === 'Enter' && target.tagName === 'INPUT') event.preventDefault()
      }}
    >
      <Combobox
        multiple
        autoHighlight
        items={offered}
        value={selectedOptions}
        onValueChange={handleChange}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        filter={null}
        isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
      >
        <ComboboxChips ref={anchorRef} aria-label={config.ariaLabel ?? config.label}>
          {selectedOptions.map((option) => (
            <ComboboxChip key={option.value} aria-label={option.label}>
              {option.label}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            id={controlId}
            placeholder={config.placeholder ?? 'Type to add…'}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy || undefined}
            onBlur={field.onBlur}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchorRef} data-theme={theme ?? undefined}>
          <ComboboxEmpty>No results.</ComboboxEmpty>
          <ComboboxList>
            {(option: Option) => (
              <ComboboxItem
                key={option.value}
                value={option}
                disabled={option.disabled || (atMax && !stored.includes(option.value))}
              >
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </span>
  )
}
