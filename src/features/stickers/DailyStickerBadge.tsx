import { Bookmark, Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useResolvedSticker } from './use-resolved-sticker'
import type { DayMetadata } from './day-metadata'
import { FirstWriterInfo } from './FirstWriterInfo'
import { StickerImage } from './StickerImage'

interface Props { metadata: DayMetadata | undefined; canChoose: boolean; onChoose: () => void }

export function DailyStickerBadge({ metadata, canChoose, onChoose }: Props) {
  const sticker = useResolvedSticker(metadata?.representativeStickerId)
  const assigned = !!metadata?.representativeStickerId
  const legacyUnknown = metadata?.provenance === 'legacy-unknown'
  return <section className={`daily-sticker-badge ${assigned ? 'assigned-day-sticker' : ''}`} data-sticker-id={metadata?.representativeStickerId ?? undefined} aria-label="Sticker đại diện ngày">
    {sticker.emoji ? <span aria-hidden="true" className="personal-sticker-emoji daily-sticker-emoji">{sticker.emoji}</span>
      : sticker.src ? <StickerImage src={sticker.src} alt={sticker.name} className="daily-sticker-image" loading="eager" />
      : <span className="daily-sticker-empty" aria-hidden="true"><Bookmark /></span>}
    <div className="daily-sticker-copy">
      <p className="daily-sticker-eyebrow">DẤU NHỚ CỦA NGÀY</p>
      <h3>{assigned ? sticker.status === 'missing' ? 'Ảnh sticker không còn trên thiết bị' : sticker.status === 'loading' ? 'Đang tải sticker…' : sticker.name
        : !metadata ? 'Một ngày, một dấu nhớ' : legacyUnknown ? 'Chưa có sticker đại diện' : 'Đang chờ chọn sticker'}</h3>
      <FirstWriterInfo metadata={metadata} />
      {canChoose && !assigned && <Button type="button" size="sm" variant="outline" className="choose-day-sticker" onClick={onChoose}><Plus />Chọn sticker cho ngày</Button>}
      {!!metadata && !assigned && !canChoose && !legacyUnknown && <p className="sticker-pending-hint">Người viết đầu tiên sẽ chọn sticker khi sẵn sàng.</p>}
      {assigned && <p className="sticker-pending-hint">{sticker.status === 'missing' ? 'Bản mẫu giữ ảnh riêng trên thiết bị đã thêm sticker; chưa đồng bộ ảnh giữa các máy.' : 'Sticker được giữ cùng trang ngày, kể cả khi ghi chú đầu tiên được ẩn.'}</p>}
    </div>
  </section>
}
