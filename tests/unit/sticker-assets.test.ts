import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { getSticker, isStickerId, stickerCatalog } from '../../src/features/stickers/stickerCatalog'

function rgbaPng(path: string) {
  const data = readFileSync(resolve('public', path.replace(/^\//, '')))
  expect(data.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const width = data.readUInt32BE(16)
  const height = data.readUInt32BE(20)
  expect(data[24]).toBe(8)
  expect(data[25]).toBe(6) // PNG RGBA, not opaque RGB.
  const chunks: Buffer[] = []
  for (let offset = 8; offset < data.length;) {
    const size = data.readUInt32BE(offset)
    if (data.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(data.subarray(offset + 8, offset + 8 + size))
    offset += size + 12
  }
  const filtered = inflateSync(Buffer.concat(chunks))
  const stride = width * 4
  const pixels = Buffer.alloc(stride * height)
  const paeth = (left: number, up: number, corner: number) => {
    const p = left + up - corner
    const a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - corner)
    return a <= b && a <= c ? left : b <= c ? up : corner
  }
  for (let y = 0; y < height; y++) {
    const filter = filtered[y * (stride + 1)]!
    expect(filter).toBeLessThanOrEqual(4)
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x
      const left = x >= 4 ? pixels[index - 4]! : 0
      const up = y ? pixels[index - stride]! : 0
      const corner = y && x >= 4 ? pixels[index - stride - 4]! : 0
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, corner)][filter]!
      pixels[index] = (filtered[y * (stride + 1) + x + 1]! + predictor) & 255
    }
  }
  return { width, height, pixels, bytes: data.length }
}

describe('locally extracted sticker delivery', () => {
  it('contains fifteen stable, uniquely resolvable local assets', () => {
    expect(stickerCatalog).toHaveLength(15)
    expect(new Set(stickerCatalog.map((sticker) => sticker.id)).size).toBe(15)
    expect(getSticker('sticker-001')?.name).toBe('Ly kem sô-cô-la')
    expect(getSticker('sticker-015')?.name).toBe('Ly trà trái cây')
    expect(getSticker('sticker-016')).toBeUndefined()
    expect(isStickerId(null)).toBe(false)
    expect(isStickerId('../sticker-001')).toBe(false)
    expect(isStickerId('sticker-014')).toBe(true)
  })

  it.each(stickerCatalog)('$id is transparent RGBA with an optimized calendar thumbnail', (sticker) => {
    const full = rgbaPng(sticker.src)
    const thumb = rgbaPng(sticker.thumbnailSrc)
    expect([full.width, full.height]).toEqual([sticker.width, sticker.height])
    expect(Math.max(thumb.width, thumb.height)).toBe(96)
    expect(Math.abs(thumb.width / thumb.height - full.width / full.height)).toBeLessThan(0.03)
    expect(full.bytes).toBeLessThan(256 * 1024)
    expect(thumb.bytes).toBeLessThan(40 * 1024)
    const alpha = []
    for (let index = 3; index < full.pixels.length; index += 4) alpha.push(full.pixels[index]!)
    expect(alpha.some((value) => value === 0)).toBe(true)
    expect(alpha.some((value) => value === 255)).toBe(true)
    expect(alpha.some((value) => value > 0 && value < 255)).toBe(true)
    expect(full.pixels[3]).toBe(0)
  })
})
