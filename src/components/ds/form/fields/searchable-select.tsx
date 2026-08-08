'use client'

import * as React from 'react'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from '@/components/ui/combobox'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'
import type { Option } from '@/lib/forms/types'

import type { FieldControlProps } from '../fields'
import { useOptionSource } from '../use-option-source'

export function SearchableSelectControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const theme = useSectionTheme()
  const [inputValue, setInputValue] = React.useState(() => {
    if (field.value !== null && typeof field.value === 'object' && !Array.isArray(field.value)) {
      return String((field.value as unknown as Option).label ?? '')
    }
    const initial = String(field.value ?? '')
    return (config.options ?? []).find((option) => option.value === initial)?.label ?? ''
  })
  const storedObject =
    field.value !== null && typeof field.value === 'object' && !Array.isArray(field.value)
      ? (field.value as unknown as Option)
      : null
  const { items, status, isAsync } = useOptionSource(
    config,
    inputValue,
    storedObject ? [storedObject] : [],
  )
  const selected = isAsync
    ? storedObject
    : (items.find((option) => option.value === String(field.value ?? '')) ?? null)

  return (
    <span
      onKeyDown={(event) => {
        const target = event.target as HTMLElement
        if (event.key === 'Enter' && target.tagName === 'INPUT') {
          event.preventDefault()
        }
      }}
    >
      <Combobox
        items={items}
        value={selected}
        onValueChange={(next: Option | null) => {
          if (isAsync) {
            field.onChange(next ? { value: next.value, label: next.label } : undefined)
          } else {
            field.onChange(next?.value ?? '')
          }
          setInputValue(next?.label ?? '')
        }}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        filter={isAsync ? null : undefined}
        isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
        autoHighlight
      >
        <ComboboxInput
          id={controlId}
          className="w-full"
          placeholder={config.placeholder ?? 'Search…'}
          disabled={disabled}
          showClear={selected !== null}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-label={config.ariaLabel}
          aria-description={config.ariaDescription}
          tabIndex={config.tabIndex}
          onBlur={field.onBlur}
        />
        <ComboboxContent data-theme={theme ?? undefined}>
          {status === 'loading' ? <ComboboxStatus>Loading…</ComboboxStatus> : null}
          {status === 'error' ? <ComboboxStatus>Couldn&apos;t load results</ComboboxStatus> : null}
          {status === 'idle' ? <ComboboxEmpty>No results.</ComboboxEmpty> : null}
          <ComboboxList>
            {(option: Option) => (
              <ComboboxItem key={option.value} value={option} disabled={option.disabled}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </span>
  )
}
