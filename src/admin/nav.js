import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  FileText,
  Handshake,
  BookOpen,
  Image,
  Megaphone,
  Inbox,
  Bot,
  DollarSign,
  BarChart3,
  FileBarChart,
  UserCog,
  Settings,
  ShieldCheck,
  Mail, 
} from 'lucide-react'
import { PAGE_ACCESS } from './access'

export const navSections = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true, allowedRoles: PAGE_ACCESS.dashboard }],
  },
  {
    label: 'People',
    items: [{ label: 'Contacts', to: '/admin/contacts', icon: Users, allowedRoles: PAGE_ACCESS.contacts }],
  },
  {
    label: 'Programs',
    items: [
      { label: 'Events', to: '/admin/events', icon: CalendarDays, allowedRoles: PAGE_ACCESS.events },
      { label: 'Registrations', to: '/admin/registrations', icon: ClipboardList, badgeKey: 'registrations', allowedRoles: PAGE_ACCESS.registrations },
      { label: 'Applications', to: '/admin/applications', icon: FileText, badgeKey: 'applications', allowedRoles: PAGE_ACCESS.applications },
      { label: 'Partners', to: '/admin/partners', icon: Handshake, allowedRoles: PAGE_ACCESS.partners },
    ],
  },
  {
    label: 'Comms',
    items: [
      { label: 'Stories', to: '/admin/stories', icon: BookOpen, allowedRoles: PAGE_ACCESS.stories },
      { label: 'Gallery', to: '/admin/gallery', icon: Image, allowedRoles: PAGE_ACCESS.gallery },
      { label: 'Newsletter', to: '/admin/newsletter', icon: Mail, allowedRoles: PAGE_ACCESS.newsletter }, // 👈 NEW
      { label: 'WhatsApp assistant', to: '/admin/whatsapp/assistant', icon: Bot, allowedRoles: PAGE_ACCESS.whatsappAssistant },
      { label: 'WhatsApp broadcast', to: '/admin/whatsapp/broadcast', icon: Megaphone, allowedRoles: PAGE_ACCESS.whatsappBroadcast },
      { label: 'WhatsApp inbox', to: '/admin/whatsapp/inbox', icon: Inbox, badgeKey: 'whatsappInboxUnread', badgeAccent: true, allowedRoles: PAGE_ACCESS.whatsappInbox },
    ],
  },
  {
    label: 'Insight',
    items: [
      { label: 'Contributions', to: '/admin/donations', icon: DollarSign, badgeKey: 'donations', allowedRoles: PAGE_ACCESS.donations },
      { label: 'Impact', to: '/admin/impact', icon: BarChart3, allowedRoles: PAGE_ACCESS.impact },
      { label: 'Reports', to: '/admin/reports', icon: FileBarChart, allowedRoles: PAGE_ACCESS.reports },
    ],
  },
  {
    label: 'Org',
    items: [
      { label: 'Team', to: '/admin/team', icon: UserCog, allowedRoles: PAGE_ACCESS.team },
      { label: 'Settings', to: '/admin/settings', icon: Settings, allowedRoles: PAGE_ACCESS.settings },
      { label: 'Roles & access', to: '/admin/roles', icon: ShieldCheck, allowedRoles: PAGE_ACCESS.roles },
    ],
  },
]