import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { inspectStickerImage } from '../../src/features/stickers/image-file'

describe('personal image limits before bitmap decoding', () => {
  it('reads actual PNG fixture dimensions without changing the image', () => {
    const png = readFileSync('public/stickers/sticker-014.png')
    expect(inspectStickerImage(png, 'image/png')).toEqual({ width: 221, height: 223 })
  })
  it('rejects a compressed PNG declaring a huge bitmap before browser decoding', () => {
    const header = Buffer.from(readFileSync('public/stickers/sticker-014.png').subarray(0, 32))
    header.writeUInt32BE(50_000, 16)
    expect(() => inspectStickerImage(header, 'image/png')).toThrow(/4096/)
  })
  it.each(['image/svg+xml', 'text/html', 'image/heic', 'image/gif'])('rejects unsupported MIME %s', (mime) => {
    expect(() => inspectStickerImage(new TextEncoder().encode('<svg></svg>'), mime)).toThrow()
  })
  it('validates JPEG segment dimensions and rejects truncated data', () => {
    const jpegHeader = Uint8Array.from([255, 216, 255, 192, 0, 7, 8, 0, 100, 0, 200])
    expect(inspectStickerImage(jpegHeader, 'image/jpeg')).toEqual({ width: 200, height: 100 })
    expect(() => inspectStickerImage(jpegHeader.slice(0, 8), 'image/jpeg')).toThrow()
  })
  it('reads extended WebP dimensions', () => {
    const header = Buffer.alloc(30)
    header.write('RIFF', 0); header.write('WEBP', 8); header.write('VP8X', 12)
    header.writeUIntLE(299, 24, 3); header.writeUIntLE(149, 27, 3)
    expect(inspectStickerImage(header, 'image/webp')).toEqual({ width: 300, height: 150 })
  })
})
