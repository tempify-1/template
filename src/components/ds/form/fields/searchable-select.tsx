'use client'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'
import type { Option } from '@/lib/forms/types'

import type { FieldControlProps } from '../fields'

export function SearchableSelectControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const theme = useSectionTheme()
  const options = config.options ?? []
  const stored = String(field.value ?? '')
  const selected = options.find((option) => option.value === stored) ?? null

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
        items={options}
        value={selected}
        onValueChange={(next: Option | null) => {
          field.onChange(next?.value ?? '')
        }}
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
          <ComboboxEmpty>No results.</ComboboxEmpty>
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
