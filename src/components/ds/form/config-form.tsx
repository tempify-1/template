'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { isVisible } from '@/lib/forms/conditions'
import { buildSchema } from '@/lib/forms/schema-builder'
import { isInputField, type FieldConfig, type FormValues } from '@/lib/forms/types'

import { fieldRegistry } from './field-registry'

export interface ConfigFormProps {
  fields: FieldConfig[]
  defaultValues: FormValues
  onSubmit: (values: FormValues) => void | Promise<void>
  submitLabel?: string
}

export function ConfigForm({ fields, defaultValues, onSubmit, submitLabel }: ConfigFormProps) {
  const schema = buildSchema(fields)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onSubmit',
  })

  const values = form.watch()
  const submit = fields.find((field) => field.type === 'submit')

  const handle: SubmitHandler<FormValues> = async (submitted) => {
    await onSubmit(submitted)
  }

  return (
    <form onSubmit={form.handleSubmit(handle)} noValidate>
      <FieldGroup>
        {fields.filter(isInputField).map((config) => {
          if (!isVisible(config, values)) return null

          const Control = fieldRegistry[config.type as keyof typeof fieldRegistry]
          if (!Control) return null

          const error = form.formState.errors[config.name]
          const describedBy = config.description ? `${config.name}-description` : undefined

          return (
            <Field key={config.name} data-field={config.name}>
              {config.label ? <FieldLabel htmlFor={config.name}>{config.label}</FieldLabel> : null}
              <Controller
                control={form.control}
                name={config.name}
                render={({ field }) => (
                  <Control
                    config={config}
                    field={field}
                    invalid={Boolean(error)}
                    describedBy={describedBy}
                  />
                )}
              />
              {config.description ? (
                <FieldDescription id={describedBy}>{config.description}</FieldDescription>
              ) : null}
              {error ? <FieldError>{String(error.message)}</FieldError> : null}
            </Field>
          )
        })}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {submit?.label ?? submitLabel ?? 'Submit'}
        </Button>
      </FieldGroup>
    </form>
  )
}
