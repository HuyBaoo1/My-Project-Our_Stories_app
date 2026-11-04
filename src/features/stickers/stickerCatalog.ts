// User-supplied reference, locally extracted. See docs/STICKER_ASSETS.md for provenance and limitations.
export const stickerCatalog = [
  {
    "id": "sticker-001",
    "name": "Ly kem sô-cô-la",
    "src": "/stickers/sticker-001.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-001.png",
    "width": 227,
    "height": 229
  },
  {
    "id": "sticker-002",
    "name": "Trà túi lọc",
    "src": "/stickers/sticker-002.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-002.png",
    "width": 221,
    "height": 227
  },
  {
    "id": "sticker-003",
    "name": "Ly trà vàng",
    "src": "/stickers/sticker-003.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-003.png",
    "width": 225,
    "height": 224
  },
  {
    "id": "sticker-004",
    "name": "Sữa kẹo dẻo",
    "src": "/stickers/sticker-004.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-004.png",
    "width": 227,
    "height": 226
  },
  {
    "id": "sticker-005",
    "name": "Cà phê đá",
    "src": "/stickers/sticker-005.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-005.png",
    "width": 228,
    "height": 228
  },
  {
    "id": "sticker-006",
    "name": "Ly đá viên",
    "src": "/stickers/sticker-006.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-006.png",
    "width": 221,
    "height": 225
  },
  {
    "id": "sticker-007",
    "name": "Lon nước",
    "src": "/stickers/sticker-007.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-007.png",
    "width": 226,
    "height": 228
  },
  {
    "id": "sticker-008",
    "name": "Cà phê đen",
    "src": "/stickers/sticker-008.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-008.png",
    "width": 225,
    "height": 226
  },
  {
    "id": "sticker-009",
    "name": "Ly trà xanh",
    "src": "/stickers/sticker-009.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-009.png",
    "width": 228,
    "height": 225
  },
  {
    "id": "sticker-010",
    "name": "Matcha đá",
    "src": "/stickers/sticker-010.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-010.png",
    "width": 225,
    "height": 222
  },
  {
    "id": "sticker-011",
    "name": "Cà phê bọt",
    "src": "/stickers/sticker-011.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-011.png",
    "width": 221,
    "height": 222
  },
  {
    "id": "sticker-012",
    "name": "Ly chanh dây",
    "src": "/stickers/sticker-012.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-012.png",
    "width": 220,
    "height": 222
  },
  {
    "id": "sticker-013",
    "name": "Ly trà đỏ đá",
    "src": "/stickers/sticker-013.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-013.png",
    "width": 221,
    "height": 222
  },
  {
    "id": "sticker-014",
    "name": "Latte chiếc lá",
    "src": "/stickers/sticker-014.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-014.png",
    "width": 221,
    "height": 223
  },
  {
    "id": "sticker-015",
    "name": "Ly trà trái cây",
    "src": "/stickers/sticker-015.png",
    "thumbnailSrc": "/stickers/thumbs/sticker-015.png",
    "width": 227,
    "height": 226
  }
] as const

export type Sticker = (typeof stickerCatalog)[number]
export type StickerId = Sticker['id']

export function getSticker(id: string | null | undefined): Sticker | undefined {
  return stickerCatalog.find((sticker) => sticker.id === id)
}

export function isStickerId(value: unknown): value is StickerId {
  return typeof value === 'string' && getSticker(value) !== undefined
}
