import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

import { formDefinitions, isFormName, type FormDefinition } from './definitions'
import { FORM_UNAVAILABLE_MESSAGE } from './messages'
import { mapCmsForm } from './map-cms-form'

export async function resolveForm(
  reference: string,
  payload?: Payload,
): Promise<FormDefinition | null> {
  if (isFormName(reference)) {
    return formDefinitions[reference]
  }

  try {
    const resolvedPayload = payload ?? (await getPayload({ config: await config }))
    const result = await resolvedPayload.find({
      collection: 'forms',
      where: {
        slug: { equals: reference },
        _status: { equals: 'published' },
      },
      limit: 1,
    })

    const doc = result.docs[0]
    if (!doc) return null

    return mapCmsForm(doc as never)
  } catch {
    return null
  }
}

export { FORM_UNAVAILABLE_MESSAGE }
