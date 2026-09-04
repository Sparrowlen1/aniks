import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/programs', label: 'Programs' },
  { to: '/events', label: 'Events' },
  { to: '/impact', label: 'Impact' },
  { to: '/stories', label: 'Stories' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/alliance', label: 'Alliance' },
  { to: '/about', label: 'About' },
]

function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  const isHome = pathname === '/'

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const transparent = isHome && !scrolled && !open

  const linkClass = ({ isActive }) =>
    `font-body text-sm uppercase tracking-wide transition-colors hover:text-coral ${
      isActive ? 'text-coral' : transparent ? 'text-cream' : 'text-ink'
    }`

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        transparent
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-ink/10 bg-cream/95 backdrop-blur'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <NavLink to="/" className="flex items-center gap-2">
          <img src="/anika-logo.png" alt="Anika Initiative" className="h-15 w-auto object-contain" />
          <span className={`font-display text-lg uppercase tracking-wide transition-colors ${transparent ? 'text-cream' : 'text-ink'}`}>
            Anika
          </span>
        </NavLink>

        <ul className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={linkClass} end={link.to === '/'}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <NavLink
            to="/get-involved"
            className={`rounded border px-4 py-2 font-body text-sm font-semibold uppercase tracking-wide transition-colors ${
              transparent
                ? 'border-cream/40 text-cream hover:border-cream hover:bg-cream hover:text-ink'
                : 'border-ink text-ink hover:bg-ink hover:text-cream'
            }`}
          >
            Get Involved
          </NavLink>
          <NavLink
            to="/donate"
            className="rounded bg-coral px-5 py-2 font-body text-sm font-semibold uppercase tracking-wide text-cream transition-opacity hover:opacity-90"
          >
            Donate
          </NavLink>
        </div>

        <button
          type="button"
          className={transparent ? 'text-cream md:hidden' : 'text-ink md:hidden'}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`block h-0.5 w-6 transition-colors ${transparent ? 'bg-cream' : 'bg-ink'}`} />
          <span className={`mt-1.5 block h-0.5 w-6 transition-colors ${transparent ? 'bg-cream' : 'bg-ink'}`} />
          <span className={`mt-1.5 block h-0.5 w-6 transition-colors ${transparent ? 'bg-cream' : 'bg-ink'}`} />
        </button>
      </nav>

      {open && (
        <ul className="flex flex-col gap-4 border-t border-ink/10 bg-cream px-6 py-4 md:hidden">
          {[...links, { to: '/get-involved', label: 'Get Involved' }, { to: '/donate', label: 'Donate' }].map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `font-body text-sm uppercase tracking-wide transition-colors hover:text-coral ${
                    isActive ? 'text-coral' : 'text-ink'
                  }`
                }
                end={link.to === '/'}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}

export default Navbar
