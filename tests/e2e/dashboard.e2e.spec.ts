import { test, expect } from '@playwright/test'

const DASHBOARD = '/dashboard'
const CHARTS = '/dashboard/charts'

test.describe('Dashboard', () => {
  test('is reachable without authentication', async ({ page }) => {
    const response = await page.goto(DASHBOARD)

    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(new RegExp('/dashboard$'))
    await expect(page.locator('[data-slot="sidebar"]').first()).toBeVisible()
  })

  test('renders the sidebar from navigation configuration', async ({ page }) => {
    await page.goto(DASHBOARD)

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    await expect(sidebar).toBeVisible()

    for (const [label, href] of [
      ['Overview', '/dashboard'],
      ['Charts', '/dashboard/charts'],
      ['Pages', '/admin/collections/pages'],
    ] as [string, string][]) {
      await expect(sidebar.getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
  })

  test('renders the stat tiles', async ({ page }) => {
    await page.goto(DASHBOARD)

    for (const tile of ['Total Revenue', 'New Customers', 'Active Accounts', 'Growth Rate']) {
      await expect(page.getByText(tile, { exact: true })).toBeVisible()
    }
    await expect(page.getByText('$1,250.00')).toBeVisible()
  })

  test('renders the interactive chart with its range controls', async ({ page }) => {
    await page.goto(DASHBOARD)

    await expect(page.getByText('Total Visitors')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Last 3 months' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Last 7 days' })).toBeVisible()
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible()
  })

  test('mounts a toaster so the block toast calls are not dropped', async ({ page }) => {
    await page.goto(DASHBOARD)

    await expect(page.locator('section[aria-label*="Notifications"]')).toBeAttached()
  })

  test('renders the data table with rows from the sample data', async ({ page }) => {
    await page.goto(DASHBOARD)

    const table = page.getByRole('table').first()
    await expect(table).toBeVisible()

    for (const column of ['Header', 'Section Type', 'Status', 'Target', 'Limit', 'Reviewer']) {
      await expect(table.getByRole('columnheader', { name: column })).toBeVisible()
    }
    await expect(table.getByRole('button', { name: 'Cover page' })).toBeVisible()
  })
})

test.describe('Charts route', () => {
  test('renders the chart on its own route', async ({ page }) => {
    const response = await page.goto(CHARTS)

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: 'Charts' })).toBeVisible()
    await expect(page.getByText('Total Visitors')).toBeVisible()
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible()
  })

  test('shares the dashboard shell via the route group', async ({ page }) => {
    await page.goto(CHARTS)

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Overview' })).toBeVisible()
  })
})

test.describe('Landing page is unaffected by the dashboard shell', () => {
  test('root route still renders the hero and no sidebar', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Build your site at the speed of thought',
    )
    await expect(page.getByRole('link', { name: 'Acme Inc.' })).toHaveCount(0)
  })
})
