import { useEffect, useState } from 'react'
import {
  X, Pencil, Trash2, Upload, FileText, AlertTriangle,
} from 'lucide-react'
import { useAdminColors } from '../theme'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'

const REPORT_TYPES = [
  { id: 'donor', label: 'Donor report' },
  { id: 'event', label: 'Event summary' },
  { id: 'impact', label: 'Impact report' },
  { id: 'contacts', label: 'Contact export' },
]

const FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Annually']

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const FORMATS = ['PDF', 'Excel', 'CSV']

function emptyFormState() {
  return {
    id: null,
    reportTypes: [],
    frequency: 'Monthly',
    weekday: WEEKDAYS[0],
    dayOfMonth: '',
    specificDate: '',
    sendTo: '',
    format: '',
  }
}

function describeFrequency(schedule) {
  switch (schedule.frequency) {
    case 'Weekly':
      return `Weekly, every ${schedule.weekday}`
    case 'Monthly':
      return `Monthly, day ${schedule.dayOfMonth}`
    case 'Quarterly':
      return `Quarterly, day ${schedule.dayOfMonth} of first month`
    case 'Annually':
      return `Annually, ${schedule.specificDate || '—'}`
    default:
      return schedule.frequency
  }
}

function canManageSchedule(schedule, user) {
  if (!user) return false
  if (user.role === 'leadership') return true
  if (user.role === 'mel') return schedule.createdByEmail === user.email
  return false
}

function ScheduleForm({ form, setForm, onSubmit, onCancelEdit, isEditing, colors, saving }) {
  function toggleType(id) {
    setForm((f) => ({
      ...f,
      reportTypes: f.reportTypes.includes(id)
        ? f.reportTypes.filter((t) => t !== id)
        : [...f.reportTypes, id],
    }))
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
      className="rounded-xl p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-body font-bold text-base" style={{ color: colors.text }}>
          {isEditing ? 'Edit schedule' : 'Schedule a report'}
        </h2>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: colors.muted }}
          >
            <X size={14} /> Cancel edit
          </button>
        )}
      </div>

      <div className="mt-4">
        <label className="text-xs font-semibold" style={{ color: colors.muted }}>
          Report contents
        </label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 font-body">
          {REPORT_TYPES.map((type) => (
            <label
              key={type.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{
                border: `1px solid ${colors.border}`,
                background: form.reportTypes.includes(type.id) ? colors.buttonBg : colors.inputBg,
                color: form.reportTypes.includes(type.id) ? colors.buttonText : colors.text,
              }}
            >
              <input
                type="checkbox"
                checked={form.reportTypes.includes(type.id)}
                onChange={() => toggleType(type.id)}
                className="accent-current"
              />
              {type.label}
            </label>
          ))}
        </div>
        {form.reportTypes.length === 0 && (
          <p className="mt-1.5 text-xs" style={{ color: colors.red }}>
            Select at least one report to include.
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: colors.muted }}>
            Frequency
          </label>
          <select
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
            className="rounded-lg px-3 py-2 text-sm outline-none font-body"
            style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {form.frequency === 'Weekly' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Day of week
            </label>
            <select
              value={form.weekday}
              onChange={(e) => setForm((f) => ({ ...f, weekday: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm outline-none font-body"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {(form.frequency === 'Monthly' || form.frequency === 'Quarterly') && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Day of month {form.frequency === 'Quarterly' && '(first month of quarter)'}
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={form.dayOfMonth}
              onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: Number(e.target.value) }))}
              className="rounded-lg px-3 py-2 text-sm outline-none font-body"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            />
          </div>
        )}

        {form.frequency === 'Annually' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Date
            </label>
            <input
              type="date"
              value={form.specificDate}
              onChange={(e) => setForm((f) => ({ ...f, specificDate: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm outline-none font-body"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: colors.muted }}>
            Send to
          </label>
          <input
            required
            type="email"
            value={form.sendTo}
            onChange={(e) => setForm((f) => ({ ...f, sendTo: e.target.value }))}
            className="rounded-lg px-3 py-2 text-sm outline-none font-body"
            style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            placeholder="you@anikainitiative.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: colors.muted }}>
            Format
          </label>
          <div className="flex gap-2">
            {FORMATS.map((fmt) => (
              <label
                key={fmt}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold font-body"
                style={{
                  border: `1px solid ${colors.border}`,
                  background: form.format === fmt ? colors.buttonBg : colors.inputBg,
                  color: form.format === fmt ? colors.buttonText : colors.text,
                }}
              >
                <input
                  type="radio"
                  name="format"
                  value={fmt}
                  checked={form.format === fmt}
                  onChange={() => setForm((f) => ({ ...f, format: fmt }))}
                  className="hidden"
                />
                {fmt}
              </label>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs italic" style={{ color: colors.muted }}>
        Saved schedules are stored now -- scheduled email delivery not wired up yet.
      </p>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={form.reportTypes.length === 0 || saving}
          style={{ background: colors.buttonBg, color: colors.buttonText, opacity: (form.reportTypes.length === 0 || saving) ? 0.5 : 1 }}
          className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold font-body"
        >
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save preference'}
        </button>
      </div>
    </form>
  )
}

function AnnualReportPanel({ colors, user, showToast }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiRequest('/api/reports/annual')
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch((err) => {
        // 404 just means nothing's been uploaded yet -- not a real error.
        if (!cancelled && err.status !== 404) {
          showToast('Could not load the annual report.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const canUpload = user?.role === 'leadership' || user?.role === 'mel'
  const canDelete = user?.role === 'leadership'

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const record = await apiRequest('/api/reports/annual', { method: 'POST', body: formData })
      setReport(record)
      showToast('Annual report uploaded.')
    } catch (err) {
      showToast(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete() {
    try {
      await apiRequest('/api/reports/annual', { method: 'DELETE' })
      setReport(null)
      showToast('Annual report deleted.')
    } catch (err) {
      showToast(err.message || 'Delete failed.')
    } finally {
      setConfirmDelete(false)
    }
  }

  return (
    <div
      style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
      className="rounded-xl p-6"
    >
      <h2 className="font-body font-bold text-base" style={{ color: colors.text }}>
        Annual report (2025)
      </h2>
      <p className="mt-1 text-sm font-body" style={{ color: colors.muted }}>
        Interested Partners and Donors can download from the public site's impact page.
      </p>

      {loading ? (
        <p className="mt-4 text-sm" style={{ color: colors.muted }}>Loading…</p>
      ) : report ? (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg p-3"
          style={{ border: `1px solid ${colors.border}`, background: colors.inputBg }}
        >
          <div className="flex items-center gap-2.5">
            <FileText size={18} color={colors.red} />
            <div>
              <p className="text-sm font-semibold font-body" style={{ color: colors.text }}>{report.name}</p>
              <p className="text-xs" style={{ color: colors.muted }}>
                Uploaded by {report.uploadedBy} on {new Date(report.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={report.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{ border: `1px solid ${colors.border}`, color: colors.text }}
            >
              VIEW
            </a>
            {canUpload && (
              <label
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold"
                style={{ background: colors.buttonBg, color: colors.buttonText, opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? 'UPLOADING…' : 'REPLACE'}
                <input type="file" accept="application/pdf" onChange={handleUpload} disabled={uploading} className="hidden" />
              </label>
            )}
            {canDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete annual report"
                className="rounded-lg p-1.5"
                style={{ color: colors.red }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ) : canUpload ? (
        <label
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-sm"
          style={{ borderColor: colors.border, color: colors.muted, opacity: uploading ? 0.6 : 1 }}
        >
          <Upload size={20} />
          {uploading ? 'Uploading…' : 'Click to upload the 2025 annual report (PDF)'}
          <input type="file" accept="application/pdf" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
      ) : (
        <p className="mt-4 text-sm" style={{ color: colors.muted }}>
          No annual report has been uploaded yet.
        </p>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(20,18,15,0.45)' }}
          onClick={() => setConfirmDelete(false)}
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
                  Delete annual report?
                </h2>
              </div>
              <p className="mt-2 text-sm" style={{ color: colors.muted }}>
                This removes the public download for donors and partners until a new one is uploaded.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t p-4" style={{ borderColor: colors.border }}>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-2 text-sm font-semibold"
                style={{ color: colors.muted }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{ background: colors.red, color: '#fff' }}
                className="rounded-full px-4 py-2 text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Reports() {
  const COLORS = useAdminColors()
  const { user } = useAuth()
  const [toast, setToast] = useState('')
  const [schedules, setSchedules] = useState([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [exports, setExports] = useState([])
  const [loadingExports, setLoadingExports] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyFormState())
  const [deleteTarget, setDeleteTarget] = useState(null)

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 3200)
  }

  useEffect(() => {
    let cancelled = false
    apiRequest('/api/reports/schedules')
      .then((data) => {
        if (!cancelled) setSchedules(data)
      })
      .catch(() => {
        if (!cancelled) showToast('Could not load saved schedules.')
      })
      .finally(() => {
        if (!cancelled) setLoadingSchedules(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiRequest('/api/reports/exports')
      .then((data) => {
        if (!cancelled) setExports(data)
      })
      .catch(() => {
        if (!cancelled) showToast('Could not load export history.')
      })
      .finally(() => {
        if (!cancelled) setLoadingExports(false)
      })
    return () => { cancelled = true }
  }, [])

  async function submitForm(e) {
    e.preventDefault()
    if (form.reportTypes.length === 0) return

    const payload = {
      reportTypes: form.reportTypes,
      frequency: form.frequency,
      weekday: form.frequency === 'Weekly' ? form.weekday : null,
      dayOfMonth: (form.frequency === 'Monthly' || form.frequency === 'Quarterly') ? form.dayOfMonth : null,
      specificDate: form.frequency === 'Annually' ? form.specificDate : null,
      sendTo: form.sendTo,
      format: form.format,
    }

    setSaving(true)
    try {
      if (form.id) {
        const updated = await apiRequest(`/api/reports/schedules/${form.id}`, { method: 'PATCH', body: payload })
        setSchedules((prev) => prev.map((s) => (s.id === form.id ? updated : s)))
        showToast('Schedule updated.')
      } else {
        const created = await apiRequest('/api/reports/schedules', { method: 'POST', body: payload })
        setSchedules((prev) => [created, ...prev])
        showToast('Schedule saved.')
      }
      setForm(emptyFormState())
    } catch (err) {
      showToast(err.message || 'Could not save schedule.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(schedule) {
    setForm({
      id: schedule.id,
      reportTypes: schedule.reportTypes,
      frequency: schedule.frequency,
      weekday: schedule.weekday || WEEKDAYS[0],
      dayOfMonth: schedule.dayOfMonth || 1,
      specificDate: schedule.specificDate || '',
      sendTo: schedule.sendTo,
      format: schedule.format,
    })
    document.getElementById('schedule-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cancelEdit() {
    setForm(emptyFormState())
  }

  async function confirmDelete() {
    try {
      await apiRequest(`/api/reports/schedules/${deleteTarget.id}`, { method: 'DELETE' })
      setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      showToast('Schedule deleted.')
    } catch (err) {
      showToast(err.message || 'Could not delete schedule.')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100%' }} className="rounded-lg p-6 font-sans">
      <div className="mb-6">
        <h1 className="font-body font-bold text-2xl" style={{ color: COLORS.text }}>
          Reports & export
        </h1>
        <p className="mt-1 text-sm font-body" style={{ color: COLORS.muted }}>
          Scheduled exports and the public annual report, for grant reporting, the board, and audits.
        </p>
      </div>

      <div className="space-y-6">
        <AnnualReportPanel colors={COLORS} user={user} showToast={showToast} />

        <div id = "schedule-form">
          <ScheduleForm
            form={form}
            setForm={setForm}
            onSubmit={submitForm}
            onCancelEdit={cancelEdit}
            isEditing={Boolean(form.id)}
            colors={COLORS}
            saving={saving}
          />
        </div>
        
        <div
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          className="overflow-x-auto rounded-xl"
        >
          <div className="p-5 pb-0">
            <h2 className="font-body font-bold text-base" style={{ color: COLORS.text }}>
              Saved schedules
            </h2>
          </div>
          {loadingSchedules ? (
            <p className="p-5 text-sm" style={{ color: COLORS.muted }}>Loading…</p>
          ) : schedules.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: COLORS.muted }}>
              No schedules saved yet.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="border-b text-xs font-bold tracking-wide"
                  style={{ borderColor: COLORS.border, color: COLORS.muted }}
                >
                  <th className="px-5 py-3">REPORTS</th>
                  <th className="px-5 py-3">FREQUENCY</th>
                  <th className="px-5 py-3">FORMAT</th>
                  <th className="px-5 py-3">SEND TO</th>
                  <th className="px-5 py-3">CREATED BY</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => {
                  const canManage = canManageSchedule(schedule, user)
                  return (
                    <tr key={schedule.id} className="border-t" style={{ borderColor: COLORS.border }}>
                      <td className="px-5 py-3 font-semibold" style={{ color: COLORS.text }}>
                        {schedule.reportTypes
                          .map((id) => REPORT_TYPES.find((t) => t.id === id)?.label)
                          .filter(Boolean)
                          .join(', ')}
                      </td>
                      <td className="px-5 py-3" style={{ color: COLORS.muted }}>
                        {describeFrequency(schedule)}
                      </td>
                      <td className="px-5 py-3" style={{ color: COLORS.muted }}>
                        {schedule.format}
                      </td>
                      <td className="px-5 py-3" style={{ color: COLORS.muted }}>
                        {schedule.sendTo}
                      </td>
                      <td className="px-5 py-3" style={{ color: COLORS.muted }}>
                        {schedule.createdBy}
                      </td>
                      <td className="px-5 py-3">
                        {canManage && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEdit(schedule)}
                              aria-label="Edit schedule"
                              className="rounded-lg p-1.5 hover:bg-black/5"
                              style={{ color: COLORS.muted }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(schedule)}
                              aria-label="Delete schedule"
                              className="rounded-lg p-1.5 hover:bg-black/5"
                              style={{ color: COLORS.red }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent exports — real data - empty until dispatch job
        fires for the first time
        */}
        <div
          style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
          className="overflow-x-auto rounded-xl"
        >
          <div className="p-5 pb-0">
            <h2 className="font-body font-bold text-base" style={{ color: COLORS.text }}>
              Recent exports
            </h2>
          </div>
          {loadingExports ? (
            <p className="p-5 text-sm" style={{ color: COLORS.muted }}>Loading…</p>
          ) : exports.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: COLORS.muted }}>
              No exports yet. Scheduled reports will show up here once they're sent.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="border-b text-xs font-bold tracking-wide"
                  style={{ borderColor: COLORS.border, color: COLORS.muted }}
                >
                  <th className="px-5 py-3">REPORT</th>
                  <th className="px-5 py-3">SENT TO</th>
                  <th className="px-5 py-3">DATE</th>
                  <th className="px-5 py-3">FORMAT</th>
                </tr>
              </thead>
              <tbody>
                {exports.map((row) => {
                  const formatColor = row.format === 'PDF' ? COLORS.red : row.format === 'Excel' ? COLORS.green : COLORS.blue
                  return (
                    <tr key={row.id} className="border-t" style={{ borderColor: COLORS.border }}>
                      <td className="px-5 py-3 font-semibold" style={{ color: COLORS.text }}>
                        {row.reportTypes
                          .map((id) => REPORT_TYPES.find((t) => t.id === id)?.label)
                          .filter(Boolean)
                          .join(', ')}
                      </td>
                      <td className="px-5 py-3" style={{ color: COLORS.muted }}>
                        {row.sentTo}
                      </td>
                      <td className="px-5 py-3" style={{ color: COLORS.muted }}>
                        {new Date(row.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: formatColor }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: formatColor }} />
                          {row.format}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-semibold shadow-lg"
          style={{ background: COLORS.buttonBg, color: COLORS.buttonText }}
        >
          {toast}
        </div>
      )}

       {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(20,18,15,0.45)' }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.red}` }}
            className="w-full max-w-sm overflow-hidden rounded-2xl shadow-xl"
          >
            <div className="p-5">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} color={COLORS.red} />
                <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>
                  Delete this schedule?
                </h2>
              </div>
              <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>
                This stops the scheduled delivery for <strong style={{ color: COLORS.text }}>
                  {deleteTarget.reportTypes.map((id) => REPORT_TYPES.find((t) => t.id === id)?.label).join(', ')}
                </strong>.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t p-4" style={{ borderColor: COLORS.border }}>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-2 text-sm font-semibold"
                style={{ color: COLORS.muted }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{ background: COLORS.red, color: '#fff' }}
                className="rounded-full px-4 py-2 text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}