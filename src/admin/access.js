export const ROLES = {
  LEADERSHIP: 'leadership',
  COMMS: 'comms',
  PROGRAMS: 'programs',
  MEL: 'mel',
}

const { LEADERSHIP, COMMS, PROGRAMS, MEL } = ROLES
const EDITABLE_ROLES = [COMMS, PROGRAMS, MEL]

// The baseline matrix — what each role can see out of the box.
export const DEFAULT_PAGE_ACCESS = {
  dashboard: [LEADERSHIP, COMMS, PROGRAMS, MEL],
  contacts: [LEADERSHIP, COMMS, PROGRAMS],
  events: [LEADERSHIP, PROGRAMS],
  registrations: [LEADERSHIP, PROGRAMS],
  applications: [LEADERSHIP, PROGRAMS],
  partners: [LEADERSHIP, PROGRAMS],
  stories: [LEADERSHIP, COMMS],
  gallery: [LEADERSHIP, COMMS],
  whatsappBroadcast: [LEADERSHIP, COMMS],
  whatsappInbox: [LEADERSHIP, COMMS],
  whatsappAssistant: [LEADERSHIP, COMMS],
  donations: [LEADERSHIP, MEL],
  impact: [LEADERSHIP, COMMS, MEL],
  reports: [LEADERSHIP, MEL],
  team: [LEADERSHIP],
  settings: [LEADERSHIP],
  roles: [LEADERSHIP],
  newsletter: [LEADERSHIP, COMMS],  
}

const OVERRIDE_KEY = 'anika_role_access_overrides_v1'

/** Per-page, per-role true/false overrides on top of DEFAULT_PAGE_ACCESS, set from the Roles & Access screen. */
export function getAccessOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveAccessOverrides(overrides) {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides))
}

function applyOverrides(base, overrides) {
  const result = {}
  for (const key of Object.keys(base)) {
    const rolesForKey = new Set(base[key])
    rolesForKey.add(LEADERSHIP) // leadership always has full access, never removable
    const keyOverrides = overrides[key]
    if (keyOverrides) {
      for (const role of EDITABLE_ROLES) {
        if (role in keyOverrides) {
          if (keyOverrides[role]) rolesForKey.add(role)
          else rolesForKey.delete(role)
        }
      }
    }
    result[key] = Array.from(rolesForKey)
  }
  return result
}

// Computed once per app load (i.e. takes effect on next sign-in/reload, same
// as the Roles & Access screen tells the user) by folding any saved overrides
// over the defaults.
export const PAGE_ACCESS = applyOverrides(DEFAULT_PAGE_ACCESS, getAccessOverrides())

export const canAccessPage = (role, pageKey) => Boolean(PAGE_ACCESS[pageKey]?.includes(role))