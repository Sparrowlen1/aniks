import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, CalendarDays, UserPlus, Globe, MapPin, ChevronRight, Bot } from 'lucide-react'
import StatCard from '../components/StatCard'
import TrendBarChart from '../components/charts/TrendBarChart'
import DonutChart from '../components/charts/DonutChart'
import EventCalendar from '../components/EventCalendar'
import { useAdminColors, initials, avatarColor } from '../theme'
import { fetchDonations, fetchRegistrations, fetchEvents, fetchWhatsAppStats, normalizeDonation } from '../../lib/api'
import { storiesStore } from '../../data/storiesStore'
import { buildActivityFeed } from '../utils/activityFeed'
import { parseEventDate } from '../../lib/eventDate'

const reach = [
  { country: 'Kenya', tag: 'HQ · Operational' },
  { country: 'Uganda', tag: 'Operational' },
  { country: 'Rwanda', tag: 'Operational' },
  { country: 'Ghana', tag: 'Programme reach' },
  { country: 'South Africa', tag: 'Programme reach' },
]

const MONTHS_BACK = 6
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Merges registrations, donations, and stories into one feed. Partners is
// left out on purpose — PartnerContext has no timestamp, so there's no real
// "when" to sort it by.
function toKES(amount, currency) {
  return currency === 'USD' ? amount * 130 : amount
}

function monthKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function buildDonationTrend(donations) {
  const now = new Date()
  const months = []
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: monthKey(d), label: d.toLocaleDateString('en-GB', { month: 'short' }), value: 0 })
  }
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]))
  donations.forEach((d) => {
    if (!d.createdAt) return
    const key = monthKey(new Date(d.createdAt))
    if (byKey[key]) byKey[key].value += toKES(d.amount, d.currency)
  })
  return months.map(({ label, value }) => ({ label, value: Math.round(value) }))
}

function buildGiftSize(donations, colors) {
  const buckets = { under: 0, mid: 0, over: 0 }
  donations.forEach((d) => {
    const kes = toKES(d.amount, d.currency)
    if (kes < 1000) buckets.under += 1
    else if (kes <= 5000) buckets.mid += 1
    else buckets.over += 1
  })
  const total = donations.length || 1
  return [
    { label: 'Under 1,000', percent: Math.round((buckets.under / total) * 100), color: colors.red },
    { label: '1,000–5,000', percent: Math.round((buckets.mid / total) * 100), color: colors.orange },
    { label: 'Over 5,000', percent: Math.round((buckets.over / total) * 100), color: colors.blue },
  ]
}

function Card({ title, action, children, colors, id, to }) {
  const Tag = to ? Link : 'div'
  const linkProps = to ? { to } : {}

  return (
    <Tag
      {...linkProps}
      id={id}
      style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
      className={`block rounded-xl p-5 ${to ? 'transition-transform hover:-translate-y-0.5 hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold" style={{ color: colors.text }}>
          {title}
        </h2>
        {action ?? (to && <ChevronRight size={16} style={{ color: colors.muted }} />)}
      </div>
      <div className="mt-4">{children}</div>
    </Tag>
  )
}

function Dashboard() {
  const COLORS = useAdminColors()
  const [donations, setDonations] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [events, setEvents] = useState([])
  const [waStats, setWaStats] = useState({ threads: 0, optedOut: 0, escalated: 0, unread: 0 })
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRegistrationsThisWeek, setNewRegistrationsThisWeek] = useState(0)

  const activityColor = {
    registration: COLORS.red,
    donation: COLORS.orange,
    story: COLORS.blue,
    whatsapp: '#25D366',
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchDonations(), fetchRegistrations(), fetchEvents(), fetchWhatsAppStats(), storiesStore.getAll().catch(() => [])]).then(
      ([donationsRes, registrationsRes, eventsRes, waRes, storiesRows]) => {
        if (cancelled) return
        setDonations(donationsRes.rows.map(normalizeDonation))
        setRegistrations(registrationsRes.rows)
        setEvents(eventsRes.rows)
        setWaStats(waRes || { threads: 0, optedOut: 0, escalated: 0, unread: 0 })
        setStories(storiesRows)
        const now = Date.now()
        setNewRegistrationsThisWeek(
          registrationsRes.rows.filter((r) => {
            const createdAt = r.created_at ?? r.createdAt
            return createdAt && now - new Date(createdAt).getTime() < WEEK_MS
          }).length
        )
        setLoading(false)
      }
    )
    return () => {
      cancelled = true
    }
  }, [])

  const donationTrend = useMemo(() => buildDonationTrend(donations), [donations])
  const giftSize = useMemo(() => buildGiftSize(donations, COLORS), [donations, COLORS])
  const totalRaised = useMemo(
    () => donations.filter((d) => d.status !== 'Failed').reduce((sum, d) => sum + toKES(d.amount, d.currency), 0),
    [donations]
  )
  const recentDonations = useMemo(
    () =>
      [...donations]
        .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
        .slice(0, 5),
    [donations]
  )
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .map((e) => ({ ...e, _date: parseEventDate(e.date) }))
      .filter((e) => !Number.isNaN(e._date.getTime()) && e._date >= now)
      .sort((a, b) => a._date - b._date)
      .slice(0, 4)
  }, [events])
  const recentActivity = useMemo(
    () => buildActivityFeed(registrations, donations, stories),
    [registrations, donations, stories]
  )
  const liveActivity = [...recentActivity]
  if (waStats.escalated > 0) {
    liveActivity.unshift({
      text: `${waStats.escalated} WhatsApp ${waStats.escalated === 1 ? 'conversation needs' : 'conversations need'} a human reply (HELP routed)`,
      time: 'Routing from the assistant',
      to: '/admin/whatsapp/inbox',
      type: 'whatsapp',
    })
  }
  if (waStats.unread > 0) {
    liveActivity.unshift({
      text: `${waStats.unread} unread WhatsApp ${waStats.unread === 1 ? 'message' : 'messages'} in the inbox`,
      time: 'Answered by Anika Assistant',
      to: '/admin/whatsapp/inbox',
      type: 'whatsapp',
    })
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100%' }} className="rounded-lg p-6 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
          A quick overview of what's happening across ANIKA.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="TOTAL RAISED"
          value={loading ? '…' : `KES ${Math.round(totalRaised).toLocaleString()}`}
          sub={loading ? ' ' : `${donations.length} contributions`}
          icon={DollarSign}
          bg={COLORS.red}
          to="/admin/donations"
        />
        <StatCard
          label="UPCOMING EVENTS"
          value={loading ? '…' : String(upcomingEvents.length)}
          sub={loading ? ' ' : `of ${events.length} scheduled`}
          icon={CalendarDays}
          bg={COLORS.green}
          to="/admin/events"
        />
        <StatCard
          label="NEW REGISTRATIONS"
          value={loading ? '…' : String(registrations.length)}
          sub={loading ? ' ' : `▲ ${newRegistrationsThisWeek} in the last 7 days`}
          icon={UserPlus}
          bg={COLORS.orange}
          textColor="#1c1a17"
          to="/admin/registrations"
        />
        <StatCard label="ACTIVE COUNTRIES" value="5" sub="KE · UG · RW · GH · ZA" icon={Globe} bg={COLORS.blue} to="#where-we-reach" />
      </div>

      <Link
        to="/admin/whatsapp/assistant"
        className="mb-5 flex items-center gap-4 rounded-xl border p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md"
        style={{ background: '#1c1a17', borderColor: '#1c1a17' }}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: '#25D366' }}>
          <Bot size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Anika Assistant</p>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {waStats.threads > 0
              ? `${waStats.threads} conversations handled · ${waStats.unread} unread · ${waStats.escalated} escalations`
              : 'Configure replies, test the bot live or reply from the inbox.'}
          </p>
        </div>
        <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
      </Link>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Card title="Donation trend" colors={COLORS} to="/admin/donations">
          <TrendBarChart data={donationTrend} colors={COLORS} />
          <p className="mt-3 text-xs" style={{ color: COLORS.muted }}>
            KES {Math.round(totalRaised).toLocaleString()} · {donations.length} contributions this period.
          </p>
        </Card>

        <Card title="By gift size" colors={COLORS} to="/admin/donations">
          <DonutChart data={giftSize} centerValue={donations.length} centerLabel="Gifts" colors={COLORS} />
          <ul className="mt-4 space-y-2">
            {giftSize.map((slice) => (
              <li key={slice.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2" style={{ color: COLORS.muted }}>
                  <span className="h-2 w-2 rounded-sm" style={{ background: slice.color }} />
                  {slice.label}
                </span>
                <span className="font-bold" style={{ color: COLORS.text }}>
                  {slice.percent}%
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Recent donations" colors={COLORS} to="/admin/donations">
          {loading ? (
            <p className="text-sm" style={{ color: COLORS.muted }}>
              Loading…
            </p>
          ) : recentDonations.length === 0 ? (
            <p className="text-sm" style={{ color: COLORS.muted }}>
              No donations yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentDonations.map((d) => (
                <li key={d.id} className="flex items-center gap-3 text-sm">
                  <div
                    style={{ background: avatarColor(d.name) }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  >
                    {initials(d.name)}
                  </div>
                  <span className="flex-1" style={{ color: COLORS.text }}>
                    {d.name}
                  </span>
                  <span className="font-bold" style={{ color: d.status === 'Pending' ? COLORS.orange : COLORS.green }}>
                    {d.status === 'Pending' ? 'pending' : `+${d.amount.toLocaleString()}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Recent activity" colors={COLORS}>
          <ul>
            {liveActivity.map((item) => (
              <li key={item.text} className="border-t first:border-t-0" style={{ borderColor: COLORS.border }}>
                <Link
                  to={item.to}
                  className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-black/5"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: activityColor[item.type] }} />
                  <div>
                    <p className="text-sm" style={{ color: COLORS.text }}>
                      {item.text}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.muted }}>
                      {item.time}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {loading ? (
            <p className="text-sm" style={{ color: COLORS.muted }}>
              Loading…
            </p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm" style={{ color: COLORS.muted }}>
              No recent activity yet.
            </p>
          ) : (
            <ul>
              {recentActivity.map((item) => (
                <li key={item.id} className="border-t first:border-t-0" style={{ borderColor: COLORS.border }}>
                  <Link
                    to={item.to}
                    className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-black/5"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: activityColor[item.type] }} />
                    <div>
                      <p className="text-sm" style={{ color: COLORS.text }}>
                        {item.text}
                      </p>
                      <p className="text-xs" style={{ color: COLORS.muted }}>
                        {item.time}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          id="where-we-reach"
          title="Where we reach"
          colors={COLORS}
          action={
            <span
              style={{ background: COLORS.panelAlt, color: COLORS.text }}
              className="rounded-full px-2.5 py-1 text-xs font-bold"
            >
              {reach.length} countries
            </span>
          }
        >
          <ul className="space-y-2.5">
            {reach.map((r) => (
              <li key={r.country} className="flex items-center gap-3 text-sm">
                <MapPin size={14} style={{ color: COLORS.muted }} />
                <span className="flex-1" style={{ color: COLORS.text }}>
                  {r.country}
                </span>
                <span className="text-xs" style={{ color: COLORS.muted }}>
                  {r.tag}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs" style={{ color: COLORS.muted }}>
            Kenya HQ, with programme reach across {reach.length} African countries via the 2022 Fellowship.
          </p>
        </Card>
      </div>

      <div className="mt-5">
        <Card
          title="Upcoming events"
          colors={COLORS}
          action={
            <Link to="/admin/events" className="text-xs font-bold tracking-wide" style={{ color: COLORS.text }}>
              ALL EVENTS
            </Link>
          }
        >
          {loading ? (
            <p className="text-sm" style={{ color: COLORS.muted }}>
              Loading…
            </p>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm" style={{ color: COLORS.muted }}>
              No upcoming events scheduled.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
              <EventCalendar events={upcomingEvents} colors={COLORS} />
              <ul className="space-y-3">
                {upcomingEvents.map((e, i) => {
                  const featured = i === 0
                  return (
                    <li key={e.id}>
                      <Link
                        to="/admin/events"
                        style={{ background: featured ? COLORS.blue : COLORS.panelAlt }}
                        className="flex items-center gap-4 rounded-xl p-3 transition-transform hover:-translate-y-0.5"
                      >
                        <div
                          style={{
                            background: featured ? 'rgba(255,255,255,0.2)' : COLORS.panel,
                            color: featured ? '#fff' : COLORS.text,
                          }}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
                        >
                          {String(e._date.getDate()).padStart(2, '0')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold" style={{ color: featured ? '#fff' : COLORS.text }}>
                            {e.title}
                          </p>
                          <p className="text-xs" style={{ color: featured ? 'rgba(255,255,255,0.75)' : COLORS.muted }}>
                            {e._date.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold" style={{ color: featured ? '#fff' : COLORS.text }}>
                          {e.time}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
