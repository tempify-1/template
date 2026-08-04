import { test, expect } from '@playwright/test'

import { siteNav } from '@/config/site-nav'

const MENU = siteNav.header.items.find((item) => item.type === 'menu')

test.describe('Vendored shadcn components still compile to CSS', () => {
  test('compiles the navigation menu directional transform rules', async ({ page }) => {
    await page.goto('/')

    const css = await page.evaluate(async () => {
      const hrefs = [...document.querySelectorAll('link[rel=stylesheet]')].map(
        (link) => (link as HTMLLinkElement).href,
      )
      const sheets = await Promise.all(hrefs.map((href) => fetch(href).then((r) => r.text())))
      return sheets.join('\n')
    })

    const rules = css.match(/[^{}]*activation-direction[^{]*\{[^}]*\}/g) ?? []

    const note =
      'The shadcn registry ships data-activation-direction=left: which is not valid Tailwind v4 ' +
      'variant syntax and compiles to nothing. It is bracketed in the vendored file; a shadcn ' +
      'add would overwrite that and silently drop the dropdown slide.'

    const joined = rules.join('\n')

    expect(rules.length, note).toBeGreaterThan(0)
    expect(joined, note).toContain('[data-activation-direction="left"]')
    expect(joined, note).toContain('[data-activation-direction="right"]')

    for (const rule of rules) {
      expect(rule, rule.slice(0, 80)).toMatch(/translate/)
    }
  })

  test('the menu the guard relies on is still in the nav config', async () => {
    expect(
      MENU,
      'This spec opens a dropdown to reach the navigation menu. If the header no longer ' +
        'configures a menu item, the guard above is the thing to re-point, not the CSS.',
    ).toBeDefined()
  })
})
