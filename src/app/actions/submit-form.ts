'use server'

import { getPayload } from 'payload'

import { formDefinitions, isFormName } from '@/lib/forms/definitions'
import { buildSchema } from '@/lib/forms/schema-builder'
import type { FormValues } from '@/lib/forms/types'
import config from '@/payload.config'

export interface SubmitResult {
  ok: boolean
  message: string
}

export async function submitForm(formName: string, values: FormValues): Promise<SubmitResult> {
  if (!isFormName(formName)) {
    return { ok: false, message: 'That form is no longer available.' }
  }

  const definition = formDefinitions[formName]
  const parsed = buildSchema(definition.fields).safeParse(values)

  if (!parsed.success) {
    return { ok: false, message: 'Some answers were rejected. Please check the form and try again.' }
  }

  try {
    const payload = await getPayload({ config: await config })
    const summary = parsed.data[definition.summaryField]

    await payload.create({
      collection: 'form-submissions',
      data: {
        form: formName,
        summary: typeof summary === 'string' ? summary : undefined,
        data: parsed.data,
      },
      overrideAccess: false,
    })

    return { ok: true, message: definition.successMessage }
  } catch {
    return {
      ok: false,
      message: 'We could not record that just now. Please try again in a moment.',
    }
  }
}
