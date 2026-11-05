/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The editable textbox receives native image attachments as well as text; input/textarea cannot expose that surface. */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { emojiStickerId } from './sticker-reference'
import { preparePersonalSticker, MAX_STICKER_FILE_BYTES, type PersonalSticker } from './personal-stickers'

interface Props { disabled: boolean; onSelect: (id: string | null, draft?: PersonalSticker) => void }

function imageDataBlob(source: string): Blob {
  if (source.length > MAX_STICKER_FILE_BYTES * 1.4 + 100) throw new Error('Ảnh sticker quá lớn. Giới hạn là 5 MB.')
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=]+)$/i.exec(source)
  if (!match?.[1] || !match[2]) throw new Error('Không đọc được ảnh từ bàn phím. Hãy dùng Sao chép rồi Dán hoặc chọn ảnh PNG.')
  const decoded = atob(match[2])
  return new Blob([Uint8Array.from(decoded, (character) => character.charCodeAt(0))], { type: match[1].toLowerCase() })
}

export function PersonalStickerInput({ disabled, onSelect }: Props) {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const pasteInput = useRef<HTMLDivElement>(null)
  const importingRef = useRef(false)
  const active = useRef(true)
  const helpId = useId()
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])

  const importImage = async (blob: Blob) => {
    if (disabled || importingRef.current) return
    importingRef.current = true; setImporting(true); setError(''); onSelect(null)
    try {
      const sticker = await preparePersonalSticker(blob)
      if (!active.current) return
      onSelect(sticker.id, sticker)
      if (pasteInput.current) pasteInput.current.textContent = ''
    } catch (failure) { if (active.current) setError(failure instanceof Error ? failure.message : 'Không thêm được sticker. Hãy thử ảnh PNG.') }
    finally { importingRef.current = false; if (active.current) setImporting(false) }
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

  return <div className="personal-sticker-panel">
    <div className="personal-import-actions">
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
    <p id={helpId} className="personal-input-help">Dán sticker hoặc nhập emoji từ bàn phím. Chỉ dùng cho ngày này.</p>
    {importing && <output className="personal-import-progress">Đang chuẩn bị sticker…</output>}
    {error && <p role="alert" className="sticker-picker-error">{error}</p>}
  </div>
}
