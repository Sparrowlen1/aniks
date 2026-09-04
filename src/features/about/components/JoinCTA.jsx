import { Link } from 'react-router-dom'
import { joinCta } from '../data/aboutContent'

export default function JoinCTA() {
  return (
    <section className="bg-coral px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-cream/80">
          {joinCta.eyebrow}
        </p>

        <h2 className="mt-4 text-4xl font-bold leading-[0.95] text-cream sm:text-6xl">
          {joinCta.headingLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>

        <p className="mt-6 font-body text-lg leading-relaxed text-cream/90">
          {joinCta.body}
        </p>

        <Link
          to={joinCta.ctaHref}
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-4 font-body text-sm font-semibold uppercase tracking-wide text-cream transition hover:bg-ink/90"
        >
          {joinCta.ctaLabel}
          <span aria-hidden="true"></span>
        </Link>
      </div>
    </section>
  )
}