import { Bookmark } from 'lucide-react'
import { useResolvedSticker } from './use-resolved-sticker'
import { StickerImage } from './StickerImage'

interface Props { stickerId: string | null | undefined; noteCount: number; legacyUnknown?: boolean }

export function CalendarDaySticker({ stickerId, noteCount, legacyUnknown = false }: Props) {
  const sticker = useResolvedSticker(stickerId)
  const assigned = !!stickerId
  return <span className={`calendar-memory calendar-day-sticker ${assigned ? 'has-day-sticker' : 'pending-day-sticker'}`} data-sticker-id={stickerId ?? undefined} aria-hidden="true">
    {sticker.emoji ? <span className="personal-sticker-emoji calendar-sticker-emoji">{sticker.emoji}</span>
      : sticker.thumbnailSrc ? <StickerImage src={sticker.thumbnailSrc} alt="" className="calendar-sticker-image" />
      : assigned ? <span className="calendar-sticker-pending"><Bookmark /><span>{sticker.status === 'loading' ? 'Đang tải' : 'Thiếu ảnh'}</span></span>
      : <span className="calendar-sticker-pending"><Bookmark /><span>{legacyUnknown ? 'Chưa rõ' : 'Chờ chọn'}</span></span>}
    {noteCount > 1 && <span className="memory-count">{noteCount}</span>}
  </span>
}
