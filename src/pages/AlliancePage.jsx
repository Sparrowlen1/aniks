import { useState } from 'react'
import Reveal from '../components/Reveal'
import Counter from '../components/Counter'
import { submitApplication } from '../lib/api'
import { composePhone, COUNTRY_CODES, sanitizeLocalPhoneInput } from '../lib/phone'

const BENEFITS = [
  { title: 'Residencies', text: 'Priority access to cross-border artistic residencies.', accent: 'gold' },
  { title: 'Co-production', text: 'Co-produce work with partners across the continent.', accent: 'green' },
  { title: 'Funding Intel', text: 'Shared intelligence on grants and funding opportunities.', accent: 'blue' },
  { title: 'Collective Voice', text: 'A stronger, united voice for African arts in policy spaces.', accent: 'coral' },
];

const accentBar = {
  gold: 'bg-gold',
  green: 'bg-anika-green',
  blue: 'bg-anika-blue',
  coral: 'bg-coral',
};

// Maps the Alliance "I am a..." role to the backend Application subject enum.
const ROLE_SUBJECT = {
  'Artist': 'artist',
  'Cultural Organisation': 'partnership',
  'Enabler / Partner': 'partnership',
  'Institution': 'partnership',
};

export default function AlliancePage() {
  const [form, setForm] = useState({ name: '', email: '', org: '', country: '', countryCode: '254', localNumber: '', role: '', consent: true });
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || form.localNumber.length !== 9) {
      setStatus('error')
      return
    }
    setStatus('submitting')
    try {
      await submitApplication({
        name: form.name,
        email: form.email || undefined,
        phone: composePhone(form.countryCode, form.localNumber),
        organisation: form.org || undefined,
        country: form.country || undefined,
        subject: ROLE_SUBJECT[form.role] || 'partnership',
        message: `Alliance membership application. Role: ${form.role || 'Artist'}`,
        whatsapp_opt_in: form.consent,
      })
      setForm({ name: '', email: '', org: '', country: '', countryCode: '254', localNumber: '', role: '', consent: true })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <section className="relative overflow-hidden bg-charcoal py-16 text-cream">
        <img
          src="/anika-blue-blob.png"
          alt=""
          aria-hidden="true"
          className='absolute -top-10 right-0 w-64 h-64 md:w-80 md:h-80 object-contain pointer-events-none select-none'
        />
        <Reveal className="relative z-10 mx-auto max-w-6xl px-6">
          <h1 className="font-display text-5xl uppercase leading-tight sm:text-6xl">
            Pan-African Arts Alliance
          </h1>
          <p className="mt-4 max-w-md font-editorial text-lg italic text-gold">
            A living network for artists, cultural organisations, enablers and institutions
            building work that crosses borders.
          </p>
        </Reveal>
      </section>

      <section className="border-b border-ink/10 bg-cream px-6 py-16 md:px-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <Reveal as="figure" className="h-full min-h-72">
            <img
            src="/RAYA1.jpg"
            alt="Artists and cultural partners gathered together"
            className="h-full w-full object-cover"
            />
          </Reveal>
          <Reveal delay={150}>
            <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-anika-blue">
              About the Alliance
            </p>
            <h2 className="max-w-3xl font-display text-4xl uppercase leading-tight text-ink sm:text-5xl">
              Pan-African Arts Alliance
            </h2>
            <div className="mt-5 max-w-3xl space-y-5 font-body text-lg leading-8 text-ink/75">
              <p>
                This ANIKA's continental network for artists, cultural
                organisations, enablers and institutions building work that crosses borders. It is
                a practical response to the distance, limited resources and disconnected
                opportunities that can make collaboration across Africa difficult. The Alliance
                brings people into relationship so that ideas, skills and possibilities can move
                more freely between communities and countries.
              </p>
              <p>
                At its heart, the Alliance is about shared ambition becoming shared practice.
                Members can connect through cross-border artistic residencies, co-produce work
                with partners across the continent, and exchange knowledge about grants and other
                funding opportunities. It also creates space for artists and cultural workers to
                amplify one another's voices and contribute to a stronger collective voice for
                African arts in policy and institutional spaces.
              </p>
              <p>
                The network is formalising during 2025-26, with membership open to the people and
                organisations who want to build this future together. Joining begins with a short
                application, and the ANIKA team follows up via WhatsApp. Whether you are an artist,
                a cultural organisation, an enabler or an institution, the Alliance offers a place
                to exchange, collaborate and help shape work that travels further.
              </p>  
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-charcoal px-6 py-10 text-cream md:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3">
          <Reveal className="text-center">
            <p className="font-display text-4xl text-coral"><Counter to={14} /></p>
            <p className="mt-1 font-body text-xs uppercase tracking-[0.2em] text-cream/60">African countries</p>
          </Reveal>
          <Reveal delay={100} className="text-center">
            <p className="font-display text-4xl text-gold"><Counter to={150} suffix="+" /></p>
            <p className="mt-1 font-body text-xs uppercase tracking-[0.2em] text-cream/60">Artists engaged</p>
          </Reveal>
          <Reveal delay={200} className="text-center">
            <p className="font-display text-4xl text-anika-green"><Counter to={100} suffix="+" /></p>
            <p className="mt-1 font-body text-xs uppercase tracking-[0.2em] text-cream/60">Events held</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-6 py-20 md:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <Reveal>
            <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-anika-blue">
              Member benefits
            </p>
            <h2 className="mt-3 max-w-lg font-display text-4xl uppercase leading-tight text-ink sm:text-5xl">
              Build further, together.
            </h2>
            <p className="mt-4 max-w-xl font-body text-lg leading-8 text-ink/70">
              The Alliance turns shared ambition into practical exchange, stronger work and a
              collective voice for African arts.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {BENEFITS.map((b, i) => (
                <Reveal key={b.title} delay={i * 100} className="border border-ink/15 bg-cream p-5">
                  <div className={`h-1.5 w-10 ${accentBar[b.accent]}`} />
                  <h3 className="mt-4 font-display text-lg uppercase tracking-wide text-ink">{b.title}</h3>
                  <p className="mt-2 font-body text-base leading-6 text-ink/70">{b.text}</p>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={150} className="border border-ink/15 bg-cream p-6 sm:p-8">
            <p className="font-body text-base font-semibold uppercase tracking-[0.25em] text-coral">Membership application</p>
            <h2 className="mt-3 font-display text-3xl uppercase tracking-wide text-ink">
              Apply in under 2 minutes
            </h2>
            <p className="mt-3 font-body text-base leading-6 text-ink/70">
              Share a few details and the ANIKA team will follow up via WhatsApp.
            </p>

            {status === 'done' && (
              <div className="mt-6 border border-anika-green bg-anika-green p-5 text-white">
                <p className="font-display text-xl uppercase tracking-wide">Application received.</p>
                <p className="mt-2 font-body text-base leading-6">
                  Thank you, {form.name || 'friend'}. We’ll be in touch on WhatsApp shortly.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="a-name" className="mb-1 block font-body text-xs font-extrabold uppercase">
                  Full Name *
                </label>
                <input
                  id="a-name"
                  className="field w-full border border-ink/25 bg-white px-4 py-3 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-anika-blue focus:ring-2 focus:ring-anika-blue/20"
                  placeholder="Peter Kariuki"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="a-email" className="mb-1 block font-body text-xs font-extrabold uppercase">
                  Email
                </label>
                <input
                  id="a-email"
                  type="email"
                  required
                  className="field w-full border border-ink/25 bg-white px-4 py-3 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-anika-blue focus:ring-2 focus:ring-anika-blue/20"
                  placeholder="peter@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="a-org" className="mb-1 block font-body text-xs font-extrabold uppercase">
                    Organisation
                  </label>
                  <input
                    id="a-org"
                    className="field w-full border border-ink/25 bg-white px-4 py-3 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-anika-blue focus:ring-2 focus:ring-anika-blue/20"
                    placeholder="Lake Arts Collective"
                    value={form.org}
                    onChange={(e) => setForm({ ...form, org: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="a-country" className="mb-1 block font-body text-xs font-extrabold uppercase">
                    Country
                  </label>
                  <input
                    id="a-country"
                    className="field w-full border border-ink/25 bg-white px-4 py-3 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-anika-blue focus:ring-2 focus:ring-anika-blue/20"
                    placeholder="Kenya"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="a-role" className="mb-1 block font-body text-xs font-extrabold uppercase">
                  I am a…
                </label>
                <select
                  id="a-role"
                  className="field w-full border border-ink/25 bg-white px-4 py-3 font-body text-sm text-ink outline-none transition-colors focus:border-anika-blue focus:ring-2 focus:ring-anika-blue/20"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="">Select role</option>
                  <option>Artist</option>
                  <option>Cultural Organisation</option>
                  <option>Enabler / Partner</option>
                  <option>Institution</option>
                </select>
              </div>
              <div>
                <label htmlFor="a-phone" className="mb-1 block font-body text-xs font-extrabold uppercase">
                  WhatsApp Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.countryCode}
                    onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                    className="field w-32 border border-ink/25 bg-white px-3 py-3 font-body text-sm text-ink outline-none focus:border-anika-blue focus:ring-2 focus:ring-anika-blue/20"
                    aria-label="Country code"
                  >
                    {COUNTRY_CODES.map(({ code, country }) => <option key={code} value={code}>+{code} {country}</option>)}
                  </select>
                  <input
                    id="a-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    className="field min-w-0 flex-1 border border-ink/25 bg-white px-4 py-3 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-anika-blue focus:ring-2 focus:ring-anika-blue/20"
                    placeholder="712 345 678"
                    value={form.localNumber}
                    onChange={(e) => setForm({ ...form, localNumber: sanitizeLocalPhoneInput(e.target.value) })}
                  />
                </div>
                <p className="mt-1 font-body text-xs text-ink/50">Enter 9 digits after the country code.</p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 border border-anika-green/30 bg-anika-green/10 p-3">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-green"
                />
                <span className="font-body text-sm leading-6 text-ink/80">
                  I agree to receive Alliance updates via WhatsApp.
                </span>
              </label>

              {status === 'error' && (
                <p className="font-body text-sm font-semibold text-coral">
                  Please provide your name, email and a valid WhatsApp number.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full rounded bg-coral px-5 py-3 font-body text-sm font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#d43f3a] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'submitting' ? 'Submitting...' : 'Request Membership'}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

