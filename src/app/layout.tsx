import { NavLink, Outlet, Link } from 'react-router-dom'
import { BookOpen, CalendarDays, Feather, Heart, Info, Leaf, LockKeyhole, PanelLeftClose } from 'lucide-react'
import { todayDayKey } from '../lib/date'
import { MOCK_DIARY } from '../mocks/fixtures'

export function Layout() {
  return <div className="app-layout">
    <a href="#main-content" className="skip-link">Đến nội dung chính</a>
    <aside className="sidebar">
      <Link to="/calendar" className="brand"><span className="brand-mark"><BookOpen size={24} strokeWidth={1.5} /><span /></span><span>our stories<span className="brand-caption">NHẬT KÝ CHUNG</span></span></Link>
      <div className="sidebar-divider" />
      <div className="diary-switch"><span className="diary-icon"><Leaf size={20} /></span><div><p>{MOCK_DIARY.name}</p><span>Không gian của chúng mình</span></div><PanelLeftClose size={14} className="text-muted-foreground" /></div>
      <p className="nav-label">GÓC NHỎ CỦA MÌNH</p>
      <nav className="sidebar-nav" aria-label="Điều hướng chính"><NavLink to="/calendar"><CalendarDays size={18} />Lịch kỷ niệm<span className="nav-dot" /></NavLink><NavLink to={`/day/${todayDayKey()}`}><Feather size={18} />Trang hôm nay</NavLink><NavLink to="/about"><Info size={18} />Về bản thử nghiệm</NavLink></nav>
      <div className="sidebar-quote"><span className="quote-mark">“</span><p>Ngày trôi qua.<br />Câu chuyện ở lại.</p><span className="quote-flower">✳</span><span className="quote-caption">CHO NHỮNG ĐIỀU BÌNH DỊ</span></div>
      <div className="sidebar-bottom"><div className="flex items-center gap-2"><span className="sample-avatars"><i>AN</i><i>MA</i><i>GH</i></span><span>3 nhân vật mẫu</span></div><p><LockKeyhole size={12} />Dữ liệu mẫu trên thiết bị</p></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><Link to="/calendar" className="mobile-brand"><BookOpen size={20} />our stories</Link><div className="breadcrumb"><Heart size={15} />{MOCK_DIARY.name}</div><div className="topbar-right"><span className="demo-badge"><span />BẢN THỬ NGHIỆM</span><span className="user-avatar" aria-label="Bạn, người dùng mẫu">B</span></div></header>
      <main id="main-content" tabIndex={-1}><Outlet /></main>
      <nav className="mobile-navigation" aria-label="Điều hướng di động"><NavLink to="/calendar"><CalendarDays size={19} /><span>Lịch kỷ niệm</span></NavLink><Link to={`/day/${todayDayKey()}?write=1`} className="mobile-write"><Feather size={18} />Viết hôm nay</Link><NavLink to="/about"><Info size={19} /><span>Bản thử nghiệm</span></NavLink></nav>
    </div>
  </div>
}
