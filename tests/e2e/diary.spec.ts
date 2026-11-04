import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-05T03:00:00Z'))
})

test('month calendar renders without overflow and selects a day', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/calendar')
  await expect(page.getByRole('heading', { name: 'Cùng nhau, qua từng ngày.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'tháng 11 năm 2026' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mở ngày 2026-11-05', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('calendar.png'), fullPage: true })
  await page.getByRole('button', { name: 'Mở ngày 2026-11-12', exact: true }).click()
  await expect(page.getByRole('heading', { name: '12 tháng 11', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('navigates to a historical month and keeps notes on their original date', async ({ page }) => {
  await page.goto('/calendar')
  await page.getByRole('button', { name: 'Tháng trước', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'tháng 10 năm 2026' })).toBeVisible()
  await page.getByRole('button', { name: 'Mở ngày 2026-10-15', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Trang nhật ký ngày' }).getByText('Một kỷ niệm của tháng trước.', { exact: false })).toBeVisible()
})

test('creates a formatted mock note and preserves its JSON on reload', async ({ page }, testInfo) => {
  await page.goto('/day/2024-02-29')
  await page.getByRole('button', { name: 'Viết một ghi chú', exact: true }).click()
  await page.getByRole('button', { name: 'Chữ đậm', exact: true }).click()
  const editor = page.getByRole('textbox', { name: 'Nội dung ghi chú' })
  await editor.pressSequentially('Kỷ niệm của mình 🌿')
  await editor.press('Enter')
  await page.getByRole('button', { name: 'Chữ đậm', exact: true }).click()
  await editor.pressSequentially('Một dòng mới vẫn còn nguyên.')
  await page.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Đã lưu trên trình duyệt')
  await page.reload()
  await expect(page.locator('.note-card strong')).toContainText('Kỷ niệm của mình 🌿')
  await expect(page.locator('.note-card p').filter({ hasText: 'Một dòng mới vẫn còn nguyên.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '29 tháng 2', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('day-note.png'), fullPage: true })
})

test('keeps an unsaved draft through navigation and reload', async ({ page }) => {
  await page.goto('/day/2024-02-29')
  await page.getByRole('button', { name: 'Viết một ghi chú', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nội dung ghi chú' }).fill('Bản nháp vẫn ở đây 💛')
  await page.getByRole('link', { name: 'Trở về lịch kỷ niệm' }).click()
  await page.goto('/day/2024-02-29')
  await page.getByRole('button', { name: 'Viết một ghi chú', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Nội dung ghi chú' })).toContainText('Bản nháp vẫn ở đây 💛')
  await expect(page.getByText('Đã khôi phục bản nháp trên thiết bị này.')).toBeVisible()
})

test('edits a mock note with history then soft-deletes without discarding it', async ({ page }) => {
  await page.goto('/day/2026-11-05')
  const note = page.locator('.note-card').first()
  await note.locator('summary').first().click()
  await note.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nội dung ghi chú' }).fill('Nội dung mẫu đã sửa.')
  await page.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click()
  await expect(note.getByText('Nội dung mẫu đã sửa.', { exact: true })).toBeVisible()
  await note.locator('.revision-history summary').click()
  await expect(note.locator('.revision-entry')).toContainText('Cốc cà phê vẫn còn ấm')
  await note.getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ẩn ghi chú', exact: true }).click()
  await page.locator('.deleted-notes summary').click()
  await expect(page.locator('.deleted-notes')).toContainText('Nội dung mẫu đã sửa.')
})

test('rejects unsafe links while retaining the draft', async ({ page }) => {
  await page.goto('/day/2024-02-29?write=1')
  await page.getByRole('textbox', { name: 'Nội dung ghi chú' }).fill('Một bản nháp an toàn')
  await page.getByRole('button', { name: 'Chèn liên kết' }).click()
  await page.getByLabel('Liên kết (https:// hoặc http://)').fill('javascript:alert(1)')
  await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('https:// hoặc http://')
  await expect(page.getByRole('textbox', { name: 'Nội dung ghi chú' })).toContainText('Một bản nháp an toàn')
})

test('shows a mock revision conflict and keeps the unsaved draft', async ({ page }) => {
  await page.goto('/day/2026-11-05')
  const note = page.locator('.note-card').first()
  await note.locator('summary').first().click()
  await note.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nội dung ghi chú' }).fill('Bản nháp của tôi phải được giữ.')
  await page.evaluate(() => {
    const key = 'our-stories:mock-notes:v1'
    // Seed the fixture state just as another local tab would, without a cloud write.
    const editorContent = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bản mới từ tab mẫu.' }] }] }
    const draft = sessionStorage.getItem('our-stories:mock-draft:2026-11-05:sample-1')
    if (!draft) throw new Error('Expected a saved local draft.')
    const now = '2026-11-05T03:00:00.000Z'
    localStorage.setItem(key, JSON.stringify([{ id: 'sample-1', dayKey: '2026-11-05', authorUid: 'mock-member-0', authorName: 'An Nhiên',
      content: editorContent, createdAt: now, updatedAt: now, revision: 2, deleted: false, revisions: [] }]))
  })
  await page.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Bản nháp của bạn vẫn được giữ lại')
  await expect(page.getByRole('textbox', { name: 'Nội dung ghi chú' })).toContainText('Bản nháp của tôi phải được giữ.')
  await expect(page.locator('.conflict-box')).toContainText('Bản mới từ tab mẫu.')
})

test('invalid dates and unknown routes have a recovery path', async ({ page }) => {
  await page.goto('/day/2026-02-30')
  await expect(page.getByRole('heading', { name: 'Chưa tìm thấy trang' })).toBeVisible()
  await page.getByRole('link', { name: 'Trở về lịch', exact: true }).click()
  await expect(page).toHaveURL(/\/calendar$/)
  await page.goto('/missing-page')
  await expect(page.getByRole('heading', { name: 'Chưa tìm thấy trang' })).toBeVisible()
})

test('join placeholder never authenticates or connects to external services', async ({ page }) => {
  const external: string[] = []
  page.on('request', (request) => { if (new URL(request.url()).hostname !== '127.0.0.1') external.push(new URL(request.url()).hostname) })
  await page.goto('/join/mock-diary/mock-invite-not-a-token')
  await expect(page.getByRole('heading', { name: 'Luồng đăng nhập chưa được bật' })).toBeVisible()
  await page.getByRole('link', { name: 'Khám phá bản mẫu' }).click()
  await expect(page.getByRole('heading', { name: 'Cùng nhau, qua từng ngày.' })).toBeVisible()
  expect(external).toEqual([])
})
