import { isPersonalStickerId, type PersonalStickerId } from './sticker-reference'
import { inspectStickerImage, MAX_STICKER_IMAGE_EDGE } from './image-file'

export const MAX_STICKER_FILE_BYTES = 5 * 1024 * 1024
const MAX_STORED_BYTES = 192 * 1024
const DATABASE_NAME = 'our-stories-personal-stickers'
const STORE_NAME = 'images'

export interface PersonalSticker {
  id: PersonalStickerId
  name: string
  blob: Blob
  thumbnailBlob: Blob
  width: number
  height: number
  createdAt: string
}

interface StoredPersonalSticker extends Omit<PersonalSticker, 'blob' | 'thumbnailBlob'> {
  imageBytes: ArrayBuffer
  thumbnailBytes: ArrayBuffer
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Trình duyệt không cho lưu sticker. Hãy thử lại ngoài chế độ riêng tư.')); return }
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE_NAME, { keyPath: 'id' }) }
    let rejected = false
    request.onsuccess = () => {
      if (rejected) { request.result.close(); return }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(new Error('Không mở được thư viện sticker trên thiết bị.'))
    request.onblocked = () => { rejected = true; reject(new Error('Thư viện sticker đang bận. Hãy đóng tab cũ rồi thử lại.')) }
  })
}

async function withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    try {
      const transaction = database.transaction(STORE_NAME, mode)
      const request = operation(transaction.objectStore(STORE_NAME))
      transaction.oncomplete = () => { database.close(); resolve(request.result) }
      transaction.onabort = () => { database.close(); reject(new Error('Không lưu hoặc đọc được sticker trên thiết bị. Dung lượng có thể đã đầy.')) }
      transaction.onerror = () => { /* The transaction abort handler supplies the user-facing failure. */ }
    } catch { database.close(); reject(new Error('Không truy cập được thư viện sticker trên thiết bị.')) }
  })
}

function validRecord(value: unknown): value is PersonalSticker {
  if (!value || typeof value !== 'object') return false
  const sticker = value as Partial<PersonalSticker>
  return isPersonalStickerId(sticker.id) && typeof sticker.name === 'string' && sticker.name.length <= 80 &&
    sticker.blob instanceof Blob && sticker.blob.type === 'image/png' && sticker.blob.size > 0 && sticker.blob.size <= MAX_STORED_BYTES &&
    sticker.thumbnailBlob instanceof Blob && sticker.thumbnailBlob.type === 'image/png' && sticker.thumbnailBlob.size > 0 && sticker.thumbnailBlob.size <= MAX_STORED_BYTES &&
    typeof sticker.width === 'number' && Number.isInteger(sticker.width) && sticker.width > 0 && sticker.width <= 512 &&
    typeof sticker.height === 'number' && Number.isInteger(sticker.height) && sticker.height > 0 && sticker.height <= 512 &&
    typeof sticker.createdAt === 'string' && Number.isFinite(Date.parse(sticker.createdAt))
}

function readStoredSticker(input: unknown): PersonalSticker | undefined {
  // Read previous prototype Blob records as well as the portable byte format.
  if (validRecord(input)) return input
  if (!input || typeof input !== 'object') return undefined
  const stored = input as StoredPersonalSticker
  if (!(stored.imageBytes instanceof ArrayBuffer) || !(stored.thumbnailBytes instanceof ArrayBuffer)) return undefined
  const pngBytes = (bytes: ArrayBuffer) => {
    if (bytes.byteLength < 24 || bytes.byteLength > MAX_STORED_BYTES) return false
    const head = new Uint8Array(bytes, 0, 8)
    return head[0] === 137 && head[1] === 80 && head[2] === 78 && head[3] === 71 && head[4] === 13 && head[5] === 10 && head[6] === 26 && head[7] === 10
  }
  if (!pngBytes(stored.imageBytes) || !pngBytes(stored.thumbnailBytes)) return undefined
  const sticker = { id: stored.id, name: stored.name, width: stored.width, height: stored.height, createdAt: stored.createdAt,
    blob: new Blob([stored.imageBytes], { type: 'image/png' }), thumbnailBlob: new Blob([stored.thumbnailBytes], { type: 'image/png' }) }
  return validRecord(sticker) ? sticker : undefined
}

export async function getPersonalSticker(id: string): Promise<PersonalSticker | undefined> {
  if (!isPersonalStickerId(id)) return undefined
  const record: unknown = await withStore('readonly', (store) => store.get(id))
  return readStoredSticker(record)
}

export async function listPersonalStickers(): Promise<PersonalSticker[]> {
  const records: unknown[] = await withStore('readonly', (store) => store.getAll())
  return records.map(readStoredSticker).filter((record): record is PersonalSticker => !!record).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function canvasPng(image: HTMLImageElement, maximumEdge: number): Promise<{ blob: Blob; width: number; height: number }> {
  const ratio = Math.min(1, maximumEdge / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * ratio))
  const height = Math.max(1, Math.round(image.naturalHeight * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('Trình duyệt không xử lý được ảnh sticker.'))
  context.drawImage(image, 0, 0, width, height)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (!blob) reject(new Error('Không chuyển được ảnh thành sticker PNG.'))
    else resolve({ blob, width, height })
  }, 'image/png'))
}

export async function importPersonalSticker(file: Blob): Promise<PersonalSticker> {
  if (!file.size || file.size > MAX_STICKER_FILE_BYTES) throw new Error('Ảnh sticker phải nhỏ hơn hoặc bằng 5 MB.')
  inspectStickerImage(new Uint8Array(await file.arrayBuffer()), file.type)
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    try { await image.decode() } catch { throw new Error('Không đọc được ảnh này. Hãy thử ảnh PNG đã cắt chủ thể.') }
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > MAX_STICKER_IMAGE_EDGE || image.naturalHeight > MAX_STICKER_IMAGE_EDGE) throw new Error('Ảnh sticker tối đa 4096 × 4096 pixel.')
    let full = await canvasPng(image, 512)
    if (full.blob.size > MAX_STORED_BYTES) full = await canvasPng(image, 256)
    if (full.blob.size > MAX_STORED_BYTES) throw new Error('Sticker vẫn quá lớn sau khi thu nhỏ. Hãy chọn ảnh đơn giản hơn.')
    const thumbnail = await canvasPng(image, 96)
    const sticker: PersonalSticker = { id: `personal-${crypto.randomUUID()}`, name: 'Sticker của tôi', blob: full.blob,
      thumbnailBlob: thumbnail.blob, width: full.width, height: full.height, createdAt: new Date().toISOString() }
    // Prepare bytes before starting the transaction. Some WebKit ports cannot
    // persist Blob/File objects; ArrayBuffer keeps this local path portable.
    const [imageBytes, thumbnailBytes] = await Promise.all([full.blob.arrayBuffer(), thumbnail.blob.arrayBuffer()])
    const stored: StoredPersonalSticker = { id: sticker.id, name: sticker.name, width: sticker.width, height: sticker.height,
      createdAt: sticker.createdAt, imageBytes, thumbnailBytes }
    await withStore('readwrite', (store) => store.put(stored))
    return sticker
  } finally { URL.revokeObjectURL(url) }
}
