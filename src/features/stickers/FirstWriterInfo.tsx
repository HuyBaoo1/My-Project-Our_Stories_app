import { Feather } from 'lucide-react'
import type { DayMetadata } from './day-metadata'

export function FirstWriterInfo({ metadata }: { metadata: DayMetadata | undefined }) {
  if (!metadata) return <p className="first-writer-info"><Feather aria-hidden="true" /><span>Người lưu ghi chú đầu tiên sẽ chọn sticker cho ngày này.</span></p>
  if (metadata.provenance === 'legacy-unknown' || !metadata.firstWriterDisplayName) {
    return <p className="first-writer-info"><Feather aria-hidden="true" /><span>Chưa xác định người viết đầu tiên từ dữ liệu mẫu cũ.</span></p>
  }
  return <p className="first-writer-info"><Feather aria-hidden="true" /><span>Người viết đầu tiên: <strong>{metadata.firstWriterDisplayName}</strong>{metadata.provenance === 'fixture-order' ? ' (mẫu)' : ''}</span></p>
}
