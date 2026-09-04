import { useRef, useState } from 'react'
import { X, Camera, Eye, EyeOff } from 'lucide-react'
import { apiRequest } from '../utils/api'
import { useAuth } from '../auth/AuthContext'
import { initials, avatarColor } from '../theme'

function Field({ label, colors, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: colors.muted }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({ colors, style, ...props }) {
  return (
    <input
      {...props}
      className="rounded-lg px-3 py-2 text-sm outline-none"
      style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text, ...style }}
    />
  )
}

function PasswordInput({ colors, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className="w-full rounded-lg px-3 py-2 pr-9 text-sm outline-none"
        style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-black/5"
        style={{ color: colors.muted }}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

function AccountModal({ onClose, colors }) {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [name, setName] = useState(user?.name ?? '')
  const [profileError, setProfileError] = useState(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    setProfileError(null)
    setProfileSaved(false)
    setSavingProfile(true)
    try {
      const updated = await apiRequest('/api/auth/me', { method: 'PATCH', body: { name } })
      updateUser(updated)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAvatarPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const updated = await apiRequest('/api/auth/me/avatar', { method: 'POST', body: formData })
      updateUser(updated)
    } catch (err) {
      setAvatarError(err.message)
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)
    setSavingPassword(true)
    try {
      await apiRequest('/api/auth/password', { method: 'PATCH', body: { currentPassword, newPassword } })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 2000)
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setSavingPassword(false)
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
        style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        className="w-full max-w-sm overflow-hidden rounded-2xl shadow-xl"
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: colors.border }}>
          <h2 className="text-lg font-bold" style={{ color: colors.text }}>
            My account
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-black/5">
            <X size={18} color={colors.muted} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          <div className="mb-5 flex flex-col items-center gap-2">
            <div className="relative">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div
                  style={{ background: avatarColor(user?.name ?? '') }}
                  className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white"
                >
                  {initials(user?.name ?? '?')}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="Change avatar"
                style={{ background: colors.buttonBg, color: colors.buttonText, borderColor: colors.panel }}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2"
              >
                <Camera size={12} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarPick}
              />
            </div>
            {avatarUploading && (
              <p className="text-xs" style={{ color: colors.muted }}>
                Uploading…
              </p>
            )}
            {avatarError && (
              <p className="max-w-[240px] text-center text-xs font-semibold" style={{ color: colors.red }}>
                {avatarError}
              </p>
            )}
          </div>

          <form onSubmit={saveProfile} className="space-y-3">
            {profileError && (
              <p className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: `${colors.red}15`, color: colors.red }}>
                {profileError}
              </p>
            )}
            <Field label="Full name" colors={colors}>
              <TextInput colors={colors} required value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <button
              type="submit"
              disabled={savingProfile}
              style={{ background: colors.buttonBg, color: colors.buttonText, opacity: savingProfile ? 0.6 : 1 }}
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {savingProfile ? 'Saving…' : profileSaved ? 'Saved' : 'Save profile'}
            </button>
          </form>

          <div className="my-5 border-t" style={{ borderColor: colors.border }} />

          <form onSubmit={changePassword} className="space-y-3">
            <h3 className="text-sm font-bold" style={{ color: colors.text }}>
              Change password
            </h3>
            {passwordError && (
              <p className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: `${colors.red}15`, color: colors.red }}>
                {passwordError}
              </p>
            )}
            <Field label="Current password" colors={colors}>
              <PasswordInput
                colors={colors}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>
            <Field label="New password" colors={colors}>
              <PasswordInput
                colors={colors}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </Field>
            <button
              type="submit"
              disabled={savingPassword}
              style={{ background: colors.red, color: '#fff', opacity: savingPassword ? 0.6 : 1 }}
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {savingPassword ? 'Saving…' : passwordSaved ? 'Password changed' : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AccountModal
