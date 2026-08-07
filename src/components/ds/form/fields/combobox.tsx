'use client'

import * as React from 'react'
import type { ControllerRenderProps } from 'react-hook-form'

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'
import type { FieldConfig, FormValues } from '@/lib/forms/types'

export interface ComboboxFieldProps {
  config: FieldConfig
  field: ControllerRenderProps<FormValues, string>
  describedBy?: string
  disabled?: boolean
}

export function ComboboxControl({
  config,
  field,
  describedBy,
  disabled,
}: ComboboxFieldProps) {
  const theme = useSectionTheme()
  const [query, setQuery] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  const options = config.options ?? []
  const stored = String(field.value ?? '')

  const [selectedOption, setSelectedOption] = React.useState<string | null>(() => {
    if (stored && options.some((option) => option.value === stored)) {
      return stored
    }
    return null
  })

  const hasSelectedValue = selectedOption !== null

  const handleSelect = (value: string | null) => {
    if (value === null) {
      setSelectedOption(null)
      field.onChange(undefined)
    } else {
      setSelectedOption(value)
      field.onChange(value)
    }
    setIsOpen(false)
    setQuery('')
  }

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(query.toLowerCase()) || query === '',
  )

  return (
    <Combobox
      items={filteredOptions}
      value={selectedOption}
      onValueChange={handleSelect}
      onInputValueChange={setQuery}
      open={isOpen}
      onOpenChange={setIsOpen}
      filter={null}
    >
      <ComboboxTrigger
        disabled={disabled}
        aria-describedby={describedBy}
        aria-label={config.ariaLabel}
        aria-description={config.ariaDescription}
        tabIndex={config.tabIndex}
      >
        <ComboboxInput
          value={query}
          placeholder={config.placeholder ?? 'Choose one'}
          readOnly={hasSelectedValue}
          aria-invalid={false}
        />
        <ComboboxValue>
          {hasSelectedValue
            ? options.find((o) => o.value === selectedOption)?.label
            : config.placeholder ?? 'Choose one'}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxContent data-theme={theme}>
            {filteredOptions.length === 0 && (
              <ComboboxStatus>No results found</ComboboxStatus>
            )}
            <ComboboxContent className="max-h-60 overflow-y-auto">
              {filteredOptions.map((option) => (
                <ComboboxItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </ComboboxContent>
        </ComboboxPositioner>
      </ComboboxPortal>
    </Combobox>
  )
}