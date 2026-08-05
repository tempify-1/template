'use server'

import { getPayload, type Payload } from 'payload'

import { FORM_UNAVAILABLE_MESSAGE, resolveForm } from '@/lib/forms/resolve-form'
import { buildSchema } from '@/lib/forms/schema-builder'
import type { FormValues } from '@/lib/forms/types'
import config from '@/payload.config'

export interface SubmitResult {
  ok: boolean
  message: string
}

const RECORDING_FAILED_MESSAGE = 'We could not record that just now. Please try again in a moment.'

export async function submitForm(formName: string, values: FormValues): Promise<SubmitResult> {
  let payload: Payload
  try {
    payload = await getPayload({ config: await config })
  } catch (error) {
    console.error(`form-submissions: Payload unavailable for "${formName}"`, error)
    return { ok: false, message: RECORDING_FAILED_MESSAGE }
  }

  const definition = await resolveForm(formName, payload)

  if (!definition) {
    return { ok: false, message: FORM_UNAVAILABLE_MESSAGE }
  }

  const parsed = buildSchema(definition.fields).safeParse(values)

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Some answers were rejected. Please check the form and try again.',
    }
  }

  try {
    const summary = parsed.data[definition.summaryField]

    await payload.create({
      collection: 'form-submissions',
      data: {
        form: formName,
        summary: typeof summary === 'string' ? summary : undefined,
        data: parsed.data,
      },
      overrideAccess: true,
    })

    return { ok: true, message: definition.successMessage }
  } catch (error) {
    payload.logger.error({ err: error, form: formName }, 'form-submissions: create failed')
    return { ok: false, message: RECORDING_FAILED_MESSAGE }
  }
}
