import { history } from '../data/aboutContent'

export default function HistoryTimeline() {
  return (
    <section className="bg-cream px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-gold">
          {history.eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-ink sm:text-4xl">
          {history.heading}
        </h2>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 sm:gap-12">
          <figure className="flex flex-col sm:h-full">
            <img
              src="/image9.jpg"
              alt="Artists and community members gathered at an early ANIKA Initiative session"
              className="aspect-[4/3] w-full rounded-2xl object-cover sm:aspect-auto sm:flex-1"
            />
          </figure>

          <div className="max-w-2xl space-y-4">
            {history.body.map((paragraph, i) => (
              <p key={i} className="font-body text-base leading-relaxed text-ink/80">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <ol className="mt-14 grid gap-10 border-t border-ink/10 pt-10 sm:grid-cols-3 sm:gap-6">
          {history.milestones.map((milestone, i) => (
            <li key={milestone.year} className="relative pl-6">
              <span
                aria-hidden="true"
                className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-coral"
              />
              {i < history.milestones.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[4px] top-5 hidden h-[calc(100%+1.5rem)] w-px bg-ink/10 sm:hidden"
                />
              )}
              <span className="font-display text-2xl text-coral">
                {milestone.year}
              </span>
              <h3 className="mt-2 font-body text-base font-semibold uppercase tracking-wide text-ink">
                {milestone.title}
              </h3>
              <p className="mt-2 font-body text-base leading-relaxed text-ink/70">
                {milestone.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}