import { useEffect, useMemo, useState } from "react";
import { X, Plus, Search, Trash2 } from "lucide-react";
import {
  fetchRegistrations,
  fetchEvents,
  submitRegistration,
  updateRegistration,
  deleteRegistration,
} from "../../lib/api";
import { useAdminColors } from "../theme";
import { normalizePhone, sanitizePhoneInput } from "../../lib/phone";

const STATUS_STYLE = {
  Confirmed: { bg: "#dcefe0", text: "#2d7a43", dot: "#2d7a43" },
  Pending: { bg: "#fdecd2", text: "#8a5c10", dot: "#c98a1f" },
  Waitlist: { bg: "#dbe6f5", text: "#2f4a6b", dot: "#2f4a6b" },
  Canceled: { bg: "#f6d9d9", text: "#b23b3b", dot: "#b23b3b" },
};

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#c0392b", "#2f4a6b", "#b3760c", "#2d7a43", "#6b4a8a"];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function toCSV(rows) {
  const header = ["Attendee", "Event", "Phone", "Date", "Source", "WhatsApp Opt-in", "Status"];
  const lines = rows.map((r) =>
    [r.name, r.event, r.phone, r.date, r.source, r.consent ? "Yes" : "No", r.status]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCSV(rows, filename) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, sub, bg, textColor = "#fff" }) {
  return (
    <div style={{ background: bg }} className="rounded-xl p-5 flex flex-col justify-between min-h-30">
      <div style={{ color: textColor, opacity: 0.85 }} className="text-xs font-bold tracking-wide">{label}</div>
      <div>
        <div style={{ color: textColor }} className="text-3xl font-extrabold leading-tight">{value}</div>
        {sub && <div style={{ color: textColor, opacity: 0.85 }} className="text-xs font-semibold mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function AddRegistrationModal({ onClose, onAdd, colors, eventOptions }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [event, setEvent] = useState(eventOptions?.[0] || "");
  const [consent, setConsent] = useState(true);

  function submit(e) {
    e.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (!name.trim() || !event || !normalizedPhone) return;
    onAdd({
      id: Date.now(),
      name: name.trim(),
      event,
      phone: normalizedPhone,
      date: "Today " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "Manual",
      consent,
      status: "Confirmed",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(20,18,15,0.45)" }} onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ background: colors.panel, border: `1px solid ${colors.border}` }} className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border }}>
          <h2 className="font-bold text-lg" style={{ color: colors.text }}>Add registration</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-black/5"><X size={18} color={colors.muted} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grace Njeri" className="px-3 py-2 rounded-lg text-sm outline-none" style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>WhatsApp number</label>
            <input value={phone} inputMode="numeric" onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))} placeholder="25471200000" className="px-3 py-2 rounded-lg text-sm outline-none" style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>Event</label>
            <select required value={event} onChange={(e) => setEvent(e.target.value)} disabled={!eventOptions.length} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text, appearance: "auto" }}>
              {!eventOptions.length && <option value="">Create an event before adding a registration</option>}
              {eventOptions.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: colors.text }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="h-4 w-4 rounded" />
            WhatsApp opt-in for updates
          </label>
        </div>
        <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: colors.border }}>
          <button type="button" onClick={onClose} className="text-sm font-semibold px-3 py-2" style={{ color: colors.muted }}>Cancel</button>
          <button type="submit" style={{ background: colors.buttonBg, color: colors.buttonText }} className="text-sm font-semibold px-4 py-2 rounded-lg">Add registration</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminRegistrations() {
  const COLORS = useAdminColors();

  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("All");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [eventOptions, setEventOptions] = useState([]);

  useEffect(() => {
    fetchRegistrations().then(({ rows: stored }) => {
      setRows(Array.isArray(stored)
        ? stored.map((r) => ({ ...r, event: r.event || r.eventTitle || "" }))
        : []);
    });
    fetchEvents().then(({ rows: evs }) => {
      if (evs && evs.length) setEventOptions(evs.map((e) => e.title).filter(Boolean));
    });
  }, []);

  const tabs = ["All", "Confirmed", "Pending", "Waitlist", "Canceled"];

  const filtered = useMemo(() => {
    let result = rows;
    if (tab !== "All") result = result.filter((r) => r.status === tab);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(s) || r.event.toLowerCase().includes(s) || r.phone.includes(s));
    }
    return result;
  }, [rows, tab, q]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      opted: rows.filter((r) => r.consent).length,
      confirmed: rows.filter((r) => r.status === "Confirmed").length,
      events: rows.map((r) => r.event).filter((v, i, a) => a.indexOf(v) === i).length,
    };
  }, [rows]);

  function addRow(row) {
    const payload = {
      name: row.name,
      phone: row.phone,
      email: row.email || null,
      eventTitle: row.event,
      source: "Manual",
      consent: Boolean(row.consent),
    };
    submitRegistration(payload).then((res) => {
      if (res.source === "api") refreshFromApi();
    });
    setRows((prev) => [row, ...prev]);
  }

  function updateStatus(id, status) {
    if (!STATUS_STYLE[status]) return;
    setRows((prev) => prev.map((r) => (r.id !== id ? r : { ...r, status })));
    updateRegistration(id, { status }).then((res) => {
      if (res.source === "api") refreshFromApi();
    });
  }

  function deleteRow(id) {
    deleteRegistration(id).then((res) => {
      if (res.source === "api") refreshFromApi();
    });
    setRows((prev) => prev.filter((r) => r.id !== id));
    setConfirmDelete(null);
  }

  // Re-pull from the backend after a successful API mutation so event seat
  // counts (and anything else the server computed) stay in sync.
  async function refreshFromApi() {
    const res = await fetchRegistrations();
    if (res.source === "api" && Array.isArray(res.rows)) {
      setRows(res.rows.map((r) => ({ ...r, event: r.event || r.eventTitle || "" })));
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>Registrations</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>Everyone signed up for ANIKA events.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalOpen(true)} style={{ background: COLORS.buttonBg, color: COLORS.buttonText }} className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg flex items-center gap-1.5">
            <Plus size={14} /> ADD REGISTRATION
          </button>
          <button onClick={() => downloadCSV(filtered, "registrations.csv")} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.panel, color: COLORS.text }} className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg">
            EXPORT CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="TOTAL" value={stats.total} sub="All registrations" bg={COLORS.blue} textColor="#fff" />
        <StatCard label="CONFIRMED" value={stats.confirmed} sub="Going ahead" bg={COLORS.green} textColor="#fff" />
        <StatCard label="WHATSAPP OPT-INS" value={stats.opted} sub="Consented to updates" bg={COLORS.red} textColor="#fff" />
        <StatCard label="EVENTS WITH TAKEOUT" value={stats.events} sub="Distinct events" bg={COLORS.orange} textColor="#1c1a17" />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap items-center">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? COLORS.text : COLORS.panel, color: tab === t ? COLORS.panel : COLORS.text, border: `1px solid ${tab === t ? COLORS.text : COLORS.border}` }} className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors">
            {t}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.muted }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search attendee, event, phone…" className="pl-9 pr-3 py-2 rounded-lg text-sm outline-none w-64 max-w-full" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.panel, color: COLORS.text }} />
        </div>
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl overflow-hidden overflow-x-auto">
        <div className="grid text-xs font-bold tracking-wide px-5 py-3 border-b min-w-245" style={{ color: COLORS.muted, borderColor: COLORS.border, gridTemplateColumns: "1.6fr 2fr 1.2fr 1fr 0.8fr 0.9fr 1fr" }}>
          <div>ATTENDEE</div><div>EVENT</div><div>PHONE</div><div>DATE</div><div>SOURCE</div><div>WHATSAPP</div><div>STATUS</div>
        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>No registrations match the current filter.</div>
        )}
        {filtered.map((r) => {
          const s = STATUS_STYLE[r.status] || STATUS_STYLE.Pending;
          return (
            <div key={r.id} className="grid items-center px-5 py-4 border-b last:border-b-0 min-w-245" style={{ borderColor: COLORS.border, gridTemplateColumns: "1.6fr 2fr 1.2fr 1fr 0.8fr 0.9fr 1fr" }}>
              <div className="flex items-center gap-3">
                <div style={{ background: avatarColor(r.name) }} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">{initials(r.name)}</div>
                <span className="font-semibold text-sm" style={{ color: COLORS.text }}>{r.name}</span>
              </div>
              <div className="text-sm" style={{ color: "#2f4a6b" }}>{r.event}</div>
              <div className="text-sm" style={{ color: COLORS.text }}>{r.phone}</div>
              <div className="text-sm" style={{ color: COLORS.text }}>{r.date}</div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: r.source === "WhatsApp" ? "#dcf4e0" : "#e8e5df", color: r.source === "WhatsApp" ? "#1f7a3a" : "#5c564c" }}>
                  {r.source}
                </span>
              </div>
              <div>
                {r.consent ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#2d7a43" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2d7a43" }} /> Opted in
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: COLORS.muted }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.muted }} /> No
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={r.status}
                  onChange={(e) => updateStatus(r.id, e.target.value)}
                  title="Change status"
                  style={{ background: s.bg, color: s.text, border: `1px solid ${s.dot}` }}
                  className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold outline-none appearance-auto"
                >
                  {Object.keys(STATUS_STYLE).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(r)}
                  title="Delete registration"
                  className="p-1.5 rounded-lg hover:bg-black/5"
                  style={{ color: "#b23b3b" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {modalOpen && <AddRegistrationModal onClose={() => setModalOpen(false)} onAdd={addRow} colors={COLORS} eventOptions={eventOptions} />}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(20,18,15,0.45)" }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}
            className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg" style={{ color: COLORS.text }}>
              Remove this registration?
            </h3>
            <p className="mt-2 text-sm leading-6" style={{ color: COLORS.muted }}>
              <span style={{ color: COLORS.text, fontWeight: 600 }}>{confirmDelete.name}</span> for{" "}
              <span style={{ color: COLORS.text, fontWeight: 600 }}>"{confirmDelete.event}"</span> will be
              permanently removed and the event's seat count will be freed. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="text-sm font-semibold px-3 py-2 rounded-lg"
                style={{ border: `1px solid ${COLORS.border}`, background: COLORS.panel, color: COLORS.text }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteRow(confirmDelete.id)}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
                style={{ background: "#EB4C47" }}
              >
                Delete registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
