import { NavLink } from 'react-router-dom'
import { navSections } from '../nav'
import { useAuth } from '../auth/AuthContext'
import { getInitials } from '../utils/getInitials'
import { useAdminNotifications } from './useAdminNotifications'
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const ROLE_LABELS = {
  leadership: 'Leadership',
  comms: 'Comms',
  programs: 'Programs',
  mel: 'M&E',
}

function Sidebar({ onOpenAccount }) {
  const { user, logout } = useAuth()
  const { badges } = useAdminNotifications()
  const { isMobile, setOpenMobile } = useSidebar()
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.allowedRoles.includes(user?.role)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <SidebarPrimitive collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="items-center gap-0 pt-5">
        <img
          src="/anika-logo.png"
          alt="Anika Initiative"
          className="h-32 w-auto object-contain transition-all group-data-[collapsible=icon]:h-8"
        />
        <p className="px-6 pb-3 pt-1 text-center text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
          Admin Desk
        </p>
      </SidebarHeader>

      <SidebarContent className="gap-6 px-3 pb-6">
        {visibleSections.map((section) => (
          <SidebarGroup key={section.label} className="p-0">
            <SidebarGroupLabel className="px-3 text-sidebar-foreground/40">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map(({ label, to, icon: Icon, end, badgeKey, badgeAccent }) => {
                  const badge = badgeKey ? badges[badgeKey] : null
                  return (
                    <SidebarMenuItem key={to}>
                      <NavLink
                        to={to}
                        end={end}
                        onClick={closeOnMobile}
                        title={label}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 ${
                            isActive
                              ? 'bg-white text-coral'
                              : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground'
                          }`
                        }
                      >
                        <Icon size={18} strokeWidth={2} className="shrink-0" />
                        <span className="flex-1 group-data-[collapsible=icon]:hidden">{label}</span>
                        {badge != null && badge > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold group-data-[collapsible=icon]:hidden ${
                              badgeAccent ? 'bg-coral text-white' : 'bg-white/10 text-sidebar-foreground/70'
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="flex-row items-center gap-3 border-t border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <button
          onClick={onOpenAccount}
          title={user?.name}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left hover:bg-white/5 group-data-[collapsible=icon]:flex-none"
          aria-label="My account"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-sm font-semibold text-white">
              {getInitials(user?.name)}
            </div>
          )}
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{ROLE_LABELS[user?.role] ?? user?.role}</p>
          </div>
        </button>
        <button
          onClick={logout}
          title="Exit"
          className="shrink-0 text-xs font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
        >
          Exit
        </button>
      </SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  )
}

export default Sidebar
