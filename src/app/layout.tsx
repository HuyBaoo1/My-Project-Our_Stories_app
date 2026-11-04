import { NavLink, Outlet, Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Feather, Info } from 'lucide-react'
import { todayDayKey } from '../lib/date'

export function Layout() {
  const today = todayDayKey()
  return <div className="app-layout">
    <a href="#main-content" className="skip-link">Đến nội dung chính</a>
    <header className="site-header">
      <Link to="/calendar" className="brand" aria-label="Our Stories — về lịch">our stories<span className="brand-star" aria-hidden="true">✳</span></Link>
      <nav className="desktop-navigation" aria-label="Điều hướng chính">
        <NavLink to="/calendar"><CalendarDays size={17} />Lịch kỷ niệm</NavLink>
        <NavLink to={`/day/${today}`}><Feather size={17} />Trang hôm nay</NavLink>
        <NavLink to="/about"><Info size={17} />Bản thử nghiệm</NavLink>
      </nav>
      <Link className="today-link" to={`/calendar?month=${today.slice(0, 7)}&day=${today}`}>Hôm nay<ArrowUpRight size={17} /></Link>
    </header>
    <main id="main-content" tabIndex={-1}><Outlet /></main>
    <nav className="mobile-navigation" aria-label="Điều hướng di động">
      <NavLink to="/calendar"><CalendarDays /><span>Lịch kỷ niệm</span></NavLink>
      <Link to={`/day/${today}?write=1`}><Feather /><span>Viết hôm nay</span></Link>
      <NavLink to="/about"><Info /><span>Bản thử nghiệm</span></NavLink>
    </nav>
  </div>
}
