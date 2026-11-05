import { expect, test, type Page } from '@playwright/test'

const day = '2024-02-29'

async function writeFirstNote(page: Page) {
  await page.goto(`/day/${day}?write=1`)
  await page.getByRole('textbox', { name: 'Nội dung ghi chú' }).fill('Một ngày mới để chọn dấu nhớ ☕')
  await page.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click()
  await expect(page.locator('.first-writer-info')).toContainText('Người viết đầu tiên: Bạn')
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-05T03:00:00Z'))
})

test('first writer selects by keyboard, confirms once and keeps the same sticker on calendar and day after deletion', async ({ page }, testInfo) => {
  await writeFirstNote(page)
  await page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true }).click()
  const picker = page.getByRole('dialog', { name: 'Chọn sticker cho ngày', exact: true })
  await picker.getByRole('tab', { name: 'Bộ mẫu', exact: true }).click()
  await expect(picker.getByRole('radio')).toHaveCount(15)
  await expect(picker.getByRole('button', { name: 'Lưu sticker', exact: true })).toBeDisabled()
  const first = picker.locator('input[type="radio"][value="sticker-001"]')
  await first.focus()
  await first.press('Space')
  await first.press('ArrowRight')
  await expect(picker.locator('input[type="radio"][value="sticker-002"]')).toBeChecked()
  await expect(page.locator('.daily-sticker-image')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('sticker-picker.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await picker.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth)).toBe(true)
  await picker.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(picker).not.toBeVisible()
  await expect(page.locator('.daily-sticker-image img')).toHaveAttribute('src', '/stickers/sticker-002.png')
  await expect(page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.daily-sticker-image img')).toHaveAttribute('src', '/stickers/sticker-002.png')
  const note = page.locator('.note-card').first()
  await note.locator('.note-actions summary').click()
  await note.getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
  await expect(page.locator('.daily-sticker-image img')).toHaveAttribute('src', '/stickers/sticker-002.png')
  await expect(page.locator('.first-writer-info')).toContainText('Người viết đầu tiên: Bạn')
  await page.getByRole('link', { name: 'Trở về lịch kỷ niệm', exact: true }).click()
  await expect(page.getByRole('button', { name: `Mở ngày ${day}`, exact: true }).locator('img')).toHaveAttribute('src', '/stickers/thumbs/sticker-002.png')
  await page.getByRole('button', { name: 'Lọc lịch theo Gia Hân', exact: true }).click()
  await expect(page.getByRole('button', { name: `Mở ngày ${day}`, exact: true }).locator('img')).toHaveAttribute('src', '/stickers/thumbs/sticker-002.png')
  await expect(page.locator('.calendar-legend')).toContainText('0 ghi chú')
})

test('legacy days show unknown attribution instead of a selectable pending state', async ({ page }) => {
  await page.addInitScript(() => {
    const legacyNote = {
      id: 'legacy-note', dayKey: '2024-02-29', authorUid: 'legacy-writer', authorName: 'Người viết cũ',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Một ghi chú từ dữ liệu cũ.' }] }] },
      createdAt: '2024-02-29T05:00:00.000Z', updatedAt: '2024-02-29T05:00:00.000Z',
      revision: 1, deleted: false, revisions: [],
    }
    localStorage.setItem('our-stories:mock-notes:v1', JSON.stringify([legacyNote]))
  })
  await page.goto(`/calendar?month=2024-02&day=${day}`)
  const date = page.getByRole('button', { name: `Mở ngày ${day}`, exact: true })
  await expect(date.locator('.calendar-sticker-pending')).toContainText('Chưa rõ')
  await expect(date.locator('.calendar-sticker-pending')).not.toContainText('Chờ chọn')
  await date.click()
  await expect(page.locator('.first-writer-info')).toContainText('Chưa xác định người viết đầu tiên từ dữ liệu mẫu cũ.')
  await expect(page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true })).toHaveCount(0)
})

test('pending selection can be cancelled and fixture first writers do not grant another user the picker', async ({ page }) => {
  await writeFirstNote(page)
  await page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true }).click()
  await page.getByRole('dialog', { name: 'Chọn sticker cho ngày', exact: true }).press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true })).toBeVisible()
  await expect(page.locator('.daily-sticker-image')).toHaveCount(0)
  await page.goto('/day/2026-11-05')
  await expect(page.locator('.first-writer-info')).toContainText('Người viết đầu tiên: An Nhiên (mẫu)')
  await expect(page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true })).toHaveCount(0)
})

test('a failed image disables only that sticker option and keeps the picker usable', async ({ page }) => {
  await page.route('**/stickers/thumbs/sticker-001.png', (route) => route.fulfill({ status: 404, body: 'not found' }))
  await writeFirstNote(page)
  await page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true }).click()
  const picker = page.getByRole('dialog', { name: 'Chọn sticker cho ngày', exact: true })
  await picker.getByRole('tab', { name: 'Bộ mẫu', exact: true }).click()
  await expect(picker.locator('input[type="radio"][value="sticker-001"]')).toBeDisabled()
  await expect(picker.locator('input[type="radio"][value="sticker-002"]')).toBeEnabled()
  await expect(picker.getByRole('button', { name: 'Lưu sticker', exact: true })).toBeDisabled()
  await expect(picker.locator('.sticker-picker-image-warning')).toBeVisible()
})

test('failed local persistence keeps the chosen option and pending day metadata without claiming assignment', async ({ page }) => {
  await writeFirstNote(page)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'our-stories:mock-notes:v1') throw new DOMException('Test storage quota failure', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true }).click()
  const picker = page.getByRole('dialog', { name: 'Chọn sticker cho ngày', exact: true })
  await picker.getByRole('tab', { name: 'Bộ mẫu', exact: true }).click()
  const selected = picker.locator('input[type="radio"][value="sticker-002"]')
  await selected.focus()
  await selected.press('Space')
  await picker.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(picker.getByRole('alert')).toContainText('Test storage quota failure')
  await expect(selected).toBeChecked()
  await expect(picker).toBeVisible()
  await picker.getByRole('button', { name: 'Đóng bộ chọn sticker', exact: true }).click()
  await expect(page.locator('.daily-sticker-image')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.daily-sticker-image')).toHaveCount(0)
})

test('an unseen delayed thumbnail cannot be confirmed before it loads or after it fails', async ({ page }) => {
  let release: () => void = () => {}
  const held = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/stickers/thumbs/sticker-001.png', async (route) => {
    await held
    await route.fulfill({ status: 404, body: 'delayed image failure' })
  })
  try {
    await writeFirstNote(page)
    await page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true }).click()
    const picker = page.getByRole('dialog', { name: 'Chọn sticker cho ngày', exact: true })
    await picker.getByRole('tab', { name: 'Bộ mẫu', exact: true }).click()
    const option = picker.locator('input[type="radio"][value="sticker-001"]')
    await option.focus()
    await option.press('Space')
    await expect(option).toBeChecked()
    await expect(picker.getByRole('button', { name: 'Lưu sticker', exact: true })).toBeDisabled()
    release()
    await expect(option).toBeDisabled()
    await expect(picker.getByRole('button', { name: 'Lưu sticker', exact: true })).toBeDisabled()
    await picker.getByRole('button', { name: 'Đóng bộ chọn sticker', exact: true }).click()
    await expect(page.locator('.daily-sticker-image')).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true })).toBeVisible()
  } finally { release() }
})
