export const MAX_STICKER_IMAGE_EDGE = 4096

// Read encoded dimensions before decoding pixels so a small compressed image
// cannot ask the browser to allocate an unbounded bitmap.
export function inspectStickerImage(bytes: Uint8Array, mime: string): { width: number; height: number } {
  const invalid = () => new Error('Chỉ nhận ảnh PNG, JPEG hoặc WebP hợp lệ. Sticker động được lưu thành ảnh tĩnh.')
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw invalid()
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const signature = (offset: number, text: string) => String.fromCharCode(...bytes.slice(offset, offset + text.length)) === text
  let width = 0
  let height = 0
  if (bytes.length >= 24 && bytes[0] === 137 && signature(1, 'PNG\r\n\u001a\n') && signature(12, 'IHDR')) {
    width = view.getUint32(16); height = view.getUint32(20)
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2
    while (offset + 3 < bytes.length) {
      if (bytes[offset] !== 255) throw invalid()
      while (bytes[offset] === 255) offset++
      const marker = bytes[offset++]
      if (marker === 0xda || marker === 0xd9 || marker === undefined) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue
      if (offset + 2 > bytes.length) throw invalid()
      const length = view.getUint16(offset)
      if (length < 2 || offset + length > bytes.length) throw invalid()
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (length < 7) throw invalid()
        height = view.getUint16(offset + 3); width = view.getUint16(offset + 5)
        break
      }
      offset += length
    }
  } else if (bytes.length >= 25 && signature(0, 'RIFF') && signature(8, 'WEBP')) {
    if (signature(12, 'VP8X') && bytes.length >= 30) {
      width = 1 + (view.getUint32(23, true) >>> 8)
      height = 1 + (view.getUint32(26, true) >>> 8)
    } else if (signature(12, 'VP8L') && bytes[20] === 0x2f) {
      const dimensions = view.getUint32(21, true)
      width = 1 + (dimensions & 0x3fff); height = 1 + ((dimensions >>> 14) & 0x3fff)
    } else if (signature(12, 'VP8 ') && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 1 && bytes[25] === 0x2a) {
      width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff
    }
  }
  if (!width || !height) throw invalid()
  if (width > MAX_STICKER_IMAGE_EDGE || height > MAX_STICKER_IMAGE_EDGE) throw new Error('Ảnh sticker tối đa 4096 × 4096 pixel.')
  return { width, height }
}
