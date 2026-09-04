import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { parseEventDate } from '../../lib/eventDate'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function EventCalendar({ events, colors }) {
  const [cursor, setCursor] = useState(() => {
    const parsed = events?.[0] ? parseEventDate(events[0].date) : new Date()
    const first = Number.isNaN(parsed.getTime()) ? new Date() : parsed
    return new Date(first.getFullYear(), first.getMonth(), 1)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const startOffset = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const eventsByDay = {}
  ;(events ?? []).forEach((e) => {
    const d = parseEventDate(e.date)
    if (Number.isNaN(d.getTime())) return
    if (d.getFullYear() === year && d.getMonth() === month) {
      ;(eventsByDay[d.getDate()] ??= []).push(e)
    }
  })

  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className="rounded-lg p-1.5 hover:bg-black/5"
          style={{ color: colors.muted }}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-bold" style={{ color: colors.text }}>
          {cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="rounded-lg p-1.5 hover:bg-black/5"
          style={{ color: colors.muted }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-2 text-center text-xs font-bold" style={{ color: colors.muted }}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {cells.map((d, i) => {
          if (d === null) return <div key={`blank-${i}`} />
          const dayEvents = eventsByDay[d]
          const hasEvent = Boolean(dayEvents)
          const isToday = sameDay(new Date(year, month, d), today)
          return (
            <div key={d} className="flex items-center justify-center">
              <span
                title={dayEvents?.map((e) => e.title).join(', ')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold sm:h-10 sm:w-10"
                style={{
                  background: isToday ? colors.orange : hasEvent ? colors.blue : 'transparent',
                  color: isToday ? '#1c1a17' : hasEvent ? '#fff' : colors.text,
                  boxShadow: isToday && hasEvent ? `0 0 0 2px ${colors.panel}, 0 0 0 4px ${colors.blue}` : 'none',
                }}
              >
                {d}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t pt-3 text-xs" style={{ borderColor: colors.border, color: colors.muted }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.blue }} />
          Event day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.orange }} />
          Today
        </span>
      </div>
    </div>
  )
}

export default EventCalendar
