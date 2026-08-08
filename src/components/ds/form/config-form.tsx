'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import {
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'
import { isVisible, isEnabled, isRequired } from '@/lib/forms/conditions'
import { getAtPath } from '@/lib/forms/paths'
import { emptyValues } from '@/lib/forms/resolvers'
import { buildSchema } from '@/lib/forms/schema-builder'
import { hiddenValues, submittedValues } from '@/lib/forms/submitted-values'
import {
  inputFields,
  type FieldConfig,
  type FormValues,
  type Option,
  type PickerOption,
} from '@/lib/forms/types'

import { fieldRegistry } from './field-registry'
import { FieldControlBoundary } from './fields'
import { RowEditorDialog } from './row-editor-dialog'
import { useOptionSource } from './use-option-source'

export interface ConfigFormProps {
  fields: FieldConfig[]
  defaultValues?: FormValues
  onSubmit: (values: FormValues) => void | Promise<void>
  submitLabel?: string
}

type ConfigFormApi = UseFormReturn<FormValues, unknown, FormValues>

function errorMessageAt(errors: unknown, name: string): string | undefined {
  const entry = getAtPath(errors, name)
  if (entry && typeof entry === 'object' && 'message' in entry) {
    const message = (entry as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return undefined
}

function joinPath(basePath: string, name: string): string {
  return basePath ? `${basePath}.${name}` : name
}

function mergeDeep(target: FormValues, source: FormValues): FormValues {
  const result: FormValues = { ...target }
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key]
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing !== null &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      result[key] = mergeDeep(existing as FormValues, value as FormValues)
    } else {
      result[key] = value
    }
  }
  return result
}

function FieldArrayControl({
  config,
  form,
  seeded,
  basePath,
  uid,
}: {
  config: FieldConfig
  form: ConfigFormApi
  seeded: FormValues
  basePath: string
  uid: string
}) {
  const fullName = joinPath(basePath, config.name)
  const {
    fields: rows,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: fullName,
  }) as unknown as {
    fields: ({ id: string } & FormValues)[]
    append: (row: FormValues) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
  }
  const currentRows = useWatch({ control: form.control, name: fullName }) as unknown as
    FormValues[] | undefined
  const message = errorMessageAt(form.formState.errors, fullName)
  const label = config.label ?? config.name
  const atMax = config.max !== undefined && rows.length >= config.max
  const errorId = message ? `${uid}${fullName}-error` : undefined

  const rowValues = (index: number): FormValues => {
    if (currentRows && Array.isArray(currentRows) && index < currentRows.length) {
      return currentRows[index] as FormValues
    }
    return {}
  }

  const picker = config.picker
  const pickerLabel = picker?.label ?? label
  const slotsLeft = config.max === undefined ? Infinity : (config.max ?? 0) - rows.length
  const hasPicker = Boolean(picker)
  const offerable = picker?.options.filter((option) => !option.disabled) ?? []
  const pickerDisabled = !picker || offerable.length === 0 || slotsLeft <= 0
  const maxSelectable = picker ? Math.min(offerable.length, slotsLeft) : 0
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) setSelected([])
  }

  const toggleOption = (value: string) => {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value].slice(0, maxSelectable),
    )
  }

  const addSelected = () => {
    if (!picker) return
    const template = emptyValues(config.fields ?? [])
    for (const value of selected) {
      const option = picker.options.find((o) => o.value === value)
      if (option) {
        append(mergeDeep(template, option.data ?? {}))
      }
    }
    setOpen(false)
  }

  return (
    <FieldSet data-field={fullName}>
      <FieldLegend>{label}</FieldLegend>
      {config.description ? <FieldDescription>{config.description}</FieldDescription> : null}

      {rows.map((row, index) => (
        <FieldSet key={row.id} className="rounded-lg border border-border p-4" data-row-index={index}>
          <FieldLegend variant="label">{`${label} ${index + 1}`}</FieldLegend>

          <FieldList
            fields={config.fields ?? []}
            form={form}
            seeded={seeded}
            values={rowValues(index)}
            basePath={`${fullName}.${index}`}
            uid={uid}
          />

          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${label} ${index + 1} up`}
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUpIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${label} ${index + 1} down`}
              disabled={index === rows.length - 1}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDownIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${label} ${index + 1}`}
              onClick={() => remove(index)}
            >
              <XIcon />
            </Button>
          </div>
        </FieldSet>
      ))}

      {message ? <FieldError id={errorId}>{message}</FieldError> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atMax}
          onClick={() => append(emptyValues(config.fields ?? []))}
        >
          {`Add ${label}`}
        </Button>

        {hasPicker ? (
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pickerDisabled}
                  aria-disabled={pickerDisabled || undefined}
                >
                  {`Add from ${pickerLabel}`}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{`Add from ${pickerLabel}`}</DialogTitle>
                <DialogDescription>Select the items you want to add.</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 py-2">
                {picker!.options.map((option) => {
                  const isSelected = selected.includes(option.value)
                  const selectable =
                    !option.disabled && (isSelected || selected.length < maxSelectable)
                  const optionId = `${uid}${fullName}-picker-${option.value}`
                  return (
                    <label
                      key={option.value}
                      htmlFor={optionId}
                      className={`flex items-center gap-3 rounded-md border p-3 text-sm ${selectable || isSelected ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    >
                      <Checkbox
                        id={optionId}
                        checked={isSelected}
                        disabled={!selectable && !isSelected}
                        onCheckedChange={() => selectable && toggleOption(option.value)}
                      />
                      {option.label}
                    </label>
                  )
                })}
              </div>

              <DialogFooter>
                <DialogClose
                  render={
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  }
                />
                <Button
                  type="button"
                  disabled={selected.length === 0 || selected.length > slotsLeft}
                  onClick={addSelected}
                >
                  {`Add ${selected.length} selected`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    </FieldSet>
  )
}

function isBlankRowValue(field: FieldConfig, value: unknown): boolean {
  if (field.type === 'checkbox') return value !== true
  if (field.type === 'number') return value === undefined || value === null
  return String(value ?? '').trim() === ''
}

function incompleteRowFields(fields: FieldConfig[], row: FormValues): string[] {
  const names: string[] = []
  for (const field of inputFields(fields)) {
    if (!isVisible(field, row) || !isEnabled(field, row)) continue
    const value = getAtPath(row, field.name)
    if (field.type === 'fieldArray' || field.type === 'combobox') {
      const count = Array.isArray(value) ? value.length : 0
      const minCount = field.min ?? (field.required ? 1 : 0)
      if (count < minCount) names.push(field.label ?? field.name)
      continue
    }
    if (isRequired(field, row) && isBlankRowValue(field, value)) {
      names.push(field.label ?? field.name)
    }
  }
  return names
}

function rowDisplayValue(row: FormValues, key: string): string {
  const value = getAtPath(row, key)
  if (value === undefined || value === null) return ''
  return String(value)
}

function ComboboxArrayControl({
  config,
  form,
  seeded,
  basePath,
  uid,
  disabled = false,
}: {
  config: FieldConfig
  form: ConfigFormApi
  seeded: FormValues
  basePath: string
  uid: string
  disabled?: boolean
}) {
  const fullName = joinPath(basePath, config.name)
  const theme = useSectionTheme()
  const anchorRef = useComboboxAnchor()
  const [inputValue, setInputValue] = useState('')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const {
    fields: rows,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: fullName,
  }) as unknown as {
    fields: ({ id: string } & FormValues)[]
    append: (row: FormValues) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
  }
  const currentRows = (useWatch({ control: form.control, name: fullName }) ?? []) as FormValues[]

  const label = config.label ?? config.name
  const selectedAsOptions: Option[] = currentRows
    .map((row) => ({
      value: rowDisplayValue(row, 'value'),
      label: rowDisplayValue(row, 'label'),
    }))
    .filter((option) => option.value !== '')
  const singular = config.singularLabel
  const addPlaceholder =
    config.placeholder ?? `Type to add ${singular ? `${singular}s` : label.toLowerCase()}`
  const { items, status, isAsync } = useOptionSource(config, inputValue, selectedAsOptions)
  const options = items
  const reselect = config.reselectOptions === true
  const addable = config.cardDisplay?.addable !== false && !disabled
  const removable = config.cardDisplay?.removable !== false && !disabled
  const editable = config.editableOptions !== false && !disabled
  const reorderable = config.draggable === true && !disabled
  const showCompletion = config.cardDisplay?.showCompletionStatus === true
  const atMax = config.max !== undefined && rows.length >= config.max
  const message = errorMessageAt(form.formState.errors, fullName)
  const rowErrorIndexes = rows
    .map((_, index) => index)
    .filter((index) => getAtPath(form.formState.errors, `${fullName}.${index}`) !== undefined)
  const rowErrorMessage =
    activeIndex === null && rowErrorIndexes.length > 0
      ? `Complete ${singular ?? label.toLowerCase()} ${rowErrorIndexes.map((i) => i + 1).join(', ')}`
      : undefined
  const id = `${uid}${fullName}`
  const descriptionId = config.description ? `${id}-description` : undefined
  const errorId = message || rowErrorMessage ? `${id}-error` : undefined
  const describedBy =
    [descriptionId, errorId, config.ariaDescribedby].filter(Boolean).join(' ') || undefined

  const rowValues = (index: number): FormValues => currentRows[index] ?? {}
  const selectedValues = new Set(currentRows.map((row) => rowDisplayValue(row, 'value')))
  const comboboxValue = reselect
    ? []
    : options.filter((option) => selectedValues.has(option.value))

  const addRow = (option: Option) => {
    if (atMax) return
    const template = emptyValues(config.fields ?? [])
    const seededRow = mergeDeep(template, { value: option.value, label: option.label })
    append(mergeDeep(seededRow, (option as PickerOption).data ?? {}))
  }

  const handleValueChange = (next: Option[]) => {
    setInputValue('')
    if (reselect) {
      const picked = next[next.length - 1]
      if (picked) addRow(picked)
      return
    }
    const nextValues = new Set(next.map((option) => option.value))
    for (const option of next) {
      if (!selectedValues.has(option.value)) addRow(option)
    }
    if (removable) {
      const offered = new Set(options.map((option) => option.value))
      const goneIndex = currentRows.findIndex((row) => {
        const rowValue = rowDisplayValue(row, 'value')
        return offered.has(rowValue) && !nextValues.has(rowValue)
      })
      if (goneIndex >= 0) {
        remove(goneIndex)
        if (activeIndex === goneIndex) setActiveIndex(null)
      }
    }
  }

  const itemDisabled = (option: Option): boolean => {
    if (option.disabled) return true
    if (!atMax) return false
    if (reselect) return true
    return !selectedValues.has(option.value)
  }

  const modalTitle = (index: number): string => {
    const title = config.cardDisplay?.title
    if (title) {
      const keys = Array.isArray(title) ? title : [title]
      const parts = keys.map((key) => rowDisplayValue(rowValues(index), key)).filter(Boolean)
      if (parts.length) return parts.join(' - ')
    }
    return `${config.singularLabel ?? label} ${index + 1}`
  }

  const modalChips = (index: number): string[] =>
    (config.cardDisplay?.chips ?? [])
      .map((chip) => {
        const raw = rowDisplayValue(rowValues(index), chip.field)
        if (!raw) return ''
        const rowField = (config.fields ?? []).find((f) => f.name === chip.field)
        const optionLabel = rowField?.options?.find((o) => o.value === raw)?.label
        return optionLabel ?? raw
      })
      .filter(Boolean)

  const modalDescriptions = (index: number): string[] =>
    (config.cardDisplay?.description ?? [])
      .map((entry) =>
        typeof entry === 'string'
          ? entry
          : entry.field
            ? rowDisplayValue(rowValues(index), entry.field)
            : (entry.text ?? ''),
      )
      .filter(Boolean)

  return (
    <Field
      data-field={fullName}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement
        if (event.key === 'Enter' && target.dataset.slot === 'combobox-chip-input') {
          event.preventDefault()
        }
      }}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {config.description ? (
        <FieldDescription id={descriptionId}>{config.description}</FieldDescription>
      ) : null}

      <Combobox
        multiple
        autoHighlight
        items={options}
        value={comboboxValue}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        filter={isAsync ? null : undefined}
        isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
      >
        <ComboboxChips ref={anchorRef} aria-label={config.ariaLabel ?? `${label} items`}>
          {rows.map((row, index) => {
            const values = rowValues(index)
            const chipLabel = rowDisplayValue(values, 'label') || `${singular ?? label} ${index + 1}`
            const incomplete = showCompletion
              ? incompleteRowFields(config.fields ?? [], values)
              : []
            return (
              <span
                key={row.id}
                data-slot="combobox-chip"
                data-row-index={index}
                className="flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-data-[slot=combobox-chip-remove]:pr-0"
              >
                {editable ? (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`Edit ${chipLabel}`}
                    className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    onClick={() => setActiveIndex(index)}
                  >
                    {chipLabel}
                  </button>
                ) : (
                  <span>{chipLabel}</span>
                )}
                {incomplete.length > 0 ? (
                  <span
                    role="status"
                    aria-label={`${incomplete.length} fields incomplete`}
                    className="size-1.5 rounded-full bg-destructive"
                  />
                ) : null}
                {removable ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    data-slot="combobox-chip-remove"
                    aria-label={`Remove ${chipLabel}`}
                    className="-ml-1 opacity-50 hover:opacity-100"
                    onClick={() => {
                      remove(index)
                      if (activeIndex === index) setActiveIndex(null)
                    }}
                  >
                    <XIcon className="pointer-events-none" />
                  </Button>
                ) : null}
              </span>
            )
          })}
          {addable ? (
            <ComboboxChipsInput
              id={id}
              placeholder={addPlaceholder}
              disabled={disabled}
              aria-describedby={describedBy}
              aria-description={config.ariaDescription}
              aria-label={config.ariaLabel}
              tabIndex={config.tabIndex}
              aria-invalid={message || rowErrorMessage ? true : undefined}
              onKeyDown={(event) => {
                if (
                  event.key === 'Backspace' &&
                  event.currentTarget.value === '' &&
                  rows.length > 0
                ) {
                  event.preventDefault()
                  if (removable) {
                    remove(rows.length - 1)
                    if (activeIndex === rows.length - 1) setActiveIndex(null)
                  }
                }
              }}
            />
          ) : null}
        </ComboboxChips>
        {addable ? (
          <ComboboxContent anchor={anchorRef} data-theme={theme ?? undefined}>
            {status === 'loading' ? <ComboboxStatus>Loading…</ComboboxStatus> : null}
            {status === 'error' ? (
              <ComboboxStatus>Couldn&apos;t load results</ComboboxStatus>
            ) : null}
            {status === 'idle' ? <ComboboxEmpty>No results.</ComboboxEmpty> : null}
            <ComboboxList>
              {(option: Option) => (
                <ComboboxItem key={option.value} value={option} disabled={itemDisabled(option)}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        ) : null}
      </Combobox>

      {message || rowErrorMessage ? (
        <FieldError id={errorId}>{message ?? rowErrorMessage}</FieldError>
      ) : null}

      {activeIndex !== null && rows[activeIndex] ? (
        <RowEditorDialog
          open
          onOpenChange={(next) => {
            if (!next) setActiveIndex(null)
          }}
          title={modalTitle(activeIndex)}
          position={{ index: activeIndex, total: rows.length }}
          chips={modalChips(activeIndex)}
          descriptions={modalDescriptions(activeIndex)}
          incomplete={incompleteRowFields(config.fields ?? [], rowValues(activeIndex))}
          onPrev={activeIndex > 0 ? () => setActiveIndex(activeIndex - 1) : undefined}
          onNext={activeIndex < rows.length - 1 ? () => setActiveIndex(activeIndex + 1) : undefined}
          onMoveUp={
            reorderable && activeIndex > 0
              ? () => {
                  move(activeIndex, activeIndex - 1)
                  setActiveIndex(activeIndex - 1)
                }
              : undefined
          }
          onMoveDown={
            reorderable && activeIndex < rows.length - 1
              ? () => {
                  move(activeIndex, activeIndex + 1)
                  setActiveIndex(activeIndex + 1)
                }
              : undefined
          }
        >
          <FieldList
            fields={config.fields ?? []}
            form={form}
            seeded={seeded}
            values={rowValues(activeIndex)}
            basePath={`${fullName}.${activeIndex}`}
            uid={uid}
          />
        </RowEditorDialog>
      ) : null}
    </Field>
  )
}

function FieldList({
  fields,
  form,
  seeded,
  values,
  basePath,
  uid,
}: {
  fields: FieldConfig[]
  form: ConfigFormApi
  seeded: FormValues
  values: FormValues
  basePath: string
  uid: string
}) {
  return (
    <>
      {inputFields(fields).map((config) => {
        if (!isVisible(config, values)) return null

        if (config.type === 'fieldArray') {
          return (
            <FieldArrayControl
              key={config.name}
              config={config}
              form={form}
              seeded={seeded}
              basePath={basePath}
              uid={uid}
            />
          )
        }

        if (config.type === 'combobox') {
          return (
            <ComboboxArrayControl
              key={config.name}
              config={config}
              form={form}
              seeded={seeded}
              basePath={basePath}
              uid={uid}
              disabled={!isEnabled(config, values)}
            />
          )
        }

        const Control = fieldRegistry[config.type as keyof typeof fieldRegistry]
        if (!Control) return null

        const fullName = joinPath(basePath, config.name)
        const message = errorMessageAt(form.formState.errors, fullName)
        const id = `${uid}${fullName}`
        const descriptionId = config.description ? `${id}-description` : undefined
        const errorId = message ? `${id}-error` : undefined
        const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined
        const disabled = !isEnabled(config, values)

        const label = config.label ? <FieldLabel htmlFor={id}>{config.label}</FieldLabel> : null
        const description = config.description ? (
          <FieldDescription id={descriptionId}>{config.description}</FieldDescription>
        ) : null
        const error = message ? <FieldError id={errorId}>{message}</FieldError> : null

        const control = (
          <Controller
            control={form.control}
            name={fullName}
            defaultValue={getAtPath(seeded, fullName) as never}
            render={({ field }) => (
              <FieldControlBoundary>
                <Control
                  config={config}
                  field={{ ...field, disabled }}
                  controlId={id}
                  invalid={Boolean(message)}
                  describedBy={describedBy}
                  disabled={disabled || undefined}
                />
              </FieldControlBoundary>
            )}
          />
        )

        if (config.type === 'checkbox') {
          return (
            <Field key={fullName} orientation="horizontal" data-field={fullName}>
              {control}
              <FieldContent>
                {label}
                {description}
                {error}
              </FieldContent>
            </Field>
          )
        }

        return (
          <Field key={fullName} data-field={fullName}>
            {label}
            {control}
            {description}
            {error}
          </Field>
        )
      })}
    </>
  )
}

export function ConfigForm({ fields, defaultValues, onSubmit, submitLabel }: ConfigFormProps) {
  const schema = useMemo(() => buildSchema(fields), [fields])
  const seeded = useMemo(
    () => ({ ...emptyValues(fields), ...(defaultValues ?? {}) }),
    [fields, defaultValues],
  )

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: seeded,
    mode: 'onSubmit',
    shouldUnregister: false,
  })

  const uid = useId()
  const values = form.watch() as Record<string, unknown>
  const submit = fields.find((field) => field.type === 'submit')

  useEffect(() => {
    for (const { path, empty } of hiddenValues(fields, values as FormValues)) {
      form.setValue(path, empty as never, { shouldValidate: false, shouldDirty: false })
    }
  }, [fields, form, values])

  const handle: SubmitHandler<Record<string, unknown>> = async (submitted) => {
    await onSubmit(submittedValues(fields, submitted as FormValues))
  }

  return (
    <form onSubmit={form.handleSubmit(handle)} noValidate>
      <FieldGroup>
        <FieldList
          fields={fields}
          form={form}
          seeded={seeded}
          values={values as FormValues}
          basePath=""
          uid={uid}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {submit?.label ?? submitLabel ?? 'Submit'}
        </Button>
      </FieldGroup>
    </form>
  )
}
