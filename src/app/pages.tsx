import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Feather, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/button'
import { MonthCalendar } from '../components/calendar/month-calendar'
import { DateCover } from '../components/calendar/date-cover'
import { AuthorFilters } from '../components/calendar/author-filters'
import { DayPanel } from '../components/daily-page/day-panel'
import { useDiary } from '../features/notes/context'
import { isDayKey, todayDayKey } from '../lib/date'
import { plainText } from '../lib/rich-text'
import type { DaySummary } from '../types/diary'

export function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { notes, store } = useDiary()
  const today = todayDayKey()
  const requestedMonth = `${params.get('month') ?? today.slice(0, 7)}-01`
  const month = isDayKey(requestedMonth) ? requestedMonth : `${today.slice(0, 7)}-01`
  const requestedDay = params.get('day') ?? today
  const selected = isDayKey(requestedDay) && requestedDay.slice(0, 7) === month.slice(0, 7) ? requestedDay : month
  const authors = [...new Set(notes.filter((note) => !note.deleted).map((note) => note.authorName))]
  const requestedAuthor = params.get('author') ?? ''
  const author = authors.includes(requestedAuthor) ? requestedAuthor : ''
  const summaries: DaySummary[] = []
  const monthDays = new Set(notes.filter((note) => note.dayKey.startsWith(month.slice(0, 7))).map((note) => note.dayKey))
  for (const dayKey of monthDays) {
    const visibleNotes = notes.filter((note) => note.dayKey === dayKey && !note.deleted && (!author || note.authorName === author))
    const metadata = store.getDayMetadata(dayKey)
    if (visibleNotes.length === 0 && (author || !metadata)) continue
    summaries.push({
      dayKey, count: visibleNotes.length,
      preview: visibleNotes[0] ? Array.from(plainText(visibleNotes[0].content)).slice(0, 85).join('') : 'Ghi chú đã ẩn; dấu ấn của ngày vẫn được giữ.',
      representativeStickerId: metadata?.representativeStickerId ?? null,
    })
  }
  const selectDay = (day: string) => {
    if (window.matchMedia('(min-width: 1200px)').matches) setParams({ month: day.slice(0, 7), day, ...(author ? { author } : {}) })
    else navigate(`/day/${day}`)
  }
  return <div className="calendar-page">
    <div className="page-intro"><h1>Cùng nhau, qua từng ngày.</h1><span>NHỮNG NGÀY BÊN NHAU / VOL. 01</span></div>
    <div className="calendar-and-day"><div className="calendar-column">
      <DateCover dayKey={selected} noteCount={notes.filter((note) => !note.deleted && note.dayKey === selected).length} />
      <AuthorFilters authors={authors} selected={author} dayKey={selected} onSelect={(name) => setParams({ month: month.slice(0, 7), day: selected, ...(name ? { author: name } : {}) })} />
      <MonthCalendar month={month} selectedDay={selected} summaries={summaries} onMonth={(day) => setParams({ month: day.slice(0, 7), day, ...(author ? { author } : {}) })} onSelect={selectDay} />
    </div><div className="desktop-day"><DayPanel key={selected} dayKey={selected} onSelectDay={selectDay} /><p className="panel-footnote">a little note, a lasting memory.</p></div></div>
    <footer className="page-footer"><span><LockKeyhole size={13} />Bản thử nghiệm · dữ liệu mẫu trên trình duyệt</span><Link to="/about">Về cuốn sổ này<ArrowUpRight size={13} /></Link></footer>
  </div>
}

export function DayPage() {
  const { dateKey = '' } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  if (!isDayKey(dateKey)) return <NotFound message="Ngày không hợp lệ. Vui lòng chọn một ngày từ lịch." />
  return <div className="full-day-container"><Link className="back-link" to={`/calendar?month=${dateKey.slice(0, 7)}&day=${dateKey}`}><ArrowLeft size={16} />Trở về lịch kỷ niệm</Link><div className="full-day-heading"><p className="eyebrow">MỖI NGÀY, MỘT CÂU CHUYỆN</p><h1>Chuyện của ngày này<span> ♡</span></h1></div><div className="mock-notice"><span className="notice-dot" /><p>Dữ liệu mẫu · chỉ lưu trên trình duyệt này.</p></div><DayPanel key={dateKey} dayKey={dateKey} fullPage initialCompose={params.get('write') === '1'} onSelectDay={(day) => navigate(`/day/${day}`)} /></div>
}

export function JoinPage() {
  return <div className="join-page"><span className="join-icon"><BookOpen size={42} strokeWidth={1.3} /></span><p className="eyebrow">OUR STORIES</p><h1>Một cuốn nhật ký.<br />Nhiều câu chuyện.</h1><p>Có những kỷ niệm đẹp hơn khi được giữ lại cùng nhau.</p><div className="join-status"><LockKeyhole size={20} /><h2>Luồng đăng nhập chưa được bật</h2><p>Đây là Phase 1 với dữ liệu mẫu. Đăng nhập Google, xác thực lời mời và quyền thành viên sẽ được triển khai sau khi duyệt bước tiếp theo.</p></div><Button asChild><Link to="/calendar">Khám phá bản mẫu<ArrowRight /></Link></Button><span className="join-caption">Không xác thực hoặc sử dụng mã mời trong bản thử nghiệm này.</span></div>
}

export function AboutPage() {
  return <div className="about-page"><p className="eyebrow"><Sparkles size={14} />OUR STORIES · PHASE 1</p><h1>Một góc nhỏ, đang thành hình<span>.</span></h1><p className="page-description">Bản thử nghiệm giao diện của cuốn nhật ký chung.</p><div className="about-grid"><section><Feather /><h2>Bạn có thể thử</h2><p>Mở lịch tháng, đi đến một ngày, viết và chỉnh sửa ghi chú có định dạng. Dữ liệu mẫu được lưu trên trình duyệt để bạn thử tải lại trang.</p><p>Người lưu ghi chú đầu tiên của ngày mới được chọn một sticker đại diện. Dấu ấn này được giữ lại cả khi ghi chú đầu tiên bị ẩn; dữ liệu mẫu cũ chưa biết thứ tự ghi sẽ không tự nhận quyền chọn.</p><p>Bản nháp nằm trong phiên trình duyệt. Bản sửa cũ và ghi chú đã ẩn được giữ trong dữ liệu mẫu.</p></section><section><ShieldCheck /><h2>Trước khi sử dụng thật</h2><p>Chưa có đăng nhập Google, liên kết mời, kiểm tra thành viên hoặc đồng bộ giữa các thiết bị. Đây chưa phải nơi lưu nhật ký riêng tư.</p><p>Firestore đang chặn mọi truy cập. Bảo mật, lịch sử và khôi phục dữ liệu thật cần được kiểm thử ở các phase tiếp theo.</p></section></div><p className="about-warning">Đừng nhập nội dung riêng tư vào bản thử nghiệm. Khi xóa dữ liệu trình duyệt, ghi chú mẫu có thể mất. Kiểm tra phiên bản và người viết đầu tiên trong mock chỉ minh họa, không bảo đảm ghi đồng thời giữa các tab.</p><Button asChild><Link to="/calendar"><ArrowLeft />Quay về lịch kỷ niệm</Link></Button></div>
}

export function NotFound({ message = 'Trang này không tồn tại trong cuốn nhật ký.' }: { message?: string }) {
  return <div className="not-found"><BookOpen size={36} /><h1>Chưa tìm thấy trang</h1><p>{message}</p><Button asChild><Link to="/calendar">Trở về lịch</Link></Button></div>
}
