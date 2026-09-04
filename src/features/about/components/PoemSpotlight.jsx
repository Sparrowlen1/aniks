import { poem } from '../data/poem'

export default function PoemSpotlight() {
  return (
    <section className="relative overflow-hidden bg-charcoal px-6 py-20 text-cream sm:py-28">
      <div className="pointer-events-none absolute -right-20 top-12 h-64 w-64 rounded-full border border-gold/20" />
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-12 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-coral" />
          <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-gold">
            The origin poem
          </p>
          <span className="h-px w-12 bg-coral" />
        </div>

        <blockquote className="mx-auto max-w-2xl font-editorial text-3xl italic leading-snug text-cream sm:text-5xl">
          &ldquo;{poem.pullQuote}&rdquo;
        </blockquote>

        <div className="mt-6 flex flex-col items-center gap-1">
          <span className="font-body text-sm font-semibold uppercase tracking-[0.25em] text-gold">
            {poem.author}
          </span>
          <span className="font-editorial text-lg italic text-cream/60">
            {poem.title}
          </span>
        </div>

        <div className="mx-auto mt-16 max-w-2xl space-y-8 font-editorial text-xl leading-relaxed text-cream/85 sm:text-2xl">
          {poem.stanzas.map((stanza, i) => (
            <p key={i}>
              {stanza.map((line, j) => (
                <span key={j} className="block">
                  {line}
                </span>
              ))}
            </p>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl border-t border-cream/15 pt-10">
          <p className="font-editorial text-2xl italic leading-relaxed text-coral sm:text-3xl">
            {poem.refrain.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}