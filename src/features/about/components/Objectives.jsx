import { objectives } from '../data/aboutContent'

export default function Objectives() {
  return (
    <section className="bg-cream px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-anika-blue">
          {objectives.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
          {objectives.heading}
        </h2>

        <ol className="mt-10 grid gap-10 border-t border-ink/10 pt-10 sm:grid-cols-2 sm:gap-16">
          {objectives.items.map((item) => (
            <li key={item.number} className="flex gap-5">
              <span className="font-display text-3xl leading-none text-anika-blue">
                {item.number}
              </span>
              <p className="font-body text-lg leading-relaxed text-ink/80">
                {item.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}