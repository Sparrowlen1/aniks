import { useState } from 'react'
import { Check } from 'lucide-react'
import { useAdminColors } from '../theme'
import { navSections } from '../nav'
import { DEFAULT_PAGE_ACCESS, getAccessOverrides, saveAccessOverrides } from '../access'

const roles = ['leadership', 'comms', 'programs', 'mel']

const roleLabels = {
  leadership: 'Leadership',
  comms: 'Comms',
  programs: 'Programs',
  mel: 'M&E',
}

// Sidebar label -> access.js page key. Rows are driven by the actual nav, so this
// stays in sync with what's really in the sidebar.
const LABEL_TO_KEY = {
  Dashboard: 'dashboard',
  Contacts: 'contacts',
  Events: 'events',
  Registrations: 'registrations',
  Applications: 'applications',
  Partners: 'partners',
  Stories: 'stories',
  Gallery: 'gallery',
  'WhatsApp broadcast': 'whatsappBroadcast',
  'WhatsApp inbox': 'whatsappInbox',
  Contributions: 'donations',
  Impact: 'impact',
  Reports: 'reports',
  Team: 'team',
  Settings: 'settings',
  'Roles & access': 'roles',
}

const sections = navSections.flatMap((section) => section.items.map((item) => item.label))

function RoleCheckbox({ checked, disabled, onChange, colors }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      style={{
        background: checked ? (disabled ? `${colors.red}40` : colors.red) : colors.panel,
        borderColor: checked ? 'transparent' : colors.border,
      }}
      className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
      }`}
    >
      {checked && <Check size={14} color="#fff" strokeWidth={3} />}
    </button>
  )
}

function RolesAccess() {
  const COLORS = useAdminColors()
  const [overrides, setOverrides] = useState(() => getAccessOverrides())

  function isChecked(section, role) {
    const key = LABEL_TO_KEY[section]
    const override = overrides[key]?.[role]
    if (override != null) return override
    return Boolean(DEFAULT_PAGE_ACCESS[key]?.includes(role))
  }

  function toggle(section, role) {
    const key = LABEL_TO_KEY[section]
    setOverrides((prev) => {
      const next = { ...prev, [key]: { ...prev[key], [role]: !isChecked(section, role) } }
      saveAccessOverrides(next)
      return next
    })
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100%' }} className="rounded-lg p-6 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
          Roles & access
        </h1>
        <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
          Control what each role can see. Leadership always has full access. Changes apply on next sign-in.
        </p>
      </div>

      <div
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        className="overflow-x-auto rounded-xl"
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs font-bold tracking-wide" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
              <th className="px-5 py-3">SECTION</th>
              {roles.map((role) => (
                <th key={role} className="px-5 py-3">
                  {roleLabels[role].toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section} className="border-t" style={{ borderColor: COLORS.border }}>
                <td className="px-5 py-3 font-semibold" style={{ color: COLORS.text }}>
                  {section}
                </td>
                {roles.map((role) =>
                  role === 'leadership' ? (
                    <td key={role} className="px-5 py-3">
                      <RoleCheckbox checked disabled onChange={() => {}} colors={COLORS} />
                    </td>
                  ) : (
                    <td key={role} className="px-5 py-3">
                      <RoleCheckbox
                        checked={isChecked(section, role)}
                        onChange={() => toggle(section, role)}
                        colors={COLORS}
                      />
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RolesAccess
