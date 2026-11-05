import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

interface Props { authors: string[]; selected: string; dayKey: string; onSelect: (author: string) => void }
const symbols = ['☕', '🌿', '💌', '🌞', '🎧']

export function AuthorFilters({ authors, selected, dayKey, onSelect }: Props) {
  return <div className="author-filter-row" aria-label="Lọc lịch theo người viết" title="Lọc ghi chú theo người viết; sticker đã chọn là dấu nhớ chung của ngày và luôn được giữ lại.">
    <button type="button" className="filter-all" aria-pressed={!selected} onClick={() => onSelect('')}>Tất cả</button>
    <Link to={`/day/${dayKey}?write=1`} className="filter-add" aria-label="Viết ghi chú cho ngày đang chọn"><Plus size={25} /></Link>
    {authors.map((author, index) => <button type="button" className="author-filter" key={author} aria-label={`Lọc lịch theo ${author}`} aria-pressed={selected === author} onClick={() => onSelect(selected === author ? '' : author)}>
      <span className="filter-symbol" aria-hidden="true">{symbols[index % symbols.length]}</span><span className="filter-name">{author}</span>
    </button>)}
  </div>
}
