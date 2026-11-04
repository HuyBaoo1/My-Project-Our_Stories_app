import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { formatDay } from '../../lib/date'

export function DateCover({ dayKey, noteCount }: { dayKey: string; noteCount: number }) {
  const date = new Date(`${dayKey}T12:00:00Z`)
  const ordinal = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86_400_000) + 1
  const year = date.getUTCFullYear()
  const daysInYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365
  return <section className="date-cover" aria-label="Bìa trang ngày">
    <span className="cover-caption">BẢN THỬ NGHIỆM · DỮ LIỆU MẪU</span>
    <div className="cover-sticker sticker-coffee" aria-hidden="true">☕</div>
    <div className="cover-sticker sticker-flower" aria-hidden="true">🌼</div>
    <div className="cover-sticker sticker-letter" aria-hidden="true">💌</div>
    <div className="cover-sticker sticker-orange" aria-hidden="true">🍊</div>
    <span className="cover-scribble" aria-hidden="true">những điều nhỏ,<br />thương thật lâu!</span>
    <span className="cover-sparkle" aria-hidden="true">✧</span>
    <span className="cover-stamp" aria-hidden="true">with<br /><i>love</i> ♡</span>
    <div className="cover-date">
      <span className="cover-year">{year}</span><span className="cover-month">THÁNG {Number(dayKey.slice(5, 7))}</span>
      <span className="cover-ordinal">{ordinal}/{daysInYear} <span>· {formatDay(dayKey, { weekday: 'long' })}</span></span>
      <time className="cover-number" dateTime={dayKey}>{dayKey.slice(8, 10)}</time>
    </div>
    <Link to={`/day/${dayKey}`} className="cover-open"><span>{noteCount ? `${noteCount} ghi chú đang chờ bạn` : 'Một trang mới đang chờ bạn'}</span><ArrowUpRight size={16} /></Link>
  </section>
}
