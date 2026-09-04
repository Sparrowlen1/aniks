
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Reveal from '../components/Reveal'
import Counter from '../components/Counter'
import { whatsappUrl } from '../lib/whatsapp'
import { fetchEvents } from '../lib/api'
import { storiesStore } from '../data/storiesStore'
import { PILLARS } from '../data/pillars'
import { parseEventDate } from '../lib/eventDate'

// Same storage key + defaults as the admin "Impact metrics" editor
// (src/admin/pages/Impact.jsx) — these stats are admin-edited there,
// saved to localStorage, and read here so the two stay in sync.
const IMPACT_STORAGE_KEY = 'anika_admin_impact_stats'
const HOME_STATS = [
  { label: 'Events Held', fallback: '100+', color: 'text-coral' },
  { label: 'Forum Participants', fallback: '2,500+', color: 'text-anika-green' },
  { label: 'Artists Engaged', fallback: '150', color: 'text-gold' },
  { label: 'Online Impressions', fallback: '24M+', color: 'text-anika-blue' },
]

// Admin stores values as free-text ("2,500+", "24M+") — split back into a
// numeric target Counter can animate to, plus whatever suffix follows it.
function parseStatValue(value) {
  const match = /^([\d,.]+)\s*(.*)$/.exec(String(value ?? '').trim())
  if (!match) return { target: 0, suffix: '' }
  return { target: parseFloat(match[1].replace(/,/g, '')) || 0, suffix: match[2].trim() }
}

function readImpactStats() {
  let saved = []
  try {
    saved = JSON.parse(localStorage.getItem(IMPACT_STORAGE_KEY)) || []
  } catch {
    saved = []
  }
  return HOME_STATS.map(({ label, fallback, color }) => {
    const match = saved.find((s) => s.label?.toLowerCase() === label.toLowerCase())
    const { target, suffix } = parseStatValue(match?.value ?? fallback)
    return { label, target, suffix, color }
  })
}

const pillars = [
  { name: 'Arts & Culture', color: 'bg-coral', description: 'Heritage, cultural exchange and collaborative artistic production across borders.' },
  { name: 'Youth & Migration', color: 'bg-anika-green', description: 'Belonging, refugee experience and life alongside host communities.' },
  { name: 'Expressions', color: 'bg-gold', description: 'Exploration, creative enterprise and art therapy for artists to evolve.' },
  { name: 'Gender Equality', color: 'bg-anika-blue', description: 'Safe spaces for rights, agency, reproductive health and healing.' },
  { name: 'Governance', color: 'bg-ink', description: 'Deepening youth engagement with rights, civic life and democracy.' },
]

const polaroid = (rotate) =>
  `bg-cream p-2 pb-6 shadow-xl ${rotate} transition-transform duration-300 ease-out hover:rotate-0`

function Home() {
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [stories, setStories] = useState([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [stats] = useState(readImpactStats)

  useEffect(() => {
    let cancelled = false
    fetchEvents()
      .then(({ rows }) => {
        if (cancelled) return
        const now = new Date()
        const upcoming = (rows || [])
          .filter((e) => e.status === 'Live' || e.status === 'Full')
          .map((e) => ({ ...e, _date: parseEventDate(e.date) }))
          .filter((e) => !Number.isNaN(e._date.getTime()) && e._date >= now)
          .sort((a, b) => a._date - b._date)
          .slice(0, 3)
        setEvents(upcoming)
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    storiesStore
      .getPublished()
      .then((rows) => {
        if (cancelled) return
        setStories((rows || []).slice(0, 3))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStoriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className="relative -mt-[93px] overflow-hidden bg-charcoal pt-[93px] text-cream">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(18,18,18,0.95) 35%, rgba(18,18,18,0.75) 70%, rgba(18,18,18,0.55)), url('/image11.jpg')",
            backgroundBlendMode: 'multiply',
            filter: 'grayscale(1)',
          }}
        />
        <img
          src="/anika-flower.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 w-md rotate-0 opacity-90 "
        />
        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <Reveal className="max-w-5xl text-left">
            <span className="-rotate-3 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-1 font-body text-sm font-semibold uppercase tracking-wide text-ink">
              A Pan-African art-based initiative
            </span>
            <h1 className="mt-6 font-display text-5xl uppercase leading-tight sm:text-8xl">
              Silence kills,
              <br />
              <span className="text-coral">art airs.</span>
            </h1>
            <p className="mt-6 max-w-xl font-body text-lg text-cream/80">
              Over nine years of art-based work turning spoken word, theatre and visual art into
              open conversation, surfacing what society keeps quiet, and amplifying young voices
              across Africa.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <NavLink
                to="/programs"
                className="rounded-full bg-coral px-6 py-3 font-body text-sm font-semibold uppercase tracking-wide text-cream hover:opacity-90"
              >
                Explore Our Work
              </NavLink>
              <NavLink
                to="/donate"
                className="rounded-full border border-cream/40 px-6 py-3 font-body text-sm font-semibold uppercase tracking-wide text-cream hover:border-cream"
              >
                Support Us
              </NavLink>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-charcoal">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-12 gap-y-8 px-6 py-10 sm:grid-cols-4 sm:gap-x-16">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100} className="text-center">
              <p className={`font-display text-3xl sm:text-4xl ${stat.color}`}>
                <Counter to={stat.target} suffix={stat.suffix} />
              </p>
              <p className="mt-1 font-body text-xs uppercase tracking-wide text-cream/60">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="font-body text-base font-semibold uppercase tracking-wide text-anika-green">About Anika</p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-tight text-ink sm:text-5xl">
              Art brings into the open what is hidden.
            </h2>
            <p className="mt-4 font-body text-lg text-ink/70">
              ANIKA Initiative is a Pan-African art-based initiative whose journey began in 2015
              with a gathering of seven poets and rappers seeking to find and amplify their
              voices.
            </p>
            <blockquote className="mt-4 border-l-2 border-coral pl-4 font-editorial text-xl italic text-ink/80">
              "We began as petals. Seven voices seated around possibility."
            </blockquote>
            <NavLink
              to="/about"
              className="mt-6 inline-block rounded border border-ink px-5 py-2 font-body text-sm font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-cream"
            >
              Read Our Story
            </NavLink>
          </Reveal>
          <Reveal delay={150}>
            <div className={polaroid('rotate-2')}>
              <img
                src="/anika%20team.jpg"
                alt="Three ANIKA team members smiling together"
                className="aspect-4/3 w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-20">
          <div className="grid gap-6 sm:grid-cols-2">
            <Reveal>
              <p className="font-body text-base font-semibold uppercase tracking-wide text-coral">What We Do</p>
              <h2 className="mt-3 font-display text-4xl uppercase leading-tight text-ink sm:text-5xl">
                Five pillars.
                <br />
                One belief.
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="font-body text-lg text-ink/70">
                Across every theme the work opens the same door, into deeper conversations with
                communities, practitioners and decision-makers.
              </p>
              <NavLink
                to="/programs"
                className="mt-4 flex w-fit ml-auto items-center justify-center rounded bg-ink px-5 py-2 font-body text-sm font-semibold uppercase tracking-wide text-cream hover:opacity-90"
              >
                See All Programs
              </NavLink>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.name} delay={i * 100} className="border border-ink/10 bg-cream p-6">
                <span className={`block h-1 w-10 ${pillar.color}`} />
                <p className="mt-4 font-body text-lg font-semibold text-ink">{pillar.name}</p>
                <p className="mt-2 font-body text-sm text-ink/60">{pillar.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-coral text-cream">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-body text-base font-semibold uppercase tracking-wide text-cream/80">Upcoming</p>
              <h2 className="mt-2 font-display text-4xl uppercase leading-tight sm:text-5xl">Air it out.</h2>
            </div>
            <NavLink
              to="/events"
              className="rounded bg-ink px-5 py-2 font-body text-sm font-semibold uppercase tracking-wide text-cream hover:opacity-90"
            >
              See All Events
            </NavLink>
          </Reveal>

          {eventsLoading ? (
            <p className="mt-10 font-body text-sm text-cream/60">Loading upcoming events…</p>
          ) : events.length === 0 ? (
            <p className="mt-10 font-body text-sm text-cream/60">No upcoming events scheduled right now — check back soon.</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {events.map((event, i) => (
                <Reveal key={event.id} delay={i * 100}>
                  <img
                    src={event.image || '/image6.jpg'}
                    alt={event.pillar || event.title}
                    className="aspect-4/3 w-full rounded object-cover"
                  />
                  <p className="mt-3 font-editorial text-2xl italic">{event.pillar || event.title}</p>
                  <p className="mt-1 font-body text-sm uppercase tracking-wide text-cream/70">
                    {event.date}{event.location ? ` · ${event.location}` : ''}
                  </p>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <p className="font-body text-base font-semibold uppercase tracking-wide text-coral">From the Field</p>
          <h2 className="mt-3 font-display text-4xl uppercase leading-tight text-ink sm:text-5xl">
            Stories with <span className="font-editorial italic normal-case text-coral">a pulse.</span>
          </h2>
        </Reveal>

        {storiesLoading ? (
          <p className="mt-10 font-body text-sm text-ink/60">Loading stories…</p>
        ) : stories.length === 0 ? (
          <p className="mt-10 font-body text-sm text-ink/60">New stories are on their way — check back soon.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {stories.map((story, i) => (
              <Reveal key={story.slug} delay={i * 100}>
                <img
                  src={story.image}
                  alt={story.title}
                  className="aspect-4/3 w-full rounded object-cover"
                />
                <p className="mt-3 font-body text-xs font-semibold uppercase tracking-wide text-coral">
                  {PILLARS.find((p) => p.slug === story.pillar)?.name || story.pillar}
                </p>
                <p className="mt-1 font-body font-semibold text-ink">{story.title}</p>
                <NavLink
                  to={`/stories/${story.slug}`}
                  className="mt-3 inline-block rounded bg-ink px-4 py-2 font-body text-xs font-semibold uppercase tracking-wide text-cream hover:opacity-90"
                >
                  Read Our Story
                </NavLink>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="bg-anika-blue text-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="font-body text-base font-semibold uppercase tracking-wide text-gold">
              Community Broadcast
            </p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-tight sm:text-5xl">
              Never miss a campaign dispatch.
            </h2>
            <p className="mt-4 font-body text-lg text-cream/80">
              Join our WhatsApp channel for events, calls for artists and updates, right where
              you already are. No spam, opt out anytime.
            </p>
            <a
              href={whatsappUrl('Hello ANIKA, I would like to join the WhatsApp channel.')}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 font-body text-sm font-semibold uppercase tracking-wide text-anika-green hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.24 0 4.35.87 5.93 2.46a8.26 8.26 0 0 1 2.43 5.88c0 4.59-3.74 8.33-8.35 8.33a8.3 8.3 0 0 1-4.24-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.27-4.42c0-4.6 3.74-8.38 8.29-8.38m-4.6 4.75c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.7 2.72 4.2 3.7 2.08.83 2.5.66 2.95.62.45-.04 1.46-.6 1.66-1.17.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.46-.28-.24-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.12-.16.24-.64.8-.79.97-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.44.12-.15.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.48Z" />
              </svg>
              Join WhatsApp Channel
            </a>
          </Reveal>
          <Reveal delay={150}>
            <div className={polaroid('-rotate-2')}>
              <img
                src="/listener.jpg"
                alt="A community member listening at an ANIKA event"
                className="aspect-4/3 w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default Home
