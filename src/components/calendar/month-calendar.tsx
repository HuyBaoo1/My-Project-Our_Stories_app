import { useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { formatDay, shiftMonth, todayDayKey } from '../../lib/date'
import type { DaySummary } from '../../types/diary'
import { CalendarDaySticker } from '../../features/stickers/CalendarDaySticker'

interface Props { month: string; selectedDay: string; summaries: DaySummary[]; onMonth: (day: string) => void; onSelect: (day: string) => void }

export function MonthCalendar({ month, selectedDay, summaries, onMonth, onSelect }: Props) {
  const calendar = useRef<FullCalendar>(null)
  const prev = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)
  const today = todayDayKey()
  const goMonth = (day: string) => { calendar.current?.getApi().gotoDate(day); onMonth(day) }
  const getKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return <section className="calendar-card" aria-label="Lịch tháng">
    <div className="calendar-toolbar">
      <Button variant="ghost" size="icon" aria-label="Tháng trước" disabled={prev < '1900-01-01'} onClick={() => goMonth(prev)}><ChevronLeft /></Button>
      <h2 className="month-title" aria-label={formatDay(month, { month: 'long', year: 'numeric' })}><span>{month.slice(0, 4)}</span> Tháng {Number(month.slice(5, 7))}<small>{new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(`${month}T12:00:00Z`))}</small></h2>
      <Button variant="ghost" size="icon" aria-label="Tháng sau" disabled={next < '1900-01-01' || next > '2100-12-31'} onClick={() => goMonth(next)}><ChevronRight /></Button>
    </div>
    <FullCalendar key={month} ref={calendar} plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" initialDate={month} locale={viLocale} firstDay={1}
      headerToolbar={false} height="auto" fixedWeekCount={false} showNonCurrentDates={false} now={today}
      validRange={{ start: '1900-01-01', end: '2101-01-01' }}
      dayHeaderContent={(arg) => <span>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][arg.date.getDay()]}</span>}
      dayCellClassNames={(arg) => getKey(arg.date) === selectedDay ? ['selected-day'] : []}
      dayCellContent={(arg) => {
        const dayKey = getKey(arg.date)
        const summary = summaries.find((day) => day.dayKey === dayKey)
        return <button type="button" className={`day-number ${summary ? 'has-memory' : ''}`} aria-label={`Mở ngày ${dayKey}`} aria-current={dayKey === today ? 'date' : undefined} title={summary?.preview} onClick={(event) => { event.stopPropagation(); onSelect(dayKey) }}>
          <span className="calendar-day-digit">{arg.date.getDate()}</span>
          {summary && <CalendarDaySticker stickerId={summary.representativeStickerId} noteCount={summary.count} />}
        </button>
      }}
      dateClick={(info) => onSelect(info.dateStr)}
    />
    <div className="calendar-legend"><span><i />{summaries.reduce((sum, day) => sum + day.count, 0)} ghi chú · {summaries.length} ngày có kỷ niệm</span><span>Chạm một ngày, mở một câu chuyện ↗</span></div>
  </section>
}
