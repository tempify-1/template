'use server'

import { getPayload, type Payload } from 'payload'

import { formDefinitions, isFormName } from '@/lib/forms/definitions'
import { buildSchema } from '@/lib/forms/schema-builder'
import type { FormValues } from '@/lib/forms/types'
import config from '@/payload.config'

export interface SubmitResult {
  ok: boolean
  message: string
}

const UNAVAILABLE = 'We could not record that just now. Please try again in a moment.'

export async function submitForm(formName: string, values: FormValues): Promise<SubmitResult> {
  if (!isFormName(formName)) {
    return { ok: false, message: 'That form is no longer available.' }
  }

  const definition = formDefinitions[formName]
  const parsed = buildSchema(definition.fields).safeParse(values)

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Some answers were rejected. Please check the form and try again.',
    }
  }

  let payload: Payload
  try {
    payload = await getPayload({ config: await config })
  } catch (error) {
    console.error(`form-submissions: Payload unavailable for "${formName}"`, error)
    return { ok: false, message: UNAVAILABLE }
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
    return { ok: false, message: UNAVAILABLE }
  }
}
