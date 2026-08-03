import { getPayload, type Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

import { submitForm } from '@/app/actions/submit-form'
import { contactForm } from '@/lib/presets/contact-form'
import { newsletter } from '@/lib/presets/newsletter'
import { presetBlocks } from '@/lib/presets/registry'
import { formDefinitions } from '@/lib/forms/definitions'
import { mapPageResult } from '@/mappers/page'
import type { Block, FormBlock, SectionDefinition } from '@/lib/presets/types'
import config from '@/payload.config'

function blockOf<T extends Block['blockType']>(section: SectionDefinition, type: T) {
  return section.columns![0]!.blocks!.find((b) => b.blockType === type) as Extract<
    Block,
    { blockType: T }
  >
}

describe('contactForm and newsletter Presets', () => {
  it('names the form the Section renders', () => {
    expect(blockOf(contactForm({ heading: 'Talk to us' }), 'form')).toEqual<FormBlock>({
      blockType: 'form',
      formName: 'contact',
    })
    expect(blockOf(newsletter({ heading: 'Subscribe' }), 'form')).toEqual<FormBlock>({
      blockType: 'form',
      formName: 'newsletter',
    })
  })

  it('keeps the Section header alongside the form', () => {
    const section = contactForm({ heading: 'Talk to us', subheading: 'We reply fast.' })

    expect(blockOf(section, 'heading')).toMatchObject({ text: 'Talk to us' })
    expect(blockOf(section, 'paragraph')).toMatchObject({ text: 'We reply fast.' })
  })

  it('refuses a Section with no heading', () => {
    expect(() => contactForm({ heading: '' })).toThrow()
    expect(() => newsletter({ heading: '' })).toThrow()
  })

  it('generates an authorable Payload block for each', () => {
    const slugs = presetBlocks().map((block) => block.slug)

    expect(slugs).toContain('contactForm')
    expect(slugs).toContain('newsletter')
  })

  it('maps a stored block back into a form Section', () => {
    const { sections, skipped } = mapPageResult({
      sections: [
        { blockType: 'contactForm', heading: 'Talk to us' },
        { blockType: 'newsletter', heading: 'Release notes' },
      ],
    } as never)

    expect(skipped).toHaveLength(0)
    expect(sections.map((section) => blockOf(section, 'form').formName)).toEqual([
      'contact',
      'newsletter',
    ])
  })
})

describe('submitForm', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  async function submissionsFor(form: string) {
    return payload.find({
      collection: 'form-submissions',
      where: { form: { equals: form } },
      sort: '-createdAt',
    })
  }

  it('persists a valid contact submission an anonymous visitor could send', async () => {
    const email = `visitor-${Date.now()}@example.com`

    const result = await submitForm('contact', {
      name: 'Priya',
      email,
      subject: 'Pricing',
      message: 'Could you tell me more about the team plan?',
    })

    expect(result).toEqual({ ok: true, message: formDefinitions.contact.successMessage })

    const stored = await submissionsFor('contact')
    const match = stored.docs.find((doc) => doc.summary === email)
    expect(match).toBeDefined()
    expect(match!.data).toMatchObject({ name: 'Priya', email, subject: 'Pricing' })
  })

  it('persists a newsletter submission', async () => {
    const email = `reader-${Date.now()}@example.com`

    const result = await submitForm('newsletter', { email, consent: true })

    expect(result.ok).toBe(true)

    const stored = await submissionsFor('newsletter')
    expect(stored.docs.some((doc) => doc.summary === email)).toBe(true)
  })

  it('rejects values that fail the same schema the browser enforced, and stores nothing', async () => {
    const before = await submissionsFor('contact')

    const result = await submitForm('contact', {
      name: 'Priya',
      email: 'not-an-email',
      subject: 'Pricing',
      message: 'Long enough to pass the minimum.',
    })

    expect(result.ok).toBe(false)
    expect(result.message).not.toBe('')

    const after = await submissionsFor('contact')
    expect(after.totalDocs).toBe(before.totalDocs)
  })

  it('refuses a form name it does not know rather than persisting it', async () => {
    const result = await submitForm('bank-details', { email: 'a@b.com' })

    expect(result.ok).toBe(false)
    const stored = await submissionsFor('bank-details')
    expect(stored.totalDocs).toBe(0)
  })

  it('keeps submissions unreadable without a logged-in user', async () => {
    await expect(
      payload.find({ collection: 'form-submissions', overrideAccess: false }),
    ).rejects.toThrow()
  })
})
