'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'
import { useId, useMemo } from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form'

import { Button } from '@/components/ui/button'
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
import { isVisible } from '@/lib/forms/conditions'
import { getAtPath } from '@/lib/forms/paths'
import { emptyValues } from '@/lib/forms/resolvers'
import { buildSchema } from '@/lib/forms/schema-builder'
import { inputFields, type FieldConfig, type FormValues } from '@/lib/forms/types'

import { fieldRegistry } from './field-registry'

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
  const { fields: rows, append, remove, move } = useFieldArray({
    control: form.control,
    name: fullName,
  }) as unknown as {
    fields: ({ id: string } & FormValues)[]
    append: (row: FormValues) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
  }
  const currentRows = useWatch({ control: form.control, name: fullName }) as unknown as
    | FormValues[]
    | undefined
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

  return (
    <FieldSet data-field={fullName}>
      <FieldLegend>{label}</FieldLegend>
      {config.description ? <FieldDescription>{config.description}</FieldDescription> : null}

      {rows.map((row, index) => (
        <FieldSet key={row.id} className="rounded-lg border border-border p-4">
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

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atMax}
          onClick={() => append(emptyValues(config.fields ?? []))}
        >
          {`Add ${label}`}
        </Button>
      </div>
    </FieldSet>
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

        const Control = fieldRegistry[config.type as keyof typeof fieldRegistry]
        if (!Control) return null

        const fullName = joinPath(basePath, config.name)
        const message = errorMessageAt(form.formState.errors, fullName)
        const id = `${uid}${fullName}`
        const descriptionId = config.description ? `${id}-description` : undefined
        const errorId = message ? `${id}-error` : undefined
        const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

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
              <Control
                config={config}
                field={field}
                controlId={id}
                invalid={Boolean(message)}
                describedBy={describedBy}
              />
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
    shouldUnregister: true,
  })

  const uid = useId()
  const values = form.watch() as Record<string, unknown>
  const submit = fields.find((field) => field.type === 'submit')

  const handle: SubmitHandler<Record<string, unknown>> = async (submitted) => {
    await onSubmit(submitted as FormValues)
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
