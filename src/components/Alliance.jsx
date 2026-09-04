import SectionHeading from './SectionHeading';

export default function Alliance({ onAirItOut }) {
  return (
    <section id="alliance" className="bg-white py-20">
      <div className="shell grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            kicker="Pan-African Arts Alliance"
            title="Build the alliance of the continent"
            accent="blue"
          />
          <p className="mt-4 max-w-xl font-body text-gray-700">
            The Alliance connects artists, cultural organisations, enablers, and institutions
            across the continent — trading craft, amplifying voices, and co-producing work that
            crosses borders.
          </p>
          <ul className="mt-6 space-y-3 font-body text-sm text-gray-800">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 bg-blue" />
              Cross-border artistic residencies &amp; co-production
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 bg-gold" />
              Shared resource &amp; funding intelligence
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 bg-green" />
              A collective voice for African arts
            </li>
          </ul>
          <button type="button" onClick={onAirItOut} className="mt-8 rounded bg-coral px-5 py-3 font-body text-sm font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#d43f3a]">
            Apply for Membership
          </button>
        </div>

        {/* membership application teaser */}
        <div className="border-2 border-black bg-ink p-8 text-white">
          <p className="kicker text-gold">Membership Application</p>
          <h3 className="mt-3 font-display text-2xl uppercase leading-tight">
            Via WhatsApp, in under 2 minutes
          </h3>
          <p className="mt-3 font-body text-sm text-white/80">
            Message our ANIKA assistant with the word{' '}
            <span className="font-extrabold text-gold">ALLIANCE</span> to begin your application —
            or fill in your details here and we’ll reach out.
          </p>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <input className="field" placeholder="Full name" aria-label="Full name" />
            <input className="field" placeholder="Country" aria-label="Country" />
            <button type="submit" className="w-full rounded bg-coral px-5 py-3 font-body text-sm font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#d43f3a]">
              Request Membership Info
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
