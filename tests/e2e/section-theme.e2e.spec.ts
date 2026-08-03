import { test, expect, type Page } from '@playwright/test'

function sectionWithHeading(page: Page, heading: string) {
  return page.locator('main section').filter({ has: page.getByRole('heading', { name: heading }) })
}

function background(page: Page, heading: string) {
  return sectionWithHeading(page, heading).evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  )
}

test.describe('Section Themes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('stamps the authored Theme on the Section and nothing else', async ({ page }) => {
    await expect(sectionWithHeading(page, 'Ready to start?')).toHaveAttribute('data-theme', 'brand')
    await expect(sectionWithHeading(page, 'Loved by the teams using it')).toHaveAttribute(
      'data-theme',
      'accent',
    )
    await expect(sectionWithHeading(page, 'Join the community')).not.toHaveAttribute('data-theme')
  })

  test('recolours a themed Section away from the page background', async ({ page }) => {
    const unthemed = await background(page, 'Join the community')
    const brand = await background(page, 'Ready to start?')
    const accent = await background(page, 'Loved by the teams using it')
    const muted = await background(page, 'Trusted by teams shipping every day')

    expect(new Set([unthemed, brand, accent, muted]).size).toBe(4)
  })

  test('inverts text inside the brand Theme without the heading opting in', async ({ page }) => {
    const section = sectionWithHeading(page, 'Ready to start?')

    const [sectionBg, headingColour] = await Promise.all([
      section.evaluate((node) => getComputedStyle(node).backgroundColor),
      section.getByRole('heading').evaluate((node) => getComputedStyle(node).color),
    ])

    expect(headingColour).not.toBe(sectionBg)
    expect(await section.getByRole('heading').getAttribute('data-theme')).toBeNull()
  })

  test('recolours a button inside the brand Theme through the token layer alone', async ({
    page,
  }) => {
    const inBrand = sectionWithHeading(page, 'Ready to start?').getByRole('link', {
      name: 'Create your account',
    })
    const onPage = sectionWithHeading(page, 'Build your site at the speed of thought').getByRole(
      'link',
      { name: 'Start free trial' },
    )

    const [brandButton, pageButton] = await Promise.all([
      inBrand.evaluate((node) => getComputedStyle(node).backgroundColor),
      onPage.evaluate((node) => getComputedStyle(node).backgroundColor),
    ])

    expect(brandButton).not.toBe(pageButton)
  })
})
