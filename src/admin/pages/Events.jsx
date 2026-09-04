import { useEffect, useMemo, useState } from "react";
import { X, Plus, Pen, Trash2 } from "lucide-react";
import {
  fetchEvents,
  addEvent as apiAddEvent,
  deleteEvent as apiDeleteEvent,
  updateEvent as apiUpdateEvent,
} from "../../lib/api";
import { useAdminColors } from "../theme";
import { toISODateInput, fromISODateInput } from "../../lib/eventDate";
import { apiRequest } from "../utils/api";

const STATUS_STYLE = {
  Live: { bg: "#dcefe0", text: "#2d7a43", dot: "#2d7a43" },
  Draft: { bg: "#f0ece7", text: "#7a7265", dot: "#7a7265" },
  Full: { bg: "#fdecd2", text: "#8a5c10", dot: "#c98a1f" },
  Ended: { bg: "#e3e6ec", text: "#4a5668", dot: "#4a5668" },
};

const STATUSES = ["Live", "Draft", "Full", "Ended"];

const PILLAR_COLORS = {
  "Arts & Culture": "#3A7599",
  "Youth & Migration": "#389A51",
  Expressions: "#E8A850",
  "Gender Equality": "#EB4C47",
  Governance: "#1A1208",
};

function toCSV(rows) {
  const header = ["Event", "Date", "Time", "Location", "Pillar", "Capacity", "Registered", "Status"];
  const lines = rows.map((r) =>
    [r.title, r.date, r.time, r.location, r.pillar, r.capacity, r.registered, r.status]
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
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function occupancyColor(ev) {
  if (!ev.capacity) return "#8c8579";
  const pct = ev.registered / ev.capacity;
  if (pct >= 1) return "#c98a1f";
  if (pct >= 0.75) return "#d24a42";
  return "#3c8a4c";
}

function StatCard({ label, value, sub, bg, textColor = "#fff" }) {
  return (
    <div style={{ background: bg }} className="rounded-xl p-5 flex flex-col justify-between min-h-30">
      <div style={{ color: textColor, opacity: 0.85 }} className="text-xs font-bold tracking-wide">
        {label}
      </div>
      <div>
        <div style={{ color: textColor }} className="text-3xl font-extrabold leading-tight">
          {value}
        </div>
        {sub && (
          <div style={{ color: textColor, opacity: 0.85 }} className="text-xs font-semibold mt-1">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function AddEventModal({ onClose, onAdd, colors, initial }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? "");
  const [pillar, setPillar] = useState(initial?.pillar ?? "Arts & Culture");
  const [date, setDate] = useState(toISODateInput(initial?.date ?? ""));
  const [time, setTime] = useState(initial?.time ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    let uploadedImage = image;
    if (imageFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", imageFile);
        const result = await apiRequest("/api/events/image", { method: "POST", body: formData });
        uploadedImage = result.url;
      } catch {
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    onAdd({
      id: initial?.id ?? Date.now(),
      title: title.trim(),
      date: fromISODateInput(date),
      time,
      location: location.trim() || "Nairobi",
      pillar,
      capacity: parseInt(capacity, 10) || (initial?.capacity || 0),
      registered: initial?.registered ?? 0,
      status: initial?.status ?? "Live",
      image: uploadedImage,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(20,18,15,0.45)" }} onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border }}>
          <h2 className="font-bold text-lg" style={{ color: colors.text }}>
            {initial ? "Update event" : "Create event"}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X size={18} color={colors.muted} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Event title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Community Open Mic Night"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: colors.muted }}>
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: colors.muted }}>
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. The GoDown Arts Centre, Nairobi"
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: colors.muted }}>
                Pillar
              </label>
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text, appearance: "auto" }}
              >
                {Object.keys(PILLAR_COLORS).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: colors.muted }}>
                Capacity
              </label>
              <input
                type="number"
                min="0"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="120"
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>
              Event image
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                if (file) setImage(URL.createObjectURL(file));
              }}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            />
            {image && <img src={image} alt="Event preview" className="mt-2 h-24 w-full rounded-lg object-cover" />}
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: colors.border }}>
          <button type="button" onClick={onClose} className="text-sm font-semibold px-3 py-2" style={{ color: colors.muted }}>
            Cancel
          </button>
          <button type="submit" disabled={uploading} style={{ background: colors.buttonBg, color: colors.buttonText }} className="text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
            {uploading ? "Uploading image..." : initial ? "Update event" : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}
export default function AdminEvents() {
  const COLORS = useAdminColors();

  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchEvents().then(({ rows }) => {
      setEvents(Array.isArray(rows) ? rows : []);
    });
  }, []);

  const tabs = ["All", "Live", "Draft", "Full", "Ended"];

  const filtered = useMemo(() => {
    if (tab === "All") return events;
    return events.filter((ev) => ev.status === tab);
  }, [events, tab]);

  const stats = useMemo(() => {
    const upcoming = events.filter((e) => e.status === "Live" || e.status === "Full");
    const totalRegistered = events.reduce((s, e) => s + e.registered, 0);
    const draft = events.filter((e) => e.status === "Draft").length;
    const totalCap = events.reduce((s, e) => s + (e.capacity || 0), 0);
    const fillRate = totalCap ? Math.round((totalRegistered / totalCap) * 100) : 0;
    return { total: events.length, upcoming: upcoming.length, totalRegistered, draft, fillRate };
  }, [events]);

  // Re-sync the table from the backend after a successful API mutation so
  // seat counts that change on the server (registrations bumping an event to
  // "Full", etc.) are reflected. Falls back silently when the API is offline.
  async function refreshFromApi() {
    const res = await fetchEvents();
    if (res.source === "api" && Array.isArray(res.rows)) setEvents(res.rows);
  }

  function saveEvent(ev) {
    const existing = events.find((x) => x.id === ev.id);
    if (existing) {
      // Editing an existing event.
      const patch = { ...ev };
      delete patch.id;
      setEvents((prev) => prev.map((x) => (x.id === ev.id ? { ...x, ...ev } : x)));
      apiUpdateEvent(ev.id, patch).then((res) => {
        if (res.source === "api") refreshFromApi();
      });
    } else {
      // Creating a brand-new event.
      setEvents((prev) => [ev, ...prev]);
      const payload = { ...ev };
      delete payload.id;
      apiAddEvent(payload).then((res) => {
        if (res.source === "api") refreshFromApi();
      });
    }
    setModalOpen(false);
    setEditEvent(null);
  }

  function updateStatus(id, nextStatus) {
    if (!STATUSES.includes(nextStatus)) return;
    setEvents((prev) =>
      prev.map((ev) => (ev.id !== id ? ev : { ...ev, status: nextStatus }))
    );
    apiUpdateEvent(id, { status: nextStatus }).then((res) => {
      if (res.source === "api") refreshFromApi();
    });
  }

  function deleteEvent(id) {
    apiDeleteEvent(id).then((res) => {
      if (res.source === "api") refreshFromApi();
    });
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    setConfirmDelete(null);
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>Events</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>Plan, publish and track attendance for ANIKA events.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalOpen(true)} style={{ background: COLORS.buttonBg, color: COLORS.buttonText }} className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg flex items-center gap-1.5">
            <Plus size={14} /> NEW EVENT
          </button>
          <button onClick={() => downloadCSV(filtered, "events.csv")} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.panel, color: COLORS.text }} className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg">
            EXPORT CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="TOTAL EVENTS" value={stats.total} sub="All time" bg={COLORS.blue} textColor="#fff" />
        <StatCard label="UPCOMING" value={stats.upcoming} sub="Live or full" bg={COLORS.green} textColor="#fff" />
        <StatCard label="SEATS REGISTERED" value={stats.totalRegistered.toLocaleString()} sub={`${stats.fillRate}% avg fill`} bg={COLORS.red} textColor="#fff" />
        <StatCard label="IN DRAFT" value={stats.draft} sub="Awaiting publish" bg={COLORS.orange} textColor="#1c1a17" />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? COLORS.text : COLORS.panel, color: tab === t ? COLORS.panel : COLORS.text, border: `1px solid ${tab === t ? COLORS.text : COLORS.border}` }} className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors">
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl overflow-hidden overflow-x-auto">
        <div
          className="grid text-xs font-bold tracking-wide px-5 py-3 border-b min-w-245"
          style={{ color: COLORS.muted, borderColor: COLORS.border, gridTemplateColumns: "2.2fr 1.1fr 1.4fr 0.9fr 0.8fr 1fr 0.8fr 0.9fr" }}
        >
          <div>EVENT</div>
          <div>DATE</div>
          <div>LOCATION</div>
          <div>PILLAR</div>
          <div>CAPACITY</div>
          <div>REGISTERED</div>
          <div>STATUS</div>
          <div></div>
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
            No events match the current filter.
          </div>
        )}

        {filtered.map((ev) => {
          const s = STATUS_STYLE[ev.status] || STATUS_STYLE.Draft;
          const pct = ev.capacity ? Math.min(100, Math.round((ev.registered / ev.capacity) * 100)) : 0;
          return (
            <div
              key={ev.id}
              className="grid items-center px-5 py-4 border-b last:border-b-0 min-w-245"
              style={{ borderColor: COLORS.border, gridTemplateColumns: "2.2fr 1.1fr 1.4fr 0.9fr 0.8fr 1fr 0.8fr 0.9fr" }}
            >
              <div>
                <div className="font-semibold text-sm leading-snug" style={{ color: COLORS.text }}>
                  {ev.title}
                </div>
                <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                  {ev.time}
                </div>
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {ev.date}
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {ev.location}
              </div>
              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${PILLAR_COLORS[ev.pillar] || "#4a4a4a"}1a`, color: PILLAR_COLORS[ev.pillar] || "#4a4a4a" }}
                >
                  {ev.pillar}
                </span>
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {ev.capacity || "-"}
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: occupancyColor(ev) }}>
                  {ev.registered}
                  {ev.capacity ? ` / ${ev.capacity}` : ""}
                </div>
                {ev.capacity ? (
                  <div className="h-1 w-16 mt-1 rounded-full bg-black/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: occupancyColor(ev) }} />
                  </div>
                ) : null}
              </div>
              <select
                value={ev.status}
                onChange={(e) => updateStatus(ev.id, e.target.value)}
                title="Change status"
                style={{ background: s.bg, color: s.text, border: `1px solid ${s.dot}` }}
                className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold outline-none appearance-auto"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="flex justify-end gap-1">
                <button onClick={() => setEditEvent(ev)} className="p-1.5 rounded-lg hover:bg-black/5" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.panel, color: COLORS.text }} title="Edit event">
                  <Pen size={14} />
                </button>
                <button onClick={() => setConfirmDelete(ev)} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: "#b23b3b" }} title="Delete event">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && <AddEventModal onClose={() => setModalOpen(false)} onAdd={saveEvent} colors={COLORS} />}
      {editEvent && <AddEventModal initial={editEvent} onClose={() => setEditEvent(null)} onAdd={saveEvent} colors={COLORS} />}

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
              Delete this event?
            </h3>
            <p className="mt-2 text-sm leading-6" style={{ color: COLORS.muted }}>
              <span style={{ color: COLORS.text, fontWeight: 600 }}>"{confirmDelete.title}"</span> will be
              permanently removed, along with its registration count. This cannot be undone.
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
                onClick={() => deleteEvent(confirmDelete.id)}
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
                style={{ background: "#EB4C47" }}
              >
                Delete event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
