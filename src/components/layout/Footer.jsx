import { NavLink } from 'react-router-dom'

const programs = [
  'Arts & Culture',
  'Youth & Migration',
  'Expressions',
  'Gender Equality',
  'Governance',
]

const navigate = [
  { to: '/events', label: 'Events' },
  { to: '/impact', label: 'Impact' },
  { to: '/stories', label: 'Stories' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
]

function Footer() {
  return (
    <footer className="bg-charcoal text-cream">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-x-16">
          <div>
            <NavLink to="/" className="flex items-center gap-2">
              <img src="/anika-logo.png" alt="Anika Initiative" className="h-54 w-auto object-contain" />
              {/* <span className="font-display text-lg uppercase tracking-wide">Anika</span> */}
            </NavLink>
            {/* <p className="mt-4 font-body text-sm text-cream/80">Changing the world, Art at a time.</p> */}
            {/* <p className="mt-1 font-editorial italic text-cream/50">Open, never expose.</p> */}
            
          </div>

          <div>
            <p className="font-body text-sm font-semibold uppercase tracking-wide text-cream/60">Programs</p>
            <ul className="mt-4 space-y-2 font-body text-sm text-cream/80">
              {programs.map((program) => (
                <li key={program}>
                  <NavLink to="/programs" className="hover:text-coral">
                    {program}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-body text-sm font-semibold uppercase tracking-wide text-cream/60">Navigate</p>
            <ul className="mt-4 space-y-2 font-body text-sm text-cream/80">
              {navigate.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className="hover:text-coral">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-body text-sm font-semibold uppercase tracking-wide text-cream/60">Contact</p>
            <ul className="mt-4 space-y-2 font-body text-sm text-cream/80">
              <li>
                <a
                  href="mailto:info@anikainitiative.com"
                  className="text-anika-blue transition-opacity duration-200 hover:opacity-70"
                >
                  info@anikainitiative.com
                </a>
              </li>
              <li>
                <a
                  href="mailto:anika.silencekills@gmail.com"
                  className="text-anika-blue transition-opacity duration-200 hover:opacity-70"
                >
                  anika.silencekills@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+254702839983" className="hover:text-coral">
                  +254 702 839 983
                </a>
              </li>
            </ul>
            
            <ul className="mt-6 flex gap-10">
              <li>
                <a
                  href="https://instagram.com/Anikainitiative_"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="block text-[#E4405F] transition-transform duration-200 hover:scale-110"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.41-10.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="block text-[#1877F2] transition-transform duration-200 hover:scale-110"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.98H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.98A10 10 0 0 0 22 12z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter"
                  className="block text-[#1DA1F2] transition-transform duration-200 hover:scale-110"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path d="M23 4.98c-.83.37-1.72.62-2.65.73a4.6 4.6 0 0 0 2.02-2.54 9.2 9.2 0 0 1-2.92 1.12A4.58 4.58 0 0 0 11.7 8.4a13 13 0 0 1-9.44-4.79 4.58 4.58 0 0 0 1.42 6.11 4.5 4.5 0 0 1-2.07-.57v.06a4.58 4.58 0 0 0 3.67 4.49 4.6 4.6 0 0 1-2.06.08 4.58 4.58 0 0 0 4.28 3.18A9.2 9.2 0 0 1 0 19.54 12.94 12.94 0 0 0 7.03 21.5c8.44 0 13.06-6.99 13.06-13.06 0-.2 0-.4-.01-.6A9.3 9.3 0 0 0 23 4.98z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-cream/10 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Anika Creatives Association &middot; All rights reserved.</p>
          {/* <p className="font-editorial italic">
            Silence kills. <span className="text-coral">Art airs.</span>
          </p> */}
        </div>
      </div>
    </footer>
  )
}

export default Footer
