import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:3000', { waitUntil: 'networkidle' })
const grid = p.locator('li', { hasText: 'Engineering' }).first()
await grid.scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -180)); await p.waitForTimeout(400)
await p.screenshot({ path: process.argv[2] + '/team2.png' })
console.log('member cards:', await p.getByText('Ade Okonkwo').count())
console.log('profile links:', await p.getByRole('link', { name: 'Profile' }).count())
