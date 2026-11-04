import { Bookmark, Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { getSticker } from './stickerCatalog'
import type { DayMetadata } from './day-metadata'
import { FirstWriterInfo } from './FirstWriterInfo'
import { StickerImage } from './StickerImage'

interface Props { metadata: DayMetadata | undefined; canChoose: boolean; onChoose: () => void }

export function DailyStickerBadge({ metadata, canChoose, onChoose }: Props) {
  const sticker = getSticker(metadata?.representativeStickerId)
  const legacyUnknown = metadata?.provenance === 'legacy-unknown'
  return <section className={`daily-sticker-badge ${sticker ? 'assigned-day-sticker' : ''}`} aria-label="Sticker đại diện ngày">
    {sticker ? <StickerImage src={sticker.src} alt={sticker.name} className="daily-sticker-image" loading="eager" />
      : <span className="daily-sticker-empty" aria-hidden="true"><Bookmark /></span>}
    <div className="daily-sticker-copy">
      <p className="daily-sticker-eyebrow">DẤU NHỚ CỦA NGÀY</p>
      <h3>{sticker ? sticker.name : !metadata ? 'Một ngày, một dấu nhớ' : legacyUnknown ? 'Chưa có sticker đại diện' : 'Đang chờ chọn sticker'}</h3>
      <FirstWriterInfo metadata={metadata} />
      {canChoose && !sticker && <Button type="button" size="sm" variant="outline" className="choose-day-sticker" onClick={onChoose}><Plus />Chọn sticker cho ngày</Button>}
      {!!metadata && !sticker && !canChoose && !legacyUnknown && <p className="sticker-pending-hint">Người viết đầu tiên sẽ chọn sticker khi sẵn sàng.</p>}
      {sticker && <p className="sticker-pending-hint">Sticker được giữ cùng trang ngày, kể cả khi ghi chú đầu tiên được ẩn.</p>}
    </div>
  </section>
}
