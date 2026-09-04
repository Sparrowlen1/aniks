import { governance } from '../data/aboutContent'

function ComingSoon({ label = 'Coming soon' }) {
  return (
    <p className="font-body text-sm italic text-cream/40">{label}</p>
  )
}

function PlaceholderPhoto() {
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-cream/25 bg-cream/5" />
  )
}

export default function Governance() {
  const { board, trustDeed, principles } = governance

  return (
    <section className="bg-ink px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-anika-blue">
          {governance.eyebrow}
        </p>

        <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-cream sm:text-4xl">
          {governance.heading}
        </h2>

        <p className="mt-4 max-w-xl font-body text-lg leading-relaxed text-cream/70">
          {governance.body}
        </p>

        {/* Board */}
        <div className="mt-14 border-t border-cream/15 pt-10">
          <h3 className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            {board.heading}
          </h3>

          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {board.members.map((member, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <PlaceholderPhoto />
                <h4 className="mt-4 font-body text-base font-semibold text-cream">
                  {member.name || 'Board member name'}
                </h4>
                <p className="mt-1 font-body text-sm text-cream/60">
                  {member.role || 'Role / title'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust deed + Principles */}
        <div className="mt-14 grid gap-10 border-t border-cream/15 pt-10 sm:grid-cols-2 sm:gap-16">
          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              {trustDeed.heading}
            </h3>
            <div className="mt-5">
              {trustDeed.comingSoon ? (
                <ComingSoon />
              ) : (
                <p className="font-body text-sm leading-relaxed text-cream/70">
                  {trustDeed.summary}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-body text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              {principles.heading}
            </h3>
            <ul className="mt-5 space-y-5">
              {principles.items.map((item) => (
                <li key={item.title}>
                  <p className="font-body text-sm font-semibold uppercase tracking-wide text-cream">
                    {item.title}
                  </p>
                  <p className="mt-1 font-body text-sm leading-relaxed text-cream/70">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
            {principles.comingSoon && (
              <div className="mt-5">
                <ComingSoon label="More principles coming soon" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}