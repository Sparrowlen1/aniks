import { useEffect, useRef, useState } from 'react'
import { partnersIntro } from '../data/partners'
import { usePartners } from '../context/PartnerContext'

const CARDS_PER_PAGE_DESKTOP = 4
const AUTOPLAY_MS = 3000
const MOBILE_QUERY = '(max-width: 639px)'
const MARQUEE_SECONDS = 20

function chunk(list, size) {
  const pages = []
  for (let i = 0; i < list.length; i += size) {
    pages.push(list.slice(i, i + size))
  }
  return pages
}

// Legacy static logo map — only used as a fallback for partners that were
// added before the dashboard upload feature existed and have no partner.logo
// saved. Any partner with a logo uploaded via the dashboard uses that instead.
const legacyLogoMap = {
  'SEMA': '/partners/sema.png',
  'Strategic Applications': '/partners/strategic-applications.png',
  'Creatives Garage': '/partners/creatives-garage.png',
  'YWCA': '/partners/ywca.png',
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function PartnerCard({ partner, compact = false }) {
  // State to track if logo failed to load
  const [logoError, setLogoError] = useState(false)

  // Prefer the logo saved from the dashboard; fall back to the legacy
  // static file map for older partners that predate the upload feature.
  const logoSrc = partner.logo || legacyLogoMap[partner.name]

  // If the logo is updated in the dashboard, this card re-renders with a new
  // logoSrc but keeps the same React instance (keyed by partner.name/id), so
  // a stale logoError from a previous failed load would otherwise stick around
  // and hide the newly uploaded logo. Reset it whenever the source changes.
  useEffect(() => {
    setLogoError(false)
  }, [logoSrc])

  return (
    <div
      className={`group flex flex-col items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white/40 px-4 py-3 text-center ${
        compact ? 'w-28 shrink-0' : 'w-full'
      }`}
    >
      {logoSrc && !logoError ? (
        <img
          src={logoSrc}
          alt={partner.name}
          className="h-10 w-auto max-w-[80%] object-contain"
          onError={() => setLogoError(true)} // Handle image load error
        />
      ) : (
        // Fallback initials badge — displays when logo is missing or fails to load
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/10 font-display text-sm text-ink/60 transition duration-200 group-hover:text-ink">
          {initials(partner.name)}
        </span>
      )}

      <span className="font-body text-xs font-semibold uppercase tracking-wide text-ink/70 transition duration-200 group-hover:text-ink">
        {partner.name}
      </span>
    </div>
  )
}

export default function Partners() {
  // Use the shared partner context
  const { partners } = usePartners()
  
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  )
  const [isPaused, setIsPaused] = useState(false)
  const pages = chunk(partners || [], CARDS_PER_PAGE_DESKTOP)
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handleChange = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const goTo = (i) => setIndex((i + pages.length) % pages.length)
  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  useEffect(() => {
    if (isMobile || pages.length <= 1 || isPaused) return
    timerRef.current = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isPaused, pages.length, isMobile])

  // If no partners, don't render the section
  if (!partners || partners.length === 0) {
    return null
  }

  // Mobile: every partner shown at once in a continuous, looping marquee.
  const marqueeItems = [...partners, ...partners]

  return (
    <section className="bg-cream px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-coral">
          {partnersIntro.eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-ink sm:text-4xl">
          {partnersIntro.heading}
        </h2>
        <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-ink/70">
          {partnersIntro.body}
        </p>

        <div
          className="mt-12 border-t border-ink/10 pt-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {isMobile ? (
            <div className="-mx-6 overflow-hidden px-6">
              <div
                className="flex w-max gap-4"
                style={{
                  animation: `partners-marquee ${MARQUEE_SECONDS}s linear infinite`,
                  animationPlayState: isPaused ? 'paused' : 'running',
                }}
              >
                {marqueeItems.map((partner, i) => (
                  <PartnerCard key={`${partner.name}-${i}`} partner={partner} compact />
                ))}
              </div>
              <style>{`
                @keyframes partners-marquee {
                  from { transform: translateX(0); }
                  to { transform: translateX(-50%); }
                }
              `}</style>
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${index * 100}%)` }}
                >
                  {pages.map((page, pageIndex) => (
                    <div
                      key={pageIndex}
                      className="grid w-full shrink-0 grid-cols-4 gap-6"
                    >
                      {page.map((partner) => (
                        <PartnerCard key={partner.name} partner={partner} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {pages.length > 1 && (
                <div className="mt-8 flex items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous partners"
                    className="font-body text-sm text-ink/50 transition-colors hover:text-ink"
                  >
                    ←
                  </button>

                  <div className="flex items-center gap-2">
                    {pages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Show partner set ${i + 1}`}
                        aria-current={i === index}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          i === index ? 'bg-coral' : 'bg-ink/15 hover:bg-ink/30'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next partners"
                    className="font-body text-sm text-ink/50 transition-colors hover:text-ink"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}