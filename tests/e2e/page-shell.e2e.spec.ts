import { test, expect, type Page as PwPage } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '@/payload.config'

let payload: Payload
const created: (number | string)[] = []

const SEEDS = [
  { slug: 'shell-website', shell: 'website' },
  { slug: 'shell-dashboard', shell: 'dashboard' },
  { slug: 'shell-blank', shell: 'blank' },
  { slug: 'shell-absent', shell: undefined },
  { slug: 'shell-dashboard-two', shell: 'dashboard' },
] as const

function chrome(page: PwPage) {
  return page.evaluate(() => ({
    sidebar: document.querySelectorAll('[data-slot="sidebar"]').length > 0,
    siteFooter: [...document.querySelectorAll('footer')].some((f) =>
      f.textContent?.includes('All rights reserved'),
    ),
  }))
}

test.describe('A Page chooses its Shell', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })

    for (const seed of SEEDS) {
      await payload.delete({ collection: 'pages', where: { slug: { equals: seed.slug } } })
      const doc = await payload.create({
        collection: 'pages',
        data: {
          title: seed.slug,
          slug: seed.slug,
          _status: 'published',
          ...(seed.shell ? { shell: seed.shell } : {}),
          sections: [{ blockType: 'ctaBanner', heading: `Chrome for ${seed.slug}` }],
        } as never,
      })
      created.push(doc.id)

      if (!seed.shell) {
        await payload.update({
          collection: 'pages',
          id: doc.id,
          data: { shell: null } as never,
        })
      }
    }
  })

  test('the absent-Shell fixture really stores no Shell, so the fallback is exercised', async () => {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'shell-absent' } },
      limit: 1,
      overrideAccess: true,
    })

    expect(docs[0]?.shell ?? null).toBeNull()
  })

  test.afterAll(async () => {
    for (const id of created) await payload.delete({ collection: 'pages', id })
  })

  test('renders website chrome when the Page asks for it', async ({ page }) => {
    await page.goto('/shell-website')

    expect(await chrome(page)).toEqual({ sidebar: false, siteFooter: true })
    await expect(page.getByRole('heading', { name: 'Chrome for shell-website' })).toBeVisible()
  })

  test('renders dashboard chrome when the Page asks for it', async ({ page }) => {
    await page.goto('/shell-dashboard')

    expect(await chrome(page)).toEqual({ sidebar: true, siteFooter: false })
    await expect(page.getByRole('heading', { name: 'Chrome for shell-dashboard' })).toBeVisible()
  })

  test('renders neither chrome when the Page asks for blank', async ({ page }) => {
    await page.goto('/shell-blank')

    expect(await chrome(page)).toEqual({ sidebar: false, siteFooter: false })
    await expect(page.getByRole('heading', { name: 'Chrome for shell-blank' })).toBeVisible()
  })

  test('falls back to website chrome when no Shell was chosen', async ({ page }) => {
    await page.goto('/shell-absent')

    expect(await chrome(page)).toEqual({ sidebar: false, siteFooter: true })
  })

  test('refuses to store a Shell that is not in the set', async () => {
    await expect(
      payload.create({
        collection: 'pages',
        data: {
          title: 'bad shell',
          slug: 'shell-rejected',
          _status: 'published',
          shell: 'sunset',
        } as never,
      }),
    ).rejects.toThrow()
  })

  test('switches chrome when navigating between two Pages with different Shells', async ({
    page,
  }) => {
    await page.goto('/shell-website')
    expect(await chrome(page)).toEqual({ sidebar: false, siteFooter: true })

    await page.goto('/shell-dashboard')
    expect(await chrome(page)).toEqual({ sidebar: true, siteFooter: false })
  })

  test('keeps the same dashboard Shell component as the hand-coded dashboard routes', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    const handCoded = await chrome(page)

    await page.goto('/shell-dashboard')
    expect(await chrome(page)).toEqual(handCoded)
  })

  test('keeps sidebar state across navigation between dashboard-chrome Pages', async ({ page }) => {
    await page.goto('/shell-dashboard')

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    const before = await sidebar.getAttribute('data-state')

    await page.getByRole('button', { name: /toggle sidebar/i }).click()
    await expect(sidebar).not.toHaveAttribute('data-state', before ?? '')
    const toggled = await sidebar.getAttribute('data-state')

    await page.goto('/shell-dashboard-two')

    await expect(page.locator('[data-slot="sidebar"]').first()).toHaveAttribute(
      'data-state',
      toggled ?? '',
    )
  })
})

test.describe('Dashboard sidebar from configuration', () => {
  test('renders the configured groups, not demo content', async ({ page }) => {
    await page.goto('/dashboard')

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/dashboard',
    )
    await expect(sidebar.getByRole('link', { name: 'Charts' })).toHaveAttribute(
      'href',
      '/dashboard/charts',
    )
    await expect(page.getByText('Acme Inc.')).toHaveCount(0)
    await expect(sidebar.locator('a[href="#"]')).toHaveCount(0)
  })

  test('marks the current page once, and its parent only as active', async ({ page }) => {
    await page.goto('/dashboard/charts')

    const current = page.locator('[aria-current="page"]')
    await expect(current).toHaveCount(1)
    await expect(current).toHaveAttribute('href', '/dashboard/charts')

    await expect(page.locator('[data-slot="sidebar"] [data-active]')).toHaveCount(2)
  })

  test('gives a CMS page in dashboard chrome the same sidebar as the hand-coded routes', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    const handCoded = await page
      .locator('[data-slot="sidebar"] a')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')))

    await page.goto('/shell-dashboard')
    const fromCms = await page
      .locator('[data-slot="sidebar"] a')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')))

    expect(fromCms).toEqual(handCoded)
  })

  test('keeps sidebar state across navigation within the dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    const before = await sidebar.getAttribute('data-state')
    await page.getByRole('button', { name: /toggle sidebar/i }).click()
    const toggled = await sidebar.getAttribute('data-state')
    expect(toggled).not.toBe(before)

    await page.goto('/dashboard/charts')
    await expect(page.locator('[data-slot="sidebar"]').first()).toHaveAttribute(
      'data-state',
      toggled ?? '',
    )
  })
})
