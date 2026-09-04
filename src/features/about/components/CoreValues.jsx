import { values, valuesIntro } from '../data/values'

const swatches = ['text-coral', 'text-anika-green', 'text-anika-blue', 'text-gold', 'text-coral']

export default function CoreValues() {
  return (
    <section className="bg-ink px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-gold">
          {valuesIntro.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold text-cream sm:text-4xl">
          {valuesIntro.heading}
        </h2>
        <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-cream/70">
          {valuesIntro.body}
        </p>

        <ul className="mt-12 grid gap-8 border-t border-cream/15 pt-10 sm:grid-cols-5">
          {values.map((value, i) => (
            <li key={`${value.letter}-${value.label}`}>
              <span className={`font-display text-5xl ${swatches[i % swatches.length]}`}>
                {value.letter}
              </span>
              <h3 className="mt-3 font-body text-base font-semibold uppercase tracking-wide text-cream">
                {value.label}
              </h3>
              <p className="mt-2 font-body text-base leading-relaxed text-cream/70">
                {value.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}