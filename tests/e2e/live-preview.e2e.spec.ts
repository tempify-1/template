import { test, expect } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

let payload: Payload
let draftId: number | string
let token: string

const EDITOR = { email: 'live-preview@test.local', password: 'test1234' }
const SLUG = `draft-only-${Date.now()}`

test.describe('Live Preview and drafts', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const created = await payload.create({
      collection: 'pages',
      data: {
        title: 'Draft only',
        slug: SLUG,
        _status: 'draft',
        sections: [{ blockType: 'ctaBanner', heading: 'Draft heading' }],
      } as never,
    })

    draftId = created.id

    await payload.delete({ collection: 'users', where: { email: { equals: EDITOR.email } } })
    await payload.create({ collection: 'users', data: EDITOR as never })
  })

  test.afterAll(async () => {
    await payload.delete({ collection: 'pages', id: draftId })
    await payload.delete({ collection: 'users', where: { email: { equals: EDITOR.email } } })
  })

  test('refuses to enable draft mode for an anonymous visitor', async ({ request }) => {
    const response = await request.get('/next/preview?path=%2F', { maxRedirects: 0 })

    expect(response.status()).toBe(401)
  })

  test('refuses to send preview anywhere but a relative path', async ({ request }) => {
    for (const path of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/\\\\evil.example',
      '\\\\evil.example',
      'not-a-path',
    ]) {
      const response = await request.get(`/next/preview?path=${encodeURIComponent(path)}`, {
        maxRedirects: 0,
      })
      expect(response.status(), path).toBe(400)
    }
  })

  test('refuses to start preview from a cross-site navigation', async ({ request }) => {
    const response = await request.get('/next/preview?path=%2F', {
      headers: { 'sec-fetch-site': 'cross-site' },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(403)
  })

  test('keeps an unpublished page off the public site', async ({ page }) => {
    const response = await page.goto(`/${SLUG}`)

    expect(response?.status()).toBe(404)
    await expect(page.getByText('Draft heading')).toHaveCount(0)
  })

  test('leaves the draft out of the sitemap', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    expect(xml).not.toContain(`/${SLUG}`)
  })

  test('mounts no refresh listener on a normal published visit', async ({ page }) => {
    await page.goto('/')

    const scripts = await page.locator('script').allTextContents()
    expect(scripts.join('')).not.toContain('live-preview')
  })

  test('publishing makes the page public without a deploy', async ({ page, request }) => {
    const login = await request.post('/api/users/login', { data: EDITOR })
    token = (await login.json()).token

    const setStatus = (status: string) =>
      request.patch(`/api/pages/${draftId}`, {
        data: { _status: status },
        headers: { Authorization: `JWT ${token}` },
      })

    expect((await setStatus('published')).ok()).toBe(true)

    try {
      expect((await request.get(`/${SLUG}`)).status()).toBe(200)

      await page.goto(`/${SLUG}`)
      await expect(page.getByRole('heading', { name: 'Draft heading' })).toBeVisible()

      expect(await (await request.get('/sitemap.xml')).text()).toContain(`/${SLUG}`)
    } finally {
      await setStatus('draft')
    }
  })
})
