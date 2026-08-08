import { test, expect, type Page } from '@playwright/test'

async function submittedJson(page: Page): Promise<Record<string, unknown>> {
  const pre = page.locator('[data-slot="submitted-values"]')
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

async function nextStep(page: Page) {
  await page.getByRole('button', { name: 'Next', exact: true }).click()
}

async function gotoRooms(page: Page) {
  await pickDestination(page, 'mad', 'Madrid')
  await nextStep(page)
  await expect(roomsInput(page)).toBeVisible()
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
    await gotoRooms(page)
    await addRoom(page, 'dou', 'Double')
    await addRoom(page, 'dou', 'Double')
    await addRoom(page, 'twi', 'Twin')

    const chips = page.locator('[data-field="rooms"] [data-slot="combobox-chip"]')
    await expect(chips).toHaveCount(3)
    await expect(chips.filter({ hasText: 'Double' })).toHaveCount(2)
    await expect(page.locator('[data-slot="submitted-values"]')).toContainText('Nothing submitted yet')
  })

  test('Enter never submits, Backspace on empty input removes the last chip', async ({ page }) => {
    await gotoRooms(page)
    await addRoom(page, 'sui', 'Suite')
    const input = roomsInput(page)
    await input.press('Enter')
    await expect(page.locator('[data-slot="submitted-values"]')).toContainText('Nothing submitted yet')

    await expect(page.locator('[data-field="rooms"] [data-slot="combobox-chip"]')).toHaveCount(1)
    await input.press('Backspace')
    await expect(page.locator('[data-field="rooms"] [data-slot="combobox-chip"]')).toHaveCount(0)
  })

  test('phone is disabled until a room exists', async ({ page }) => {
    await gotoRooms(page)
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
    await expect(page.locator('[data-slot="submitted-values"]')).toContainText('Nothing submitted yet')

    await field.locator('[data-slot="combobox-clear"]').click()
    await expect(input).toHaveValue('')

    await pickDestination(page, 'lis', 'Lisbon')
    await nextStep(page)
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

    await nextStep(page)
    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)
    expect(values.destination).toBe('lis')
  })

  test('async searchableSelect loads, announces, and submits {value,label}', async ({ page }) => {
    const field = page.locator('[data-field="destinationAsync"]')
    const input = field.getByPlaceholder('Type to search…')
    await input.click()
    await input.pressSequentially('ma', { delay: 40 })
    await expect(page.locator('[data-slot="combobox-status"]')).toContainText('Loading')
    await expect(page.getByRole('option', { name: 'Madrid' })).toBeVisible()
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(input).toHaveValue('Madrid')

    await pickDestination(page, 'lis', 'Lisbon')
    await nextStep(page)
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

    await nextStep(page)
    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)
    expect(values.destinationAsync).toEqual({ value: 'mad', label: 'Madrid' })
  })

  test('async error state renders a failure status, not an empty list', async ({ page }) => {
    const input = page
      .locator('[data-field="destinationAsync"]')
      .getByPlaceholder('Type to search…')
    await input.click()
    await input.pressSequentially('error', { delay: 30 })
    await expect(page.locator('[data-slot="combobox-status"]')).toContainText(
      "Couldn't load results",
    )
  })

  test('a selected async chip survives a query change', async ({ page }) => {
    await page.getByRole('button', { name: 'Optional extras' }).click()
    const field = page.locator('[data-field="extras"]')
    const input = field.getByPlaceholder('Type to add extras')
    await input.click()
    await input.pressSequentially('cot', { delay: 40 })
    await expect(page.getByRole('option', { name: 'Cot' })).toBeVisible()
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(field.locator('[data-slot="combobox-chip"]')).toHaveCount(1)

    await input.pressSequentially('late', { delay: 40 })
    await expect(page.getByRole('option', { name: 'Late checkout' })).toBeVisible()
    await expect(field.locator('[data-slot="combobox-chip"]')).toHaveCount(1)
    await expect(field.locator('[data-slot="combobox-chip"]')).toContainText('Cot')
  })

  test('pointer drag reorders chips and the payload proves it (#46)', async ({ page }) => {
    await gotoRooms(page)
    await addRoom(page, 'dou', 'Double')
    await addRoom(page, 'twi', 'Twin')

    const chips = page.locator('[data-field="rooms"] [data-slot="combobox-chip"]')
    await expect(chips.nth(0)).toContainText('Double')
    const grips = page.locator('[data-field="rooms"] [data-slot="row-drag-grip"]')
    await expect(grips).toHaveCount(2)

    const from = await grips.nth(1).boundingBox()
    const to = await chips.nth(0).boundingBox()
    if (!from || !to) throw new Error('missing bounding boxes')
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(to.x + 4, to.y + to.height / 2, { steps: 8 })
    await page.mouse.up()

    await expect(chips.nth(0)).toContainText('Twin')
    await expect(
      page.locator('[data-field="rooms"] [data-slot="reorder-announcement"]'),
    ).toContainText('moved to position 1')

    for (const index of [0, 1]) {
      await page.getByRole('button', { name: index === 0 ? 'Edit Twin' : 'Edit Double' }).click()
      const modal = page.getByRole('dialog')
      await modal
        .locator(`[data-field^="rooms.${index}.board"] [data-slot="select-trigger"]`)
        .click()
      await page.getByRole('option', { name: 'Room only' }).click()
      await modal.getByRole('button', { name: 'Add Traveller' }).click()
      await modal.locator(`[data-field="rooms.${index}.travellers.0.name"] input`).fill('T')
      await modal
        .locator(`[data-field^="rooms.${index}.travellers.0.ageBand"] [data-slot="select-trigger"]`)
        .click()
      await page.getByRole('option', { name: 'Adult', exact: true }).click()
      await modal.getByRole('button', { name: 'Done' }).click()
    }

    await nextStep(page)
    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)
    const rooms = values.rooms as Record<string, unknown>[]
    expect(rooms.map((r) => r.value)).toEqual(['twin', 'double'])
  })

  test('grips absent without draggable; cards show grips with it', async ({ page }) => {
    await page.getByRole('button', { name: 'Optional extras' }).click()
    await expect(
      page.locator('[data-field="extras"] [data-slot="row-drag-grip"]'),
    ).toHaveCount(0)
    await gotoRooms(page)
    await page.getByRole('button', { name: 'Add Party room', exact: true }).click()
    await expect(
      page.locator('[data-field="partyRooms"] [data-slot="row-drag-grip"]'),
    ).toHaveCount(1)
  })

  test('per-row optionsFrom keys on the sibling and surfaces orphaned values (#47)', async ({
    page,
  }) => {
    await gotoRooms(page)
    await addRoom(page, 'dou', 'Double')
    await page.getByRole('button', { name: 'Edit Double' }).click()
    const modal = page.getByRole('dialog')
    await modal.locator('[data-field^="rooms.0.board"] [data-slot="select-trigger"]').click()
    await page.getByRole('option', { name: 'Room only' }).click()
    await modal.getByRole('button', { name: 'Add Traveller' }).click()
    await modal.locator('[data-field="rooms.0.travellers.0.name"] input').fill('Kit')

    const ageBand = modal.locator(
      '[data-field^="rooms.0.travellers.0.ageBand"] [data-slot="select-trigger"]',
    )
    const title = modal.locator(
      '[data-field^="rooms.0.travellers.0.title"] [data-slot="select-trigger"]',
    )

    await ageBand.click()
    await page.getByRole('option', { name: 'Child', exact: true }).click()
    await title.click()
    await expect(page.getByRole('option', { name: 'Master' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Mr', exact: true })).toHaveCount(0)
    await page.getByRole('option', { name: 'Miss' }).click()
    await modal.locator('[data-field="rooms.0.travellers.0.age"] input').fill('8')

    await ageBand.click()
    await page.getByRole('option', { name: 'Adult', exact: true }).click()
    await expect(title).toContainText('Choose one')
    await modal.getByRole('button', { name: 'Done' }).click()
    await nextStep(page)
    await page.getByRole('button', { name: 'Submit enquiry' }).click()

    const cleared = await submittedJson(page)
    const clearedTravellers = (cleared.rooms as Record<string, unknown>[])[0]
      ?.travellers as Record<string, unknown>[]
    expect(clearedTravellers[0]?.title ?? '').toBe('')

    await page.getByRole('tab', { name: /Rooms & party/ }).click()
    await page.getByRole('button', { name: 'Edit Double' }).click()
    await title.click()
    await page.getByRole('option', { name: 'Dr' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Done' }).click()
    await nextStep(page)
    await page.getByRole('button', { name: 'Submit enquiry' }).click()

    const values = await submittedJson(page)
    const rooms = values.rooms as Record<string, unknown>[]
    const travellers = rooms[0]?.travellers as Record<string, unknown>[]
    expect(travellers[0]).toMatchObject({ title: 'dr', ageBand: 'adult' })
  })

  test('inline nested combobox stays row-scoped without any dialog', async ({ page }) => {
    await gotoRooms(page)
    await page.getByRole('button', { name: 'Add Bunk room' }).click()
    await page.getByRole('button', { name: 'Add Bunk room' }).click()

    const bunk1 = page.locator('[data-field="bunkRooms.0.sleepers"]')
    const bunk2 = page.locator('[data-field="bunkRooms.1.sleepers"]')

    await addViaKeyboard(page, bunk1.getByPlaceholder('Type to add sleepers'), 'adu', 'Adult')
    await addViaKeyboard(page, bunk2.getByPlaceholder('Type to add sleepers'), 'chi', 'Child')

    await expect(bunk1.locator('[data-slot="combobox-chip"]')).toHaveCount(1)
    await expect(bunk2.locator('[data-slot="combobox-chip"]')).toHaveCount(1)
    await expect(bunk1.locator('[data-slot="combobox-chip"]')).toContainText('Adult')
    await expect(bunk2.locator('[data-slot="combobox-chip"]')).toContainText('Child')

    const input1 = bunk1.getByPlaceholder('Type to add sleepers')
    await input1.click()
    await input1.press('Backspace')
    await expect(bunk1.locator('[data-slot="combobox-chip"]')).toHaveCount(0)
    await expect(bunk2.locator('[data-slot="combobox-chip"]')).toHaveCount(1)
  })

  test('an unopened incomplete row surfaces a visible error on Next', async ({ page }) => {
    await gotoRooms(page)
    await addRoom(page, 'dou', 'Double')
    await nextStep(page)
    const field = page.locator('[data-field="rooms"]')
    await expect(field).toContainText('Complete room 1')
    await expect(page.locator('[data-slot="step-error-summary"]')).toBeVisible()
    await expect(page.locator('[data-slot="submitted-values"]')).toContainText('Nothing submitted yet')
  })

  test('Enter activates the chip edit button for keyboard users', async ({ page }) => {
    await gotoRooms(page)
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
    await gotoRooms(page)
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

    await nextStep(page)
    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)

    const rooms = values.rooms as Record<string, unknown>[]
    expect(rooms).toHaveLength(1)
    expect(rooms[0]).toMatchObject({ value: 'double', label: 'Double', board: 'bb' })

    const travellers = rooms[0]?.travellers as Record<string, unknown>[]
    expect(travellers[0]).toMatchObject({ name: 'Ana Example', ageBand: 'adult' })
    expect('age' in (travellers[0] ?? {})).toBe(false)
  })

  test('cardArray rows edit through the shared editor; nested combobox stays row-scoped (#39)', async ({
    page,
  }) => {
    await gotoRooms(page)
    await addRoom(page, 'dou', 'Double')

    await page.getByRole('button', { name: 'Add Party room', exact: true }).click()
    await page.getByRole('button', { name: 'Add Party room', exact: true }).click()

    const cards = page.locator('[data-field="partyRooms"] [data-row-index]')
    await expect(cards).toHaveCount(2)
    await expect(cards.nth(0)).toContainText('No travellers yet')

    await cards.nth(0).getByRole('button', { name: /Edit Party room 1/ }).click()
    const roomModal1 = page.getByRole('dialog').first()
    const trav1 = roomModal1.locator('[data-field="partyRooms.0.travellers"]')
    await addViaKeyboard(page, trav1.getByPlaceholder('Type to add travellers'), 'adu', 'Adult')
    await trav1.getByRole('button', { name: 'Edit Adult' }).click()
    const travModal = page.getByRole('dialog').last()
    const first = travModal.locator('[data-field="partyRooms.0.travellers.0.firstName"] input')
    await expect(first).toHaveAttribute('autocomplete', 'given-name')
    await first.fill('Ana')
    await travModal.locator('[data-field="partyRooms.0.travellers.0.lastName"] input').fill('One')
    await travModal.getByRole('button', { name: 'Done' }).click()
    await roomModal1.getByRole('button', { name: 'Done' }).click()

    await cards.nth(1).getByRole('button', { name: /Edit Party room 2/ }).click()
    const roomModal2 = page.getByRole('dialog').first()
    const trav2 = roomModal2.locator('[data-field="partyRooms.1.travellers"]')
    await addViaKeyboard(page, trav2.getByPlaceholder('Type to add travellers'), 'chi', 'Child')
    await expect(trav2.locator('[data-slot="combobox-chip"]')).toHaveCount(1)
    await trav2.getByRole('button', { name: 'Edit Child' }).click()
    const travModal2 = page.getByRole('dialog').last()
    await travModal2.locator('[data-field="partyRooms.1.travellers.0.firstName"] input').fill('Kit')
    await travModal2.locator('[data-field="partyRooms.1.travellers.0.lastName"] input').fill('Two')
    await travModal2.getByRole('button', { name: 'Done' }).click()
    await roomModal2.getByRole('button', { name: 'Done' }).click()

    await expect(cards.nth(0)).toContainText('Travellers assigned')

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

    await nextStep(page)
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

test.describe('accordion container', () => {
  test('values added inside survive collapsing the section', async ({ page }) => {
    await page.goto('/demo/form')
    await page.getByRole('button', { name: 'Optional extras' }).click()
    const field = page.locator('[data-field="extras"]')
    const input = field.getByPlaceholder('Type to add extras')
    await input.click()
    await input.pressSequentially('cot', { delay: 40 })
    await expect(page.getByRole('option', { name: 'Cot' })).toBeVisible()
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(field.locator('[data-slot="combobox-chip"]')).toHaveCount(1)

    await page.getByRole('button', { name: 'Optional extras' }).click()
    await expect(field).toBeHidden()
    await page.getByRole('button', { name: 'Optional extras' }).click()
    await expect(field.locator('[data-slot="combobox-chip"]')).toHaveCount(1)

    await pickDestination(page, 'mad', 'Madrid')
    await nextStep(page)
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
    await nextStep(page)
    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)
    expect(values.extras).toEqual([{ value: 'cot', label: 'Cot' }])
  })
})

test.describe('trivial nine (#56-#64)', () => {
  test('the details step submits every trivial type with its contracted shape', async ({
    page,
  }) => {
    await page.goto('/demo/form')
    await pickDestination(page, 'mad', 'Madrid')
    await nextStep(page)
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
    await nextStep(page)

    await expect(page.locator('[data-field="intro"]')).toContainText('Almost done')
    await expect(page.locator('[data-field="holdWarning"]')).toContainText('20 minutes')
    await expect(page.locator('[data-field="campaign"]')).toHaveCount(0)

    await page.locator('[data-field="tripName"] input').fill('Summer Escape 2026')
    const slugInput = page.locator('[data-field="tripSlug"] input')
    await expect(slugInput).toHaveValue('summer-escape-2026')
    await slugInput.fill('my custom trip')
    await expect(slugInput).toHaveValue('my-custom-trip')
    await page.locator('[data-field="tripName"] input').fill('Changed Again')
    await expect(slugInput).toHaveValue('my-custom-trip')
    await page
      .locator('[data-field="tripSlug"]')
      .getByRole('button', { name: 'Regenerate from source' })
      .click()
    await expect(slugInput).toHaveValue('changed-again')

    const password = page.locator('[data-field="accountPassword"] input')
    await expect(password).toHaveAttribute('type', 'password')
    await expect(password).toHaveAttribute('autocomplete', 'new-password')
    await password.fill('hunter22222')

    await page.locator('[data-field="marketingOptIn"] [role="switch"]').click()
    await page.locator('[data-field="brandColor"] input').fill('#ff6600')
    await page.locator('[data-field="budget"] input').fill('149.50')

    const amenities = page.locator('[data-field="amenities"]')
    const amenityInput = amenities.getByPlaceholder('Type to add…')
    await amenityInput.click()
    await amenityInput.pressSequentially('poo', { delay: 30 })
    await expect(page.getByRole('option', { name: 'Pool' })).toBeVisible()
    await amenityInput.press('Enter')
    await amenityInput.pressSequentially('gym', { delay: 30 })
    await expect(page.getByRole('option', { name: 'Gym' })).toBeVisible()
    await amenityInput.press('Enter')
    await expect(amenities.locator('[data-slot="combobox-chip"]')).toHaveCount(2)

    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)
    expect(values.tripName).toBe('Changed Again')
    expect(values.tripSlug).toBe('changed-again')
    expect(values.accountPassword).toBe('•••')
    expect(values.marketingOptIn).toBe(true)
    expect(values.brandColor).toBe('#ff6600')
    expect(values.budget).toBe(14950)
    expect(values.amenities).toEqual(['pool', 'gym'])
    expect(values.campaign).toBe('summer-24')
  })
})

test.describe('option cards, dates, numeric (#65-#72)', () => {
  test('cards, tabs, dates, slider and steppers submit their contracted shapes', async ({
    page,
  }) => {
    await page.goto('/demo/form')

    await page.locator('[data-field="travelStyle"]').getByText('Explore').click()
    await page.locator('[data-field="season"]').getByRole('button', { name: 'Summer' }).click()
    const boards = page.locator('[data-field="boards"]')
    await boards.getByText('Bed & breakfast').click()
    await boards.getByText('Half board').click()
    await expect(boards.getByRole('checkbox', { name: /All inclusive/ })).toBeDisabled()

    await pickDestination(page, 'mad', 'Madrid')
    await nextStep(page)
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
    await nextStep(page)

    await page.locator('[data-field="checkIn"] input').fill('2030-01-15')

    await page.locator('[data-field="stay"] button').first().click()
    const grid = page.getByRole('dialog').getByRole('grid').first()
    await grid.getByText('10', { exact: true }).first().click()
    await grid.getByText('14', { exact: true }).first().click()
    await page.keyboard.press('Escape')

    const slider = page.locator('[data-field="flexibility"]').getByRole('slider').first()
    await slider.focus()
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight')

    const roomCounts = page.locator('[data-field="roomCounts"]')
    await roomCounts
      .locator('[data-option="standard"]')
      .getByRole('button', { name: 'More Standard' })
      .click()
    await roomCounts
      .locator('[data-option="standard"]')
      .getByRole('button', { name: 'More Standard' })
      .click()
    await roomCounts
      .locator('[data-option="deluxe"]')
      .getByRole('button', { name: 'More Deluxe' })
      .click()

    await page
      .locator('[data-field="transfers"] [data-option="airport"]')
      .getByRole('button', { name: 'More Airport pickup' })
      .click()

    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    const values = await submittedJson(page)
    expect(values.travelStyle).toBe('explore')
    expect(values.season).toBe('summer')
    expect(values.boards).toEqual(['bb', 'hb'])
    expect(values.checkIn).toBe('2030-01-15')
    const stay = values.stay as { start: string; end: string }
    expect(stay.start < stay.end).toBe(true)
    expect(values.flexibility).toBe(3)
    expect(values.roomCounts).toEqual({ standard: 2, deluxe: 1 })
    expect(values.transfers).toEqual({ airport: 1 })
  })
})

test.describe('wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/form')
    await expect(page.getByRole('heading', { name: 'Every form field' })).toBeVisible()
  })

  test('Next validates only the current step, in words', async ({ page }) => {
    await nextStep(page)
    const summary = page.locator('[data-slot="step-error-summary"]')
    await expect(summary).toContainText('Destination is required')
    await expect(summary).not.toContainText('room')
    await expect(page.getByRole('tab', { name: /Trip/ })).toHaveAttribute('data-error', 'true')
  })

  test('completing a step marks the tab, fires confetti, and back-navigation keeps values', async ({
    page,
  }) => {
    await pickDestination(page, 'mad', 'Madrid')
    await nextStep(page)
    await expect(roomsInput(page)).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.getByRole('tab', { name: /Trip/ })).toHaveAttribute('data-completed', 'true')
    await page.getByRole('tab', { name: /Trip/ }).click()
    await expect(
      page.locator('[data-field="destination"]').getByPlaceholder('Search destinations…'),
    ).toHaveValue('Madrid')
  })

  test('reduced motion means no confetti', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/demo/form')
    await pickDestination(page, 'mad', 'Madrid')
    await nextStep(page)
    await expect(roomsInput(page)).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
  })

  test('submit failure sweeps to the first invalid step', async ({ page }) => {
    await page.goto('/demo/form?step=2')
    await page.getByRole('button', { name: 'Submit enquiry' }).click()
    await expect(page.locator('[data-slot="step-error-summary"]')).toContainText(
      'Destination is required',
    )
    await expect(page.getByRole('tab', { name: /Trip/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('resumption opens at the requested step with earlier steps completed', async ({ page }) => {
    await page.goto('/demo/form?step=1')
    await expect(roomsInput(page)).toBeVisible()
    await expect(page.getByRole('tab', { name: /Trip/ })).toHaveAttribute('data-completed', 'true')
  })
})
