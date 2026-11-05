import { useEffect, useId, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { stickerCatalog } from './stickerCatalog'
import { StickerImage } from './StickerImage'
import { PersonalStickerInput } from './PersonalStickerInput'
import { getStickerEmoji } from './sticker-reference'
import { useResolvedSticker } from './use-resolved-sticker'
import type { PersonalSticker } from './personal-stickers'

interface Props {
  onConfirm: (id: string, draft?: PersonalSticker | null) => void | Promise<void>
  onClose: () => void
}

export function StickerPicker({ onConfirm, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const labelId = useId()
  const [tab, setTab] = useState<'personal' | 'samples'>('personal')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PersonalSticker | null>(null)
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set())
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const selected = useResolvedSticker(selectedId, draft)
  const selectedImageFailed = !!selectedId && (failedIds.has(selectedId) || selected.status === 'missing')
  const selectedImageLoaded = !!selectedId && (!!getStickerEmoji(selectedId) || loadedIds.has(selectedId))
  const imageLoaded = (id: string) => setLoadedIds((previous) => new Set(previous).add(id))
  const imageFailed = (id: string) => setFailedIds((previous) => new Set(previous).add(id))
  const changeTab = (next: 'personal' | 'samples') => { setTab(next); setSelectedId(null); setDraft(null); setError('') }

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
      await onConfirm(selectedId, draft)
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
    <p id={`${labelId}-description`} className="sticker-picker-description">Tự thêm một sticker hoặc chọn hình có sẵn cho ngày này.</p>
    <div role="tablist" tabIndex={-1} aria-label="Nguồn sticker" className="sticker-source-tabs" onKeyDown={(event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const next = tab === 'personal' ? 'samples' : 'personal'
        changeTab(next); document.getElementById(`${labelId}-${next}-tab`)?.focus()
      }
    }}>
      <button type="button" role="tab" id={`${labelId}-personal-tab`} aria-controls={`${labelId}-personal-panel`} aria-selected={tab === 'personal'} tabIndex={tab === 'personal' ? 0 : -1} disabled={saving} onClick={() => changeTab('personal')}>Tự thêm</button>
      <button type="button" role="tab" id={`${labelId}-samples-tab`} aria-controls={`${labelId}-samples-panel`} aria-selected={tab === 'samples'} tabIndex={tab === 'samples' ? 0 : -1} disabled={saving} onClick={() => changeTab('samples')}>Có sẵn</button>
    </div>
    {tab === 'personal' ? <div role="tabpanel" id={`${labelId}-personal-panel`} aria-labelledby={`${labelId}-personal-tab`}>
      <PersonalStickerInput disabled={saving} onSelect={(id, image) => { setSelectedId(id); setDraft(image ?? null); setError('') }} />
    </div> : <div role="tabpanel" id={`${labelId}-samples-panel`} aria-labelledby={`${labelId}-samples-tab`}>
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
    </fieldset></div>}
    {failedIds.size > 0 && <p className="sticker-picker-image-warning">Một số ảnh chưa tải được. Bạn có thể chọn sticker khác hoặc mở lại bộ chọn để thử lại.</p>}
    {error && <p role="alert" className="sticker-picker-error">{error}</p>}
    <div className="sticker-picker-footer">
      <div className="sticker-picker-selection" aria-live="polite">{selectedId ? <>
        {selected.emoji ? <span className="personal-selection-emoji">{selected.emoji}</span> : selected.thumbnailSrc ? <StickerImage src={selected.thumbnailSrc} alt="" className="sticker-selected-image" onLoadSuccess={() => imageLoaded(selectedId)} onLoadError={() => imageFailed(selectedId)} /> : null}
        <span>{selectedImageFailed ? 'Ảnh chưa tải được' : selected.name}</span></> : <span>Chưa chọn sticker</span>}</div>
      <Button type="button" className="sticker-confirm-button" disabled={!selectedId || !selectedImageLoaded || selectedImageFailed || saving} onClick={() => { void confirm() }}><Check />{saving ? 'Đang lưu…' : 'Dùng sticker'}</Button>
    </div>
  </dialog>
}
