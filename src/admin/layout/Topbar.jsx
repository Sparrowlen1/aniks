import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Bell, Check, Trash2 } from 'lucide-react'
import { useAdminNotifications } from './useAdminNotifications'
import { useAuth } from '../auth/AuthContext'
import { SidebarTrigger } from '@/components/ui/sidebar'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function today() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function Topbar({ theme, onToggleTheme }) {
  const { user } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useAdminNotifications()

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-ink/10 bg-cream/70 px-6 py-4 backdrop-blur-md dark:border-white/10 dark:bg-charcoal/70">
      <SidebarTrigger
        size="icon"
        className="text-ink/70 hover:bg-ink/5 hover:text-ink dark:text-cream/70 dark:hover:bg-white/5 dark:hover:text-cream [&_svg]:size-5"
      />

      <div>
        <h1 className="font-display text-xl tracking-wide">{greeting()}, {user?.name ?? 'Admin'}</h1>
        <p className="text-sm text-ink/50 dark:text-cream/50">{today()}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-ink/70 hover:bg-ink/5 hover:text-ink dark:text-cream/70 dark:hover:bg-white/5 dark:hover:text-cream"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-ink/70 hover:bg-ink/5 hover:text-ink dark:text-cream/70 dark:hover:bg-white/5 dark:hover:text-cream"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <button
                aria-label="Close notifications"
                onClick={() => setNotifOpen(false)}
                className="fixed inset-0 z-20"
              />
              <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-xl dark:border-white/10 dark:bg-charcoal">
                <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 dark:border-white/10">
                  <span className="text-sm font-bold">Notifications</span>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs font-medium text-coral hover:underline"
                      >
                        <Check size={12} /> Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        aria-label="Clear notifications"
                        className="flex items-center gap-1 text-xs font-medium text-ink/40 hover:text-ink dark:text-cream/40 dark:hover:text-cream"
                      >
                        <Trash2 size={12} /> Clear
                      </button>
                    )}
                  </div>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <li className="px-4 py-6 text-center text-xs text-ink/40 dark:text-cream/40">
                      No notifications yet
                    </li>
                  )}
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        to={n.to}
                        onClick={() => {
                          markRead(n.id)
                          setNotifOpen(false)
                        }}
                        className="flex w-full items-start gap-2.5 border-b border-ink/5 px-4 py-3 text-left last:border-b-0 hover:bg-ink/5 dark:border-white/5 dark:hover:bg-white/5"
                      >
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            n.read ? 'bg-transparent' : 'bg-coral'
                          }`}
                        />
                        <span>
                          <p className={`text-sm ${n.read ? 'text-ink/60 dark:text-cream/60' : 'font-semibold text-ink dark:text-cream'}`}>
                            {n.text}
                          </p>
                          <p className="mt-0.5 text-xs text-ink/40 dark:text-cream/40">{n.time}</p>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
