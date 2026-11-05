import { expect, test, type Page } from '@playwright/test'

const day = '2024-02-29'
async function openPersonalPicker(page: Page, selectedDay = day) {
  await page.goto(`/day/${selectedDay}?write=1`)
  await page.getByRole('textbox', { name: 'Nội dung ghi chú' }).fill('Một dấu nhớ từ bàn phím của mình.')
  await page.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click()
  await page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true }).click()
}

test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-11-06T03:00:00Z')) })

test('first writer can open personal sticker entry instead of a fixed-only catalog', async ({ page }) => {
  await openPersonalPicker(page)
  await expect(page.getByRole('tab', { name: 'Sticker của bạn', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('textbox', { name: 'Dán sticker hoặc nhập emoji' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chọn ảnh từ thiết bị', exact: true })).toBeVisible()
})

test('keyboard emoji is explicitly saved and shown on the day and calendar after reload', async ({ page }) => {
  await openPersonalPicker(page)
  await page.getByRole('textbox', { name: 'Dán sticker hoặc nhập emoji' }).fill('🌿')
  await page.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(page.locator('.daily-sticker-emoji')).toHaveText('🌿')
  await page.reload()
  await expect(page.locator('.daily-sticker-emoji')).toHaveText('🌿')
  await page.getByRole('link', { name: 'Trở về lịch kỷ niệm', exact: true }).click()
  await expect(page.getByRole('button', { name: `Mở ngày ${day}`, exact: true }).locator('.calendar-sticker-emoji')).toHaveText('🌿')
})

test('pasted image is stored locally and survives reload with the same day and calendar reference', async ({ page }) => {
  const external: string[] = []
  page.on('request', (request) => { const url = new URL(request.url()); if (['http:', 'https:'].includes(url.protocol) && url.hostname !== '127.0.0.1') external.push(url.hostname) })
  await openPersonalPicker(page)
  await page.getByRole('textbox', { name: 'Dán sticker hoặc nhập emoji' }).evaluate(async (element) => {
    const blob = await (await fetch('/stickers/sticker-014.png')).blob()
    const data = new DataTransfer()
    data.items.add(new File([blob], 'cut-subject.png', { type: 'image/png' }))
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
  })
  await expect(page.locator('.personal-library-option')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Lưu sticker', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(page.locator('.daily-sticker-badge')).toHaveAttribute('data-sticker-id', /^personal-/)
  const reference = await page.locator('.daily-sticker-badge').getAttribute('data-sticker-id')
  expect(reference).toMatch(/^personal-/)
  await expect(page.locator('.daily-sticker-image[data-image-state="loaded"]')).toBeVisible()
  await page.reload()
  await expect(page.locator('.daily-sticker-image[data-image-state="loaded"]')).toBeVisible()
  await expect(page.locator('.daily-sticker-badge')).toHaveAttribute('data-sticker-id', reference!)
  await page.getByRole('link', { name: 'Trở về lịch kỷ niệm', exact: true }).click()
  await expect(page.getByRole('button', { name: `Mở ngày ${day}`, exact: true }).locator('.calendar-memory')).toHaveAttribute('data-sticker-id', reference!)
  await expect(page.locator('.calendar-sticker-image[data-image-state="loaded"]')).toBeVisible()
  expect(external).toEqual([])
})

test('device image fallback populates a reusable personal library', async ({ page }) => {
  await openPersonalPicker(page)
  await page.getByLabel('Ảnh sticker từ thiết bị').setInputFiles('public/stickers/sticker-015.png')
  await expect(page.locator('.personal-library-option')).toHaveCount(1)
  await page.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await openPersonalPicker(page, '2024-03-01')
  await expect(page.locator('.personal-library-option')).toHaveCount(1)
  await page.getByRole('button', { name: 'Chọn sticker cá nhân 1', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(page.locator('.daily-sticker-image[data-image-state="loaded"]')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('native image insertion is accepted without requiring a file-input event', async ({ page }) => {
  await openPersonalPicker(page)
  await page.getByRole('textbox', { name: 'Dán sticker hoặc nhập emoji' }).evaluate(async (element) => {
    const blob = await (await fetch('/stickers/sticker-014.png')).blob()
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(blob)
    })
    const image = document.createElement('img')
    image.src = dataUrl
    element.append(image)
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }))
  })
  await expect(page.locator('.personal-library-option')).toHaveCount(1)
  await page.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(page.locator('.daily-sticker-image[data-image-state="loaded"]')).toBeVisible()
})

test('metadata save failure keeps the imported image reusable without assigning the day', async ({ page }) => {
  await openPersonalPicker(page)
  await page.getByLabel('Ảnh sticker từ thiết bị').setInputFiles('public/stickers/sticker-014.png')
  await expect(page.getByRole('button', { name: 'Lưu sticker', exact: true })).toBeEnabled()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'our-stories:mock-notes:v1') throw new DOMException('Personal sticker metadata quota failure', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Personal sticker metadata quota failure')
  await expect(page.locator('.personal-library-option')).toHaveCount(1)
  await page.getByRole('button', { name: 'Đóng bộ chọn sticker', exact: true }).click()
  await expect(page.locator('.daily-sticker-badge')).not.toHaveAttribute('data-sticker-id', /personal-/)
  await page.reload()
  await page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true }).click()
  await expect(page.locator('.personal-library-option')).toHaveCount(1)
})

test('unsupported images and external HTML are rejected without importing remote content', async ({ page }) => {
  await openPersonalPicker(page)
  const external: string[] = []
  page.on('request', (request) => { if (request.url().includes('outside.invalid')) external.push(request.url()) })
  await page.getByRole('textbox', { name: 'Dán sticker hoặc nhập emoji' }).evaluate((element) => {
    const data = new DataTransfer()
    data.setData('text/html', '<img src="https://outside.invalid/private.png"><script>alert(1)</script>')
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
  })
  await expect(page.getByRole('alert')).toContainText('Bàn phím chưa gửi ảnh')
  await page.getByLabel('Ảnh sticker từ thiết bị').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>') })
  await expect(page.getByRole('alert')).toContainText('Chỉ nhận ảnh PNG')
  await expect(page.locator('.personal-library-option')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Lưu sticker', exact: true })).toBeDisabled()
  expect(external).toEqual([])
})

test('unavailable device storage does not claim image success and still permits an emoji', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined }))
  await openPersonalPicker(page)
  await page.getByLabel('Ảnh sticker từ thiết bị').setInputFiles('public/stickers/sticker-014.png')
  await expect(page.getByRole('alert')).toContainText('Trình duyệt không cho lưu sticker')
  await expect(page.getByRole('button', { name: 'Lưu sticker', exact: true })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Dán sticker hoặc nhập emoji' }).fill('💛')
  await page.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(page.locator('.daily-sticker-emoji')).toHaveText('💛')
})

test('missing local image remains honestly marked without reassigning first-writer history', async ({ page }) => {
  await openPersonalPicker(page)
  await page.getByLabel('Ảnh sticker từ thiết bị').setInputFiles('public/stickers/sticker-014.png')
  await page.getByRole('button', { name: 'Lưu sticker', exact: true }).click()
  await expect(page.locator('.daily-sticker-image[data-image-state="loaded"]')).toBeVisible()
  const id = await page.locator('.daily-sticker-badge').getAttribute('data-sticker-id')
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('our-stories-personal-stickers')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Unexpected open database connection'))
  }))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Ảnh sticker không còn trên thiết bị', exact: true })).toBeVisible()
  await expect(page.locator('.daily-sticker-badge')).toHaveAttribute('data-sticker-id', id!)
  await expect(page.getByRole('button', { name: 'Chọn sticker cho ngày', exact: true })).toHaveCount(0)
})
