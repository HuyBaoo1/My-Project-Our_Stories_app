/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The editable textbox receives native image attachments as well as text; input/textarea cannot expose that surface. */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ClipboardPaste, ImagePlus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { emojiStickerId } from './sticker-reference'
import { importPersonalSticker, listPersonalStickers, MAX_STICKER_FILE_BYTES, type PersonalSticker } from './personal-stickers'
import { useResolvedSticker } from './use-resolved-sticker'
import { StickerImage } from './StickerImage'

interface Props { selectedId: string | null; disabled: boolean; onSelect: (id: string | null) => void; onImageLoaded: (id: string) => void; onImageFailed: (id: string) => void }

function LibraryItem({ sticker, index, selected, disabled, onSelect, onLoaded, onFailed }: {
  sticker: PersonalSticker; index: number; selected: boolean; disabled: boolean; onSelect: () => void; onLoaded: () => void; onFailed: () => void
}) {
  const image = useResolvedSticker(sticker.id)
  return <button type="button" className="sticker-option personal-library-option" aria-pressed={selected} aria-label={`Chọn sticker cá nhân ${index + 1}`} disabled={disabled} onClick={onSelect}>
    {image.thumbnailSrc ? <StickerImage src={image.thumbnailSrc} alt="" className="sticker-option-image" onLoadSuccess={onLoaded} onLoadError={onFailed} /> : <span className="personal-library-placeholder">{image.status === 'missing' ? 'Thiếu ảnh' : 'Đang tải…'}</span>}
    <span className="sticker-option-name">Sticker {index + 1}</span>
  </button>
}

function imageDataBlob(source: string): Blob {
  if (source.length > MAX_STICKER_FILE_BYTES * 1.4 + 100) throw new Error('Ảnh sticker quá lớn. Giới hạn là 5 MB.')
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=]+)$/i.exec(source)
  if (!match?.[1] || !match[2]) throw new Error('Không đọc được ảnh từ bàn phím. Hãy dùng Sao chép rồi Dán hoặc chọn ảnh PNG.')
  const decoded = atob(match[2])
  return new Blob([Uint8Array.from(decoded, (character) => character.charCodeAt(0))], { type: match[1].toLowerCase() })
}

export function PersonalStickerInput({ selectedId, disabled, onSelect, onImageLoaded, onImageFailed }: Props) {
  const [library, setLibrary] = useState<PersonalSticker[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const pasteInput = useRef<HTMLDivElement>(null)
  const importingRef = useRef(false)
  const helpId = useId()

  useEffect(() => {
    let cancelled = false
    void listPersonalStickers().then((stickers) => { if (!cancelled) setLibrary(stickers) })
      .catch(() => { if (!cancelled) setError('Chưa mở được thư viện trên thiết bị. Bạn vẫn có thể dùng emoji.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const importImage = async (blob: Blob) => {
    if (disabled || importingRef.current) return
    importingRef.current = true; setImporting(true); setError(''); onSelect(null)
    try {
      const sticker = await importPersonalSticker(blob)
      setLibrary((previous) => [sticker, ...previous])
      onSelect(sticker.id)
      if (pasteInput.current) pasteInput.current.textContent = ''
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không thêm được sticker. Hãy thử ảnh PNG.') }
    finally { importingRef.current = false; setImporting(false) }
  }

  const chooseEmoji = (text: string) => {
    if (disabled || importingRef.current) return
    setError('')
    if (!text.trim()) { onSelect(null); return }
    try { onSelect(emojiStickerId(text)) } catch { onSelect(null); setError('Nhập một emoji, hoặc dán ảnh sticker đã cắt chủ thể.') }
  }

  const readNativeInput = (event: FormEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const image = element.querySelector('img')
    if (!image) { chooseEmoji(element.textContent ?? ''); return }
    const source = image.getAttribute('src') ?? ''
    element.replaceChildren()
    try {
      if (source.startsWith('data:')) { void importImage(imageDataBlob(source)); return }
      const url = new URL(source)
      if (url.protocol !== 'blob:' || url.origin !== location.origin) throw new Error('Bàn phím chưa gửi được ảnh sticker. Hãy Sao chép rồi Dán hoặc chọn ảnh.')
      void fetch(url).then((response) => response.blob()).then(importImage).catch(() => setError('Không đọc được ảnh bàn phím. Hãy chọn ảnh từ thiết bị.'))
    } catch (failure) { onSelect(null); setError(failure instanceof Error ? failure.message : 'Không đọc được ảnh sticker.') }
  }

  const readClipboard = async () => {
    setError('')
    if (!navigator.clipboard?.read) { pasteInput.current?.focus(); setError('Nhấn giữ ô bên dưới rồi chọn Dán, hoặc chọn ảnh từ thiết bị.'); return }
    try {
      const clipboard = await navigator.clipboard.read()
      for (const item of clipboard) {
        const imageType = item.types.find((type) => ['image/png', 'image/jpeg', 'image/webp'].includes(type))
        if (imageType) { await importImage(await item.getType(imageType)); return }
      }
      for (const item of clipboard) if (item.types.includes('text/plain')) {
        const text = await (await item.getType('text/plain')).text()
        if (pasteInput.current) pasteInput.current.textContent = text
        chooseEmoji(text); return
      }
      setError('Clipboard chưa có ảnh sticker. Hãy sao chép chủ thể ảnh hoặc chọn ảnh từ thiết bị.')
    } catch { setError('Chưa đọc được clipboard. Nhấn giữ ô bên dưới rồi chọn Dán, hoặc chọn ảnh từ thiết bị.') }
  }

  return <div className="personal-sticker-panel">
    <div className="personal-import-actions">
      <Button type="button" variant="outline" disabled={disabled || importing} onClick={() => { void readClipboard() }}><ClipboardPaste />Dán từ clipboard</Button>
      <Button type="button" variant="outline" disabled={disabled || importing} onClick={() => fileInput.current?.click()}><ImagePlus />Chọn ảnh từ thiết bị</Button>
    </div>
    <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Ảnh sticker từ thiết bị" disabled={disabled || importing} onChange={(event) => {
      const file = event.target.files?.[0]
      if (file) void importImage(file)
      event.target.value = ''
    }} />
    <div ref={pasteInput} className="personal-sticker-input" role="textbox" aria-label="Dán sticker hoặc nhập emoji" aria-describedby={helpId} aria-multiline="false"
      contentEditable={!disabled && !importing} suppressContentEditableWarning tabIndex={0} data-placeholder="Chạm vào đây · dán sticker hoặc nhập một emoji"
      onInput={readNativeInput} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }}
      onPaste={(event) => {
        event.preventDefault()
        if (disabled || importingRef.current) return
        const file = event.clipboardData.files[0] ?? Array.from(event.clipboardData.items).find((item) => item.kind === 'file')?.getAsFile()
        if (file) { void importImage(file); return }
        const html = event.clipboardData.getData('text/html')
        const dataSource = /src\s*=\s*["'](data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+)["']/i.exec(html)?.[1]
        if (dataSource) {
          try { void importImage(imageDataBlob(dataSource)) } catch { setError('Không đọc được ảnh đã dán. Hãy chọn ảnh PNG.') }
        } else {
          const text = event.clipboardData.getData('text/plain')
          if (text) { event.currentTarget.textContent = text; chooseEmoji(text) }
          else setError('Bàn phím chưa gửi ảnh sticker cho trang này. Hãy chọn Sao chép chủ thể rồi Dán hoặc chọn ảnh từ thiết bị.')
        }
      }}
      onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void importImage(file) }} />
    <p id={helpId} className="personal-input-help">Trên iPhone: mở Ảnh → nhấn giữ chủ thể → Sao chép → quay lại ô này và Dán. Bàn phím sticker dùng được khi trình duyệt gửi ảnh cho trang.</p>
    <p className="personal-input-limits">PNG, JPEG, WebP · tối đa 5 MB · giữ nền trong suốt nếu ảnh có sẵn. Bản thử nghiệm chỉ lưu trên thiết bị này.</p>
    {importing && <output className="personal-import-progress">Đang chuẩn bị sticker…</output>}
    {error && <p role="alert" className="sticker-picker-error">{error}</p>}
    <h3 className="personal-library-title">Đã thêm trên thiết bị <span>{library.length}</span></h3>
    {loading ? <p className="personal-library-empty">Đang mở thư viện…</p> : library.length === 0 ? <p className="personal-library-empty">Sticker bạn thêm sẽ xuất hiện ở đây để dùng cho những ngày sau.</p>
      : <div className="sticker-picker-grid personal-library-grid">{library.map((sticker, index) => <LibraryItem key={sticker.id} sticker={sticker} index={index} selected={selectedId === sticker.id} disabled={disabled || importing}
        onSelect={() => onSelect(sticker.id)} onLoaded={() => onImageLoaded(sticker.id)} onFailed={() => onImageFailed(sticker.id)} />)}</div>}
  </div>
}
