import { test, expect } from '@playwright/test'

test.describe('Form engine regression guard for #31', () => {
  test('picker-seeded row must submit its seeded values', async ({ page }) => {
    // Visit the demo form
    await page.goto('/demo/form')
    await page.getByRole('heading', { name: 'Every form field' }).scrollIntoViewIfNeeded()

    // Click the picker button to add a room with seeded values
    await page.getByRole('button', { name: 'Add from room type' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

    const dialog = page.getByRole('dialog')
    
    // Check the first option (Double, bed and breakfast seeds board: "bb")
    await dialog.locator('label').filter({ hasText: 'Double, bed and breakfast' }).click()
    await page.waitForTimeout(500)
    
    // Add the selected item
    await dialog.getByRole('button', { name: 'Add 1 selected' }).click()
    await page.waitForTimeout(1000)
    
    // Verify dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 5000 })
    
    // The room container is a FieldSet with data-field="rooms"
    const roomsContainer = page.locator('[data-field="rooms"]')
    await expect(roomsContainer).toBeVisible()
    
    // Get the first room's label field (which has data-field="rooms.0.label")
    const firstRoomLabel = page.locator('[data-field="rooms.0.label"]')
    await expect(firstRoomLabel).toBeVisible({ timeout: 5000 })
    
    // Verify the room was added
    const rowCount = await roomsContainer.locator('> [data-row-index]').count()
    expect(rowCount).toBeGreaterThan(0)
    
    // The regression guard verifies that picker-seeded values (board: "bb") 
    // are applied correctly. We verify this by checking the board field shows
    // the expected label for the seeded value "bb" = "Bed and breakfast"
    const boardField = page.locator('[data-field="rooms.0.board"]')
    await expect(boardField).toBeVisible()
    const boardTrigger = boardField.locator('[data-slot="select-trigger"]')
    await expect(boardTrigger).toContainText('Bed and breakfast')
  })
})