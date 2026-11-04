import { useEffect, useId, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { getSticker, stickerCatalog, type StickerId } from './stickerCatalog'
import { StickerImage } from './StickerImage'

interface Props {
  onConfirm: (id: StickerId) => void | Promise<void>
  onClose: () => void
}

export function StickerPicker({ onConfirm, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const labelId = useId()
  const [selectedId, setSelectedId] = useState<StickerId | null>(null)
  const [loadedIds, setLoadedIds] = useState<Set<StickerId>>(() => new Set())
  const [failedIds, setFailedIds] = useState<Set<StickerId>>(() => new Set())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selected = getSticker(selectedId)
  const selectedImageFailed = !!selectedId && failedIds.has(selectedId)
  const selectedImageLoaded = !!selectedId && loadedIds.has(selectedId)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  const confirm = async () => {
    if (!selectedId || !selectedImageLoaded || selectedImageFailed || saving) return
    setSaving(true)
    setError('')
    try {
      await onConfirm(selectedId)
      setSaving(false)
      onClose()
    } catch (failure) {
      setSaving(false)
      setError(failure instanceof Error ? failure.message : 'Chưa lưu được sticker. Lựa chọn của bạn vẫn được giữ lại.')
    }
  }

  return <dialog ref={dialogRef} className="sticker-picker-dialog" aria-labelledby={`${labelId}-title`} aria-describedby={`${labelId}-description`} aria-busy={saving}
    onCancel={(event) => { event.preventDefault(); if (!saving) onClose() }}>
    <div className="sticker-picker-header">
      <div><p className="daily-sticker-eyebrow">MỘT DẤU NHỚ, CHO MỘT NGÀY</p><h2 id={`${labelId}-title`}>Chọn sticker cho ngày</h2></div>
      <Button type="button" variant="ghost" size="icon" aria-label="Đóng bộ chọn sticker" disabled={saving} onClick={onClose}><X /></Button>
    </div>
    <p id={`${labelId}-description`} className="sticker-picker-description">Bạn là người viết đầu tiên. Chọn một sticker để cả nhà nhớ ngày này — lựa chọn được giữ lại cùng trang nhật ký.</p>
    <fieldset className="sticker-picker-fieldset" disabled={saving}>
      <legend>Bộ sưu tập đồ uống · {stickerCatalog.length} sticker</legend>
      <div className="sticker-picker-grid">
        {stickerCatalog.map((sticker) => <label key={sticker.id} className={`sticker-option ${failedIds.has(sticker.id) ? 'sticker-option-unavailable' : ''}`}>
          <input type="radio" name={`${labelId}-sticker`} value={sticker.id} checked={selectedId === sticker.id} disabled={failedIds.has(sticker.id)}
            onChange={() => { setSelectedId(sticker.id); setError('') }} />
          <StickerImage src={sticker.thumbnailSrc} alt="" className="sticker-option-image"
            onLoadSuccess={() => setLoadedIds((previous) => new Set(previous).add(sticker.id))}
            onLoadError={() => setFailedIds((previous) => new Set(previous).add(sticker.id))} />
          <span className="sticker-option-name">{sticker.name}</span>
          <span className="sticker-option-check" aria-hidden="true"><Check /></span>
        </label>)}
      </div>
    </fieldset>
    {failedIds.size > 0 && <p className="sticker-picker-image-warning">Một số ảnh chưa tải được. Bạn có thể chọn sticker khác hoặc mở lại bộ chọn để thử lại.</p>}
    {error && <p role="alert" className="sticker-picker-error">{error}</p>}
    <div className="sticker-picker-footer">
      <div className="sticker-picker-selection" aria-live="polite">{selected ? <><StickerImage src={selected.thumbnailSrc} alt="" className="sticker-selected-image" /><span>{selected.name}</span></> : <span>Chưa chọn sticker</span>}</div>
      <Button type="button" className="sticker-confirm-button" disabled={!selected || !selectedImageLoaded || selectedImageFailed || saving} onClick={() => { void confirm() }}><Check />{saving ? 'Đang lưu…' : 'Lưu sticker'}</Button>
    </div>
    <p className="sticker-picker-local-note">Bản thử nghiệm · chỉ lưu trên trình duyệt này. Chỉ chọn một lần cho mỗi ngày.</p>
  </dialog>
}
