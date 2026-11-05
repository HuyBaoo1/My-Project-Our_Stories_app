import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, Feather, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../ui/button'
import { NoteEditor } from '../note-editor/note-editor'
import { RichText } from '../note-editor/rich-text'
import { useDiary } from '../../features/notes/context'
import { formatDay, formatTime, initials, shiftDay, todayDayKey } from '../../lib/date'
import type { DiaryNote } from '../../types/diary'
import { MOCK_MEMBER } from '../../mocks/fixtures'
import { DailyStickerBadge } from '../../features/stickers/DailyStickerBadge'
import { StickerPicker } from '../../features/stickers/StickerPicker'
import { isPersonalStickerId } from '../../features/stickers/sticker-reference'

interface Props { dayKey: string; fullPage?: boolean; initialCompose?: boolean; onSelectDay: (day: string) => void }

function DeleteConfirmation({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return <dialog ref={ref} role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-description" className="confirm-dialog" onCancel={(event) => { event.preventDefault(); onClose() }}>
    <div className="flex items-center justify-between"><h3 id="delete-title" className="font-semibold">Ẩn ghi chú này?</h3><Button variant="ghost" size="icon" aria-label="Đóng xác nhận" onClick={onClose}><X /></Button></div>
    <p id="delete-description" className="my-4 text-sm text-muted-foreground">Nội dung và phiên bản cũ vẫn được giữ trong dữ liệu mẫu. Đây không phải xóa vĩnh viễn.</p>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Giữ lại</Button><Button variant="danger" onClick={onConfirm}>Ẩn ghi chú</Button></div>
  </dialog>
}

export function DayPanel({ dayKey, fullPage = false, initialCompose = false, onSelectDay }: Props) {
  const { notes, store } = useDiary()
  const [editing, setEditing] = useState<DiaryNote | 'new' | null>(initialCompose ? 'new' : null)
  const [deleting, setDeleting] = useState<DiaryNote | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false)
  const dayMetadata = store.getDayMetadata(dayKey)
  const canChooseSticker = dayMetadata?.firstWriterUserId === MOCK_MEMBER.uid && dayMetadata.representativeStickerId === null
  const dayNotes = notes.filter((note) => note.dayKey === dayKey && !note.deleted).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const deletedNotes = notes.filter((note) => note.dayKey === dayKey && note.deleted)
  const prev = shiftDay(dayKey, -1)
  const next = shiftDay(dayKey, 1)

  return <section className={fullPage ? 'day-page' : 'day-panel'} aria-label="Trang nhật ký ngày">
    <header className="day-panel-header">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="live-dot" />{dayKey === todayDayKey() ? 'TRANG HÔM NAY' : 'TRANG NHẬT KÝ'}</div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div><h2 className="day-title">{formatDay(dayKey, { day: 'numeric', month: 'long' })}</h2><p className="mt-1 text-sm capitalize text-muted-foreground">{formatDay(dayKey, { weekday: 'long', year: 'numeric' })}</p></div>
        <div className="flex">
          <Button variant="ghost" size="icon" aria-label="Ngày trước" disabled={prev < '1900-01-01'} onClick={() => onSelectDay(prev)}><ChevronLeft /></Button>
          <Button variant="ghost" size="icon" aria-label="Ngày sau" disabled={next > '2100-12-31'} onClick={() => onSelectDay(next)}><ChevronRight /></Button>
        </div>
      </div>
      <DailyStickerBadge metadata={dayMetadata} canChoose={canChooseSticker} onChoose={() => setStickerPickerOpen(true)} />
      <div className="mt-5 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{dayNotes.length} ghi chú · một trang chung</p>
        {!fullPage && <Link className="expand-link" to={`/day/${dayKey}`}>Mở rộng <ArrowUpRight size={14} /></Link>}
      </div>
    </header>
    <div className="day-content">
      {saved && <output className="save-status block">Đã lưu trên trình duyệt · dữ liệu mẫu</output>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {dayNotes.length === 0 && editing !== 'new' && <div className="empty-day">
        <div className="empty-icon"><Feather size={25} /></div><h3>Trang giấy đang đợi bạn</h3><p>Một chuyện nhỏ, một cảm xúc thoáng qua.<br />Điều gì của ngày này bạn muốn giữ lại?</p>
      </div>}
      {dayNotes.map((note, index) => <article className="note-card" key={note.id}>
        <div className="note-header">
          <span className={`avatar avatar-${index % 3}`}>{initials(note.authorName)}</span>
          <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{note.authorName}</h3><p className="mt-0.5 text-xs text-muted-foreground">{formatTime(note.createdAt)}{note.revision > 1 ? ` · đã sửa, v${note.revision}` : ''}</p></div>
          <details className="note-actions"><summary aria-label={`Tùy chọn ghi chú của ${note.authorName}`}><MoreHorizontal size={19} /></summary><div className="note-menu">
            <Button variant="ghost" size="sm" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); setEditing(note); setSaved(false) }}><Pencil />Chỉnh sửa</Button>
            <Button variant="ghost" size="sm" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); setDeleting(note) }}><Trash2 />Ẩn ghi chú</Button>
          </div></details>
        </div>
        {editing !== null && editing !== 'new' && editing.id === note.id
          ? <NoteEditor key={note.id} dayKey={dayKey} note={note} onClose={() => setEditing(null)} onSave={(content, base) => { store.save(dayKey, content, note.id, base); setSaved(true) }} />
          : <RichText content={note.content} />}
        {note.revisions.length > 0 && <details className="revision-history"><summary>{note.revisions.length} phiên bản trước · bản mẫu</summary>{note.revisions.map((revision) => <div key={revision.revision} className="revision-entry"><p className="mb-2 text-xs text-muted-foreground">Phiên bản {revision.revision} · {revision.action === 'delete' ? 'trước khi ẩn' : 'trước khi sửa'}</p><RichText content={revision.content} /></div>)}</details>}
      </article>)}
      {editing === 'new' ? <NoteEditor key={`new-${dayKey}`} dayKey={dayKey} onClose={() => setEditing(null)} onSave={(content) => { store.save(dayKey, content); setSaved(true) }} />
        : <Button variant="outline" className="add-note-button" onClick={() => { setEditing('new'); setSaved(false) }}><Plus />Viết một ghi chú</Button>}
      {deletedNotes.length > 0 && <details className="deleted-notes"><summary>{deletedNotes.length} ghi chú đã ẩn · vẫn giữ nội dung</summary>{deletedNotes.map((note) => <article key={note.id} className="mt-4"><p className="mb-2 text-xs">{note.authorName} · phiên bản {note.revision}</p><RichText content={note.content} /></article>)}</details>}
      <div className="day-ending"><span /><Feather size={15} /><span /></div>
      <p className="day-caption">Mỗi dòng viết, một chút gần nhau hơn.</p>
    </div>
    {stickerPickerOpen && <StickerPicker onConfirm={async (id) => {
      if (isPersonalStickerId(id)) await store.assignPersonalDaySticker(dayKey, id, MOCK_MEMBER.uid)
      else store.assignDaySticker(dayKey, id, MOCK_MEMBER.uid)
      setSaved(true)
    }} onClose={() => setStickerPickerOpen(false)} />}
    {deleting && <DeleteConfirmation onClose={() => setDeleting(null)} onConfirm={() => {
        try { store.softDelete(deleting.id, deleting.revision); setDeleting(null); setError('') } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không ẩn được ghi chú.'); setDeleting(null) }
      }} />}
  </section>
}
