import { Bookmark } from 'lucide-react'
import { getSticker } from './stickerCatalog'
import { StickerImage } from './StickerImage'

interface Props { stickerId: string | null | undefined; noteCount: number }

export function CalendarDaySticker({ stickerId, noteCount }: Props) {
  const sticker = getSticker(stickerId)
  return <span className={`calendar-memory calendar-day-sticker ${sticker ? 'has-day-sticker' : 'pending-day-sticker'}`} aria-hidden="true">
    {sticker ? <StickerImage src={sticker.thumbnailSrc} alt="" className="calendar-sticker-image" />
      : <span className="calendar-sticker-pending"><Bookmark /><span>Chờ chọn</span></span>}
    {noteCount > 1 && <span className="memory-count">{noteCount}</span>}
  </span>
}
