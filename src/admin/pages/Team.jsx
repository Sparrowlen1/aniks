import { useEffect, useState } from 'react'
import { UserPlus, X, Pencil, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useAdminColors, initials, avatarColor } from '../theme'
import { apiRequest } from '../utils/api'

const ROLE_STYLE = {
  leadership: { bg: '#f6d9d9', text: '#b23b3b' },
  comms: { bg: '#dbe6f5', text: '#2f4a6b' },
  programs: { bg: '#dcefe0', text: '#2d7a43' },
  mel: { bg: '#fbe6c8', text: '#b3760c' },
}

const roleLabels = {
  leadership: 'Leadership',
  comms: 'Comms',
  programs: 'Programs',
  mel: 'M&E',
}

function MemberFormModal({ member, onClose, onSave, colors }) {
  const isEdit = Boolean(member)
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState(member?.role ?? 'comms')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || (!isEdit && !password.trim())) return
    setError(null)
    setSaving(true)
    try {
      const payload = { name: name.trim(), email: email.trim(), role }
      if (!isEdit) payload.password = password.trim()
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,18,15,0.45)' }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        className="w-full max-w-sm overflow-hidden rounded-2xl shadow-xl"
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: colors.border }}>
          <h2 className="text-lg font-bold" style={{ color: colors.text }}>
            {isEdit ? 'Edit team member' : 'Invite team member'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-black/5">
            <X size={18} color={colors.muted} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {error && (
            <p className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: `${colors.red}15`, color: colors.red }}>
              {error}
            </p>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Full name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
              placeholder="e.g. Amara K."
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
              placeholder="you@anikainitiative.org"
            />
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: colors.muted }}>
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 pr-9 text-sm outline-none"
                  style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-black/5"
                  style={{ color: colors.muted }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4" style={{ borderColor: colors.border }}>
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-semibold" style={{ color: colors.muted }}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{ background: colors.buttonBg, color: colors.buttonText, opacity: saving ? 0.6 : 1 }}
            className="rounded-full px-4 py-2 text-sm font-semibold"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Send invite'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ConfirmDeleteModal({ member, onClose, onConfirm, colors }) {
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setError(null)
    setDeleting(true)
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,18,15,0.45)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.red}` }}
        className="w-full max-w-sm overflow-hidden rounded-2xl shadow-xl"
      >
        <div className="p-5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} color={colors.red} />
            <h2 className="text-lg font-bold" style={{ color: colors.text }}>
              Remove team member?
            </h2>
          </div>
          <p className="mt-2 text-sm" style={{ color: colors.muted }}>
            This permanently deletes <strong style={{ color: colors.text }}>{member.name}</strong>'s account. They'll
            need a new invite to get back in.
          </p>
          {error && (
            <p className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: `${colors.red}15`, color: colors.red }}>
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t p-4" style={{ borderColor: colors.border }}>
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-semibold" style={{ color: colors.muted }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            style={{ background: colors.red, color: '#fff', opacity: deleting ? 0.6 : 1 }}
            className="rounded-full px-4 py-2 text-sm font-semibold"
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Team() {
  const COLORS = useAdminColors()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [formModal, setFormModal] = useState(null) // null | { member: null | member }
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiRequest('/api/team')
      .then((rows) => {
        if (cancelled) return
        if (!Array.isArray(rows)) throw new Error('Unexpected response from the server')
        setTeam(rows)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function saveMember(data) {
    if (formModal?.member) {
      const updated = await apiRequest(`/api/team/${formModal.member.id}`, { method: 'PATCH', body: data })
      setTeam((prev) => prev.map((m) => (m.id === formModal.member.id ? updated : m)))
    } else {
      const created = await apiRequest('/api/team', { method: 'POST', body: data })
      setTeam((prev) => [...prev, created])
    }
  }

  async function confirmDelete() {
    await apiRequest(`/api/team/${deleteTarget.id}`, { method: 'DELETE' })
    setTeam((prev) => prev.filter((m) => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100%' }} className="rounded-lg p-6 font-sans">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
            Team
          </h1>
          <p className="mt-1 text-sm" style={{ color: COLORS.muted }}>
            Real accounts with access to the ANIKA dashboard.
          </p>
        </div>
        <button
          onClick={() => setFormModal({ member: null })}
          style={{ background: COLORS.buttonBg, color: COLORS.buttonText }}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide"
        >
          <UserPlus size={14} />
          INVITE MEMBER
        </button>
      </div>

      <div
        style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
        className="overflow-x-auto rounded-xl"
      >
        {loading ? (
          <p className="p-5 text-sm" style={{ color: COLORS.muted }}>
            Loading team…
          </p>
        ) : loadError ? (
          <p className="p-5 text-sm" style={{ color: COLORS.red }}>
            Couldn't load the team: {loadError}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="border-b text-xs font-bold tracking-wide"
                style={{ borderColor: COLORS.border, color: COLORS.muted }}
              >
                <th className="px-5 py-3">NAME</th>
                <th className="px-5 py-3">EMAIL</th>
                <th className="px-5 py-3">ROLE</th>
                <th className="px-5 py-3">STATUS</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-t" style={{ borderColor: COLORS.border }}>
                  <td className="flex items-center gap-3 px-5 py-3" style={{ color: COLORS.text }}>
                    <div
                      style={{ background: avatarColor(member.name) }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                    >
                      {initials(member.name)}
                    </div>
                    <span className="font-semibold">{member.name}</span>
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.muted }}>
                    {member.email}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      style={{ background: ROLE_STYLE[member.role].bg, color: ROLE_STYLE[member.role].text }}
                      className="rounded-full px-2.5 py-1 text-xs font-bold"
                    >
                      {roleLabels[member.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.muted }}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: member.isActive ? COLORS.green : COLORS.red }}
                      />
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setFormModal({ member })}
                        aria-label={`Edit ${member.name}`}
                        className="rounded-lg p-1.5 hover:bg-black/5"
                        style={{ color: COLORS.muted }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(member)}
                        aria-label={`Remove ${member.name}`}
                        className="rounded-lg p-1.5 hover:bg-black/5"
                        style={{ color: COLORS.red }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formModal && (
        <MemberFormModal
          member={formModal.member}
          onClose={() => setFormModal(null)}
          onSave={saveMember}
          colors={COLORS}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          member={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          colors={COLORS}
        />
      )}
    </div>
  )
}

export default Team
