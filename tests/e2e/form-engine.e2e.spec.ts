import { test, expect, type Page } from '@playwright/test'

async function submittedJson(page: Page): Promise<Record<string, unknown>> {
  const pre = page.locator('pre')
  await expect(pre).not.toContainText('Nothing submitted yet', { timeout: 10_000 })
  return JSON.parse((await pre.textContent()) ?? '{}')
}

const roomsInput = (page: Page) => page.getByPlaceholder('Type to add rooms')

async function addViaKeyboard(page: Page, input: ReturnType<Page['getByPlaceholder']>, query: string, optionName: string) {
  await expect(page.locator('[data-slot="combobox-content"]')).toBeHidden()
  await input.click()
  await expect(input).toHaveValue('')
  await input.pressSequentially(query, { delay: 40 })
  await expect(page.getByRole('option', { name: optionName })).toBeVisible()
  await input.press('Enter')
  await expect(page.locator('[data-slot="combobox-content"]')).toBeHidden()
}

async function addRoom(page: Page, query: string, optionName: string) {
  await addViaKeyboard(page, roomsInput(page), query, optionName)
}

async function pickDestination(page: Page, query: string, optionName: string) {
  const input = page.locator('[data-field="destination"]').getByPlaceholder('Search destinations…')
  await input.click()
  await input.pressSequentially(query, { delay: 40 })
  await expect(page.getByRole('option', { name: optionName })).toBeVisible()
  await input.press('Enter')
  await expect(input).toHaveValue(optionName)
}

test.describe('combobox chip control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/form')
    await expect(page.getByRole('heading', { name: 'Every form field' })).toBeVisible()
  })

  test('three Enters add three chips, duplicates allowed under reselect', async ({ page }) => {
    await addRoom(page, 'dou', 'Double')
    await addRoom(page, 'dou', 'Double')
    await addRoom(page, 'twi', 'Twin')

    const chips = page.locator('[data-field="rooms"] [data-slot="combobox-chip"]')
    await expect(chips).toHaveCount(3)
    await expect(chips.filter({ hasText: 'Double' })).toHaveCount(2)
    await expect(page.locator('pre')).toContainText('Nothing submitted yet')
  })

  test('Enter never submits, Backspace on empty input removes the last chip', async ({ page }) => {
    await addRoom(page, 'sui', 'Suite')
    const input = roomsInput(page)
    await input.press('Enter')
    await expect(page.locator('pre')).toContainText('Nothing submitted yet')

    await expect(page.locator('[data-field="rooms"] [data-slot="combobox-chip"]')).toHaveCount(1)
    await input.press('Backspace')
    await expect(page.locator('[data-field="rooms"] [data-slot="combobox-chip"]')).toHaveCount(0)
  })

  test('phone is disabled until a room exists', async ({ page }) => {
    const phone = page.locator('[data-field="phone"] input')
    await expect(phone).toBeDisabled()
    await addRoom(page, 'dou', 'Double')
    await expect(phone).toBeEnabled()
  })

  test('searchableSelect filters, selects, clears, and submits a bare string', async ({ page }) => {
    const field = page.locator('[data-field="destination"]')
    const input = field.getByPlaceholder('Search destinations…')
    await input.click()
    await input.pressSequentially('lj', { delay: 40 })
    await expect(page.getByRole('option', { name: 'Ljubljana' })).toBeVisible()
    await input.press('Enter')
    await expect(input).toHaveValue('Ljubljana')
    await expect(page.locator('pre')).toContainText('Nothing submitted yet')

    await field.locator('[data-slot="combobox-clear"]').click()
    await expect(input).toHaveValue('')

    await pickDestination(page, 'lis', 'Lisbon')
    await addRoom(page, 'dou', 'Double')
    await page.getByRole('button', { name: 'Edit Double' }).click()
    const modal = page.getByRole('dialog')
    await modal.locator('[data-field^="rooms.0.board"] [data-slot="select-trigger"]').click()
    await page.getByRole('option', { name: 'Room only' }).click()
    await modal.getByRole('button', { name: 'Add Traveller' }).click()
    await modal.locator('[data-field="rooms.0.travellers.0.name"] input').fill('Solo')
    await modal
      .locator('[data-field^="rooms.0.travellers.0.ageBand"] [data-slot="select-trigger"]')
      .click()
    await page.getByRole('option', { name: 'Adult', exact: true }).click()
    await modal.getByRole('button', { name: 'Done' }).click()

    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)
    expect(values.destination).toBe('lis')
  })

  test('an unopened incomplete row surfaces a visible error on submit', async ({ page }) => {
    await addRoom(page, 'dou', 'Double')
    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const field = page.locator('[data-field="rooms"]')
    await expect(field).toContainText('Complete room 1')
    await expect(page.locator('pre')).toContainText('Nothing submitted yet')
  })

  test('Enter activates the chip edit button for keyboard users', async ({ page }) => {
    await addRoom(page, 'dou', 'Double')
    const edit = page.getByRole('button', { name: 'Edit Double' })
    await edit.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByRole('status')).toContainText('Traveller')
  })

  test('chip modal live-edits the row; picker-seeded traveller submits its seeded values (#31)', async ({
    page,
  }) => {
    await pickDestination(page, 'mad', 'Madrid')
    await addRoom(page, 'dou', 'Double')

    await page.getByRole('button', { name: 'Edit Double' }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()

    await expect(modal.getByRole('status')).toContainText('Please complete')

    await modal.locator('[data-field^="rooms.0.board"] [data-slot="select-trigger"]').click()
    await page.getByRole('option', { name: 'Bed and breakfast' }).click()

    await modal.getByRole('button', { name: 'Add from party template' }).click()
    const picker = page.getByRole('dialog', { name: 'Add from party template' })
    await picker.locator('label').filter({ hasText: 'One adult' }).click()
    await picker.getByRole('button', { name: 'Add 1 selected' }).click()
    await expect(picker).toBeHidden()

    await modal.locator('[data-field="rooms.0.travellers.0.name"] input').fill('Ana Example')
    await modal.getByRole('button', { name: 'Done' }).click()
    await expect(modal).not.toBeVisible()

    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)

    const rooms = values.rooms as Record<string, unknown>[]
    expect(rooms).toHaveLength(1)
    expect(rooms[0]).toMatchObject({ value: 'double', label: 'Double', board: 'bb' })

    const travellers = rooms[0]?.travellers as Record<string, unknown>[]
    expect(travellers[0]).toMatchObject({ name: 'Ana Example', ageBand: 'adult' })
    expect('age' in (travellers[0] ?? {})).toBe(false)
  })

  test('nested combobox per array row stays row-scoped (#39)', async ({ page }) => {
    await pickDestination(page, 'mad', 'Madrid')
    await addRoom(page, 'dou', 'Double')

    await page.getByRole('button', { name: 'Add Party room' }).click()
    await page.getByRole('button', { name: 'Add Party room' }).click()

    const room1 = page.locator('[data-field="partyRooms.0.travellers"]')
    const room2 = page.locator('[data-field="partyRooms.1.travellers"]')

    await addViaKeyboard(page, room1.getByPlaceholder('Type to add travellers'), 'adu', 'Adult')
    await addViaKeyboard(page, room2.getByPlaceholder('Type to add travellers'), 'chi', 'Child')

    await expect(room1.locator('[data-slot="combobox-chip"]')).toHaveCount(1)
    await expect(room2.locator('[data-slot="combobox-chip"]')).toHaveCount(1)
    await expect(room1.locator('[data-slot="combobox-chip"]')).toContainText('Adult')
    await expect(room2.locator('[data-slot="combobox-chip"]')).toContainText('Child')

    await room1.getByRole('button', { name: 'Edit Adult' }).click()
    const modal = page.getByRole('dialog')
    const first = modal.locator('[data-field="partyRooms.0.travellers.0.firstName"] input')
    await expect(first).toHaveAttribute('autocomplete', 'given-name')
    await first.fill('Ana')
    await modal.locator('[data-field="partyRooms.0.travellers.0.lastName"] input').fill('One')
    await modal.getByRole('button', { name: 'Done' }).click()

    await room2.getByRole('button', { name: 'Edit Child' }).click()
    const modal2 = page.getByRole('dialog')
    await modal2.locator('[data-field="partyRooms.1.travellers.0.firstName"] input').fill('Kit')
    await modal2.locator('[data-field="partyRooms.1.travellers.0.lastName"] input').fill('Two')
    await modal2.getByRole('button', { name: 'Done' }).click()

    await page.getByRole('button', { name: 'Edit Double' }).click()
    const roomModal = page.getByRole('dialog')
    await roomModal.locator('[data-field^="rooms.0.board"] [data-slot="select-trigger"]').click()
    await page.getByRole('option', { name: 'Room only' }).click()
    await roomModal.getByRole('button', { name: 'Add Traveller' }).click()
    await roomModal.locator('[data-field="rooms.0.travellers.0.name"] input').fill('Solo')
    await roomModal
      .locator('[data-field^="rooms.0.travellers.0.ageBand"] [data-slot="select-trigger"]')
      .click()
    await page.getByRole('option', { name: 'Adult', exact: true }).click()
    await roomModal.getByRole('button', { name: 'Done' }).click()

    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)

    const partyRooms = values.partyRooms as Record<string, unknown>[]
    expect(partyRooms).toHaveLength(2)
    expect(Object.keys(partyRooms[0] ?? {})).toEqual(['travellers'])

    const t1 = partyRooms[0]?.travellers as Record<string, unknown>[]
    const t2 = partyRooms[1]?.travellers as Record<string, unknown>[]
    expect(t1).toHaveLength(1)
    expect(t2).toHaveLength(1)
    expect(t1[0]).toMatchObject({ value: 'adult', label: 'Adult', firstName: 'Ana', lastName: 'One' })
    expect(t2[0]).toMatchObject({ value: 'child', label: 'Child', firstName: 'Kit', lastName: 'Two' })
  })
})
