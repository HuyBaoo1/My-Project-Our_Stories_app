export const DIARY_TIMEZONE = 'Asia/Ho_Chi_Minh'

export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= '1900-01-01' && value <= '2100-12-31'
}

export function todayDayKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DIARY_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function shiftDay(dayKey: string, offset: number): string {
  if (!isDayKey(dayKey)) throw new Error('Ngày không hợp lệ.')
  const date = new Date(`${dayKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function shiftMonth(dayKey: string, offset: number): string {
  const date = new Date(`${dayKey.slice(0, 7)}-01T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  return date.toISOString().slice(0, 10)
}

export function formatDay(dayKey: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('vi-VN', { ...options, timeZone: DIARY_TIMEZONE }).format(new Date(`${dayKey}T12:00:00+07:00`))
}

export function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: DIARY_TIMEZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp))
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(-2).map((word) => word[0]).join('').toLocaleUpperCase('vi-VN')
}
