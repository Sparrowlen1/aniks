import { useEffect, useMemo, useState } from "react";
import { X, Trash2, Search } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { apiRequest } from "../utils/api"; 

const lightColors = {
  bg: "#fafaf8",
  border: "#e8e5df",
  text: "#1c1a17",
  muted: "#8c8579",
  panel: "#ffffff",
  buttonBg: "#1c1a17",
  buttonText: "#ffffff",
  inputBg: "#ffffff",
  inputPlaceholder: "#8c8579",
};

const darkColors = {
  bg: "#1a1a1a",
  border: "#3a3a3a",
  text: "#f0f0f0",
  muted: "#aaaaaa",
  panel: "#2a2a2a",
  buttonBg: "#f0f0f0",
  buttonText: "#1a1a1a",
  inputBg: "#2a2a2a",
  inputPlaceholder: "#aaaaaa",
};

const AVATAR_COLORS = ["#2f4a6b", "#c0392b", "#2d7a43", "#b3760c", "#6b4a8a"];

const STATUS_STYLE = {
  New: { bg: "#fdecd2", dot: "#c98a1f", text: "#8a5c10" },
  Shortlisted: { bg: "#dbe6f5", dot: "#2f4a6b", text: "#2f4a6b" },
  Accepted: { bg: "#dcefe0", dot: "#2d7a43", text: "#2d7a43" },
  Rejected: { bg: "#f6d9d9", dot: "#b23b3b", text: "#b23b3b" },
};

const STATUSES = ["New", "Shortlisted", "Accepted", "Rejected"];

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function toCSV(rows) {
  const header = ["Applicant", "Programme", "Submitted", "Status", "Email", "Phone"];
  const lines = rows.map((r) =>
    [r.name, r.programme, r.submitted, r.status, r.email, r.phone]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCSV(rows, filename) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Pill({ active, children, onClick, colors }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? colors.text : colors.panel,
        color: active ? colors.panel : colors.text,
        border: `1px solid ${active ? colors.text : colors.border}`,
      }}
      className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.New;
  return (
    <span
      style={{ background: s.bg, color: s.text }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
    >
      <span style={{ background: s.dot }} className="w-1.5 h-1.5 rounded-full" />
      {status}
    </span>
  );
}

function DeleteConfirmModal({ app, onClose, onConfirm, colors }) {
  if (!app) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(20,18,15,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.panel,
          border: `1px solid ${colors.border}`,
        }}
        className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: colors.border }}
        >
          <h2 className="font-bold text-lg" style={{ color: colors.text }}>
            Confirm Delete
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5"
          >
            <X size={18} color={colors.muted} />
          </button>
        </div>

        <div className="p-5">
          <p style={{ color: colors.text }}>
            Are you sure you want to delete the application from <strong>{app.name}</strong>?
            This action cannot be undone.
          </p>
        </div>

        <div
          className="flex justify-end gap-2 p-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold px-3 py-2"
            style={{ color: colors.muted }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(app.id);
              onClose();
            }}
            style={{
              background: "#b23b3b",
              color: "#ffffff",
            }}
            className="text-sm font-semibold px-4 py-2 rounded-full"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ app, onClose, onUpdateStatus, onDelete, colors }) {
  if (!app) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(20,18,15,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-3">
            <div
              style={{ background: avatarColor(app.name) }}
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold"
            >
              {initials(app.name)}
            </div>
            <div>
              <div className="font-bold text-lg" style={{ color: colors.text }}>
                {app.name}
              </div>
              <div className="text-sm" style={{ color: colors.muted }}>
                {app.programme}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X size={18} color={colors.muted} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: colors.muted }}>
                Submitted
              </div>
              <div style={{ color: colors.text }}>{app.submitted}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: colors.muted }}>
                Contact
              </div>
              <div style={{ color: colors.text }}>{app.email}</div>
              <div style={{ color: colors.text }}>{app.phone}</div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.muted }}>
              Application summary
            </div>
            <p style={{ color: colors.text }}>{app.summary}</p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.muted }}>
              Relevant experience
            </div>
            <p style={{ color: colors.text }}>{app.experience}</p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: colors.muted }}>
              Update status
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateStatus(app.id, s)}
                  style={{
                    background: app.status === s ? colors.text : colors.panel,
                    color: app.status === s ? colors.panel : colors.text,
                    border: `1px solid ${app.status === s ? colors.text : colors.border}`,
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            onClick={() => {
              onDelete(app.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full"
            style={{ color: "#b23b3b" }}
          >
            <Trash2 size={14} /> Withdraw application
          </button>
          <button
            onClick={onClose}
            style={{ background: colors.buttonBg, color: colors.buttonText }}
            className="text-sm font-semibold px-4 py-2 rounded-full"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Applications() {
  const { theme, searchQuery } = useOutletContext();
  const COLORS = theme === 'dark' ? darkColors : lightColors;

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("All");
  const [reviewing, setReviewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  const tabs = ["All", "New", "Shortlisted", "Accepted"];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await apiRequest('/api/applications');
        if (!cancelled) setApplications(data || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load applications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = applications;

    if (tab !== "All") {
      result = result.filter((a) => a.status === tab);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.programme || "").toLowerCase().includes(q)
      );
    }

    if (localSearchTerm.trim()) {
      const q = localSearchTerm.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.programme || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [applications, tab, searchQuery, localSearchTerm]);

  async function updateStatus(id, status) {
    const previous = applications;
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setReviewing((prev) => (prev && prev.id === id ? { ...prev, status } : prev));

    try {
      await apiRequest(`/api/applications/${id}`, {
        method: 'PATCH',
        body: { status },
      });
    } catch {
      setApplications(previous);
      toast.error("Failed to update status.");
    }
  }

  async function deleteApp(id) {
    const previous = applications;
    setApplications((prev) => prev.filter((a) => a.id !== id));
    try {
      await apiRequest(`/api/applications/${id}`, { method: 'DELETE' });
    } catch {
      setApplications(previous);
      toast.error("Failed to delete application.");
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <style>{`
        .app-input::placeholder {
          color: ${COLORS.inputPlaceholder};
          opacity: 1;
        }
      `}</style>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
            Applications
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Volunteer, artist, partner and newsletter submissions from the Get Involved form.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: COLORS.muted }}
            />
            <input
              type="text"
              placeholder="Search by name or programme..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              style={{
                background: COLORS.inputBg,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                paddingLeft: "2.5rem",
              }}
              className="w-48 md:w-64 rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#E6A15E]/50"
            />
          </div>
          <button
            onClick={() => downloadCSV(filtered, "applications.csv")}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
              color: COLORS.text,
            }}
            className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg"
          >
            EXPORT CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((t) => (
          <Pill key={t} active={tab === t} onClick={() => setTab(t)} colors={COLORS}>
            {t}
          </Pill>
        ))}
      </div>

      <div
        style={{
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
        }}
        className="rounded-xl overflow-hidden"
      >
        <div
          className="grid text-xs font-bold tracking-wide px-5 py-3 border-b"
          style={{
            color: COLORS.muted,
            borderColor: COLORS.border,
            gridTemplateColumns: "2fr 2fr 1fr 1fr 0.8fr",
          }}
        >
          <div>APPLICANT</div>
          <div>PROGRAMME</div>
          <div>SUBMITTED</div>
          <div>STATUS</div>
          <div></div>
        </div>

        {loading && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
            Loading applications...
          </div>
        )}

        {!loading && loadError && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "#b23b3b" }}>
            {loadError} — is the backend running on localhost:5000?
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
            No applications match the current filter.
          </div>
        )}

        {!loading && !loadError && filtered.map((app) => (
          <div
            key={app.id}
            className="grid items-center px-5 py-4 border-b last:border-b-0"
            style={{ borderColor: COLORS.border, gridTemplateColumns: "2fr 2fr 1fr 1fr 0.8fr" }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{ background: avatarColor(app.name) }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              >
                {initials(app.name)}
              </div>
              <span className="font-semibold text-sm" style={{ color: COLORS.text }}>
                {app.name}
              </span>
            </div>
            <div className="text-sm" style={{ color: COLORS.muted }}>
              {app.programme}
            </div>
            <div className="text-sm" style={{ color: COLORS.text }}>
              {app.submitted}
            </div>
            <div>
              <StatusBadge status={app.status} />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewing(app)}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.panel,
                  color: COLORS.text,
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                Review
              </button>
              <button
                onClick={() => setDeleteTarget(app)}
                className="p-1.5 rounded-lg hover:bg-black/5"
                title="Delete application"
              >
                <Trash2 size={14} color="#b23b3b" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ReviewModal
        app={reviewing}
        onClose={() => setReviewing(null)}
        onUpdateStatus={updateStatus}
        onDelete={deleteApp}
        colors={COLORS}
      />

      {deleteTarget && (
        <DeleteConfirmModal
          app={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteApp}
          colors={COLORS}
        />
      )}
    </div>
  );
}