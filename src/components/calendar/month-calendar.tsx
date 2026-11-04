import { useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import { ChevronLeft, ChevronRight, CalendarDays, ArrowDownRight } from 'lucide-react'
import { Button } from '../ui/button'
import { formatDay, shiftMonth, todayDayKey } from '../../lib/date'
import type { DaySummary } from '../../types/diary'

interface Props { month: string; selectedDay: string; summaries: DaySummary[]; onMonth: (day: string) => void; onSelect: (day: string) => void }

export function MonthCalendar({ month, selectedDay, summaries, onMonth, onSelect }: Props) {
  const calendar = useRef<FullCalendar>(null)
  const today = todayDayKey()
  const prev = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)
  const goMonth = (day: string) => { calendar.current?.getApi().gotoDate(day); onMonth(day) }
  return <section className="calendar-card" aria-label="Lịch tháng">
    <div className="calendar-toolbar">
      <div><h2 className="month-title">{formatDay(month, { month: 'long', year: 'numeric' })}</h2><p className="mt-1 text-xs text-muted-foreground">{summaries.length} ngày có kỷ niệm · {summaries.reduce((sum, day) => sum + day.count, 0)} ghi chú mẫu</p></div>
      <div className="calendar-controls"><Button variant="outline" size="sm" onClick={() => { goMonth(`${today.slice(0, 7)}-01`); onSelect(today) }}>Hôm nay</Button><div className="month-arrows"><Button variant="ghost" size="icon" aria-label="Tháng trước" disabled={prev < '1900-01-01'} onClick={() => goMonth(prev)}><ChevronLeft /></Button><Button variant="ghost" size="icon" aria-label="Tháng sau" disabled={next > '2100-12-31'} onClick={() => goMonth(next)}><ChevronRight /></Button></div></div>
    </div>
    <FullCalendar key={month} ref={calendar} plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" initialDate={month} locale={viLocale} firstDay={1}
      headerToolbar={false} height="auto" fixedWeekCount={false} showNonCurrentDates dayMaxEvents={1} displayEventTime={false} now={today}
      validRange={{ start: '1900-01-01', end: '2101-01-01' }}
      dayHeaderContent={(arg) => <span>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][arg.date.getDay()]}</span>}
      dayCellClassNames={(arg) => {
        const key = `${arg.date.getFullYear()}-${String(arg.date.getMonth() + 1).padStart(2, '0')}-${String(arg.date.getDate()).padStart(2, '0')}`
        return key === selectedDay ? ['selected-day'] : []
      }}
      dayCellContent={(arg) => {
        const dayKey = `${arg.date.getFullYear()}-${String(arg.date.getMonth() + 1).padStart(2, '0')}-${String(arg.date.getDate()).padStart(2, '0')}`
        return <button type="button" className="day-number" aria-label={`Mở ngày ${dayKey}`} aria-current={dayKey === today ? 'date' : undefined} onClick={(event) => { event.stopPropagation(); onSelect(dayKey) }}>{arg.date.getDate()}</button>
      }}
      dateClick={(info) => onSelect(info.dateStr)}
      events={summaries.map((summary) => ({ id: summary.dayKey, start: summary.dayKey, title: summary.preview, allDay: true, extendedProps: { count: summary.count } }))}
      eventClick={(info) => { info.jsEvent.preventDefault(); onSelect(info.event.id) }}
      eventContent={(arg) => <div className="calendar-note"><div className="calendar-note-count"><span />{Number(arg.event.extendedProps.count)} ghi chú</div><p>{arg.event.title}</p></div>}
    />
    <div className="calendar-legend"><span><i />Ngày có ghi chú</span><span className="calendar-hint">Chọn một ngày để mở trang nhật ký <ArrowDownRight size={14} /></span><span className="mobile-hint"><CalendarDays size={13} />Chạm vào ngày để đọc</span></div>
  </section>
}
