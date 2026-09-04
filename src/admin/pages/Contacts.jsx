import { useMemo, useState, useEffect } from "react";
import { X, Search, Trash2, Eye } from "lucide-react";
import { useOutletContext } from "react-router-dom";
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

const AVATAR_COLORS = ["#c0392b", "#2f4a6b", "#b3760c", "#2d7a43", "#6b4a8a"];

function getContactType(source, subject) {
  if (source === 'donation') return 'Donor';
  if (source === 'getinvolved') {
    const map = {
      'artist': 'Artist',
      'volunteer': 'Volunteer',
      'partnership': 'Partner',
      'newsletter': 'Newsletter',
      'event': 'Event Participant',
      'other': 'Other'
    };
    return map[subject] || 'Volunteer';
  }
  return 'Volunteer';
}

const TYPE_STYLE = {
  Donor: { bg: "#dcefe0", text: "#2d7a43" },
  Volunteer: { bg: "#e3dcf0", text: "#6b4a8a" },
  Artist: { bg: "#f6d9d9", text: "#b23b3b" },
  Partner: { bg: "#dbe6f5", text: "#2f4a6b" },
  Youth: { bg: "#fbe6c8", text: "#b3760c" },
  Newsletter: { bg: "#dbeaf5", text: "#2a6b8a" },
  'Event Participant': { bg: "#f5e6d3", text: "#8a6b2a" },
  Other: { bg: "#e8e8e8", text: "#666666" },
};

const TAB_TO_TYPE = {
  Artists: "Artist",
  Youth: "Youth",
  Donors: "Donor",
  Partners: "Partner",
  Volunteers: "Volunteer",
  Newsletter: "Newsletter",
};

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
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatEngagement(dateStr) {
  if (!dateStr) return "Registered";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function getSourceLabel(source) {
  if (source === "donation") return "Donation";
  if (source === "getinvolved") return "Get Involved";
  return source;
}

function toCSV(rows) {
  const header = [
    "Name",
    "Phone",
    "Email",
    "Type",
    "Source",
    "Status",
    "Registered",
    "Country",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.phone || "",
      r.email || "",
      r.type,
      r.source,
      r.status || "",
      r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
      r.country || "",
    ]
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

function Pill({ active, children, onClick, colors }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? colors.text : colors.panel,
        color: active ? colors.panel : colors.text,
        border: `1px solid ${active ? colors.text : colors.border}`,
      }}
      className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap"
    >
      {children}
    </button>
  );
}

function TypeBadge({ type }) {
  const s = TYPE_STYLE[type] || TYPE_STYLE.Volunteer;
  return (
    <span
      style={{ background: s.bg, color: s.text }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
    >
      <span style={{ background: s.text }} className="w-1.5 h-1.5 rounded-full" />
      {type}
    </span>
  );
}

function ViewContactModal({ contact, onClose, colors }) {
  if (!contact) return null;

  const dateStr = contact.created_at
    ? new Date(contact.created_at).toLocaleString()
    : "Unknown";

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
        className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: colors.border }}
        >
          <h2 className="font-bold text-lg" style={{ color: colors.text }}>
            Contact Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5"
          >
            <X size={18} color={colors.muted} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div
              style={{ background: avatarColor(contact.name) }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
            >
              {initials(contact.name)}
            </div>
            <div>
              <div className="font-bold" style={{ color: colors.text }}>
                {contact.name}
              </div>
              <div className="text-sm" style={{ color: colors.muted }}>
                {contact.type}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold" style={{ color: colors.muted }}>
                Email:
              </span>
              <div style={{ color: colors.text }}>{contact.email || "—"}</div>
            </div>
            <div>
              <span className="font-semibold" style={{ color: colors.muted }}>
                Phone:
              </span>
              <div style={{ color: colors.text }}>{contact.phone || "—"}</div>
            </div>
            <div>
              <span className="font-semibold" style={{ color: colors.muted }}>
                Source:
              </span>
              <div style={{ color: colors.text }}>{contact.source}</div>
            </div>
            <div>
              <span className="font-semibold" style={{ color: colors.muted }}>
                Subject:
              </span>
              <div style={{ color: colors.text }}>{contact.subject || "—"}</div>
            </div>
            <div>
              <span className="font-semibold" style={{ color: colors.muted }}>
                Country:
              </span>
              <div style={{ color: colors.text }}>{contact.country || "—"}</div>
            </div>
            <div>
              <span className="font-semibold" style={{ color: colors.muted }}>
                Status:
              </span>
              <div style={{ color: colors.text }}>{contact.status || "new"}</div>
            </div>
            <div className="col-span-2">
              <span className="font-semibold" style={{ color: colors.muted }}>
                Registered:
              </span>
              <div style={{ color: colors.text }}>{dateStr}</div>
            </div>
            <div className="col-span-2">
              <span className="font-semibold" style={{ color: colors.muted }}>
                Message / Interest:
              </span>
              <div style={{ color: colors.text }} className="whitespace-pre-wrap">
                {contact.interest || "—"}
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex justify-end p-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: colors.buttonBg,
              color: colors.buttonText,
            }}
            className="text-sm font-semibold px-4 py-2 rounded-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ contact, onClose, onConfirm, colors }) {
  if (!contact) return null;
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
            Are you sure you want to delete <strong>{contact.name}</strong>?
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
              onConfirm(contact.id);
              onClose();
            }}
            style={{ background: "#b23b3b", color: "#ffffff" }}
            className="text-sm font-semibold px-4 py-2 rounded-full"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contacts() {
  const { theme } = useOutletContext();
  const COLORS = theme === "dark" ? darkColors : lightColors;

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const tabs = ["All", "Artists", "Youth", "Donors", "Partners", "Volunteers", "Newsletter"];

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/contacts?per_page=100');
      const fetched = data.contacts || [];
      const mapped = fetched.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        email: c.email || "",
        type: getContactType(c.source, c.subject),
        interest: c.message || "",
        country: c.country || "",
        subject: c.subject || "",
        source: getSourceLabel(c.source),
        status: c.status || "new",
        created_at: c.created_at,
        lastEngagement: c.created_at
          ? `Registered · ${formatEngagement(c.created_at)}`
          : "Registered",
      }));
      setContacts(mapped);
    } catch (err) {
      console.error(err);
      setError("Could not load contacts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const deleteContact = async (id) => {
    try {
      await apiRequest(`/api/contacts/${id}`, { method: 'DELETE' });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete contact.");
    }
  };

  const filtered = useMemo(() => {
    let rows = contacts;
    if (tab !== "All") rows = rows.filter((c) => c.type === TAB_TO_TYPE[tab]);
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          c.interest.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [contacts, tab, query]);

  const handleExport = () => {
    if (filtered.length === 0) return;
    downloadCSV(filtered, "contacts.csv");
  };

  const truncate = (text, maxLen = 50) => {
    if (!text) return '—';
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  };

  return (
    <div
      style={{ background: COLORS.bg, minHeight: "100%" }}
      className="p-6 font-sans rounded-lg"
    >
      <style>{`
        .search-input::placeholder {
          color: ${COLORS.inputPlaceholder};
          opacity: 1;
        }
      `}</style>

      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
            Contacts
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Everyone who donated, applied, or messaged ANIKA.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            style={{
              border: `1px solid ${COLORS.border}`,
              background: COLORS.panel,
              color: COLORS.text,
            }}
            className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg"
          >
            EXPORT
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <Pill
              key={t}
              active={tab === t}
              onClick={() => setTab(t)}
              colors={COLORS}
            >
              {t}
            </Pill>
          ))}
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            minWidth: 220,
          }}
        >
          <Search size={15} color={COLORS.muted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts..."
            className="search-input text-sm outline-none flex-1 bg-transparent"
            style={{ color: COLORS.text }}
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-10" style={{ color: COLORS.muted }}>
          Loading contacts...
        </div>
      )}
      {error && (
        <div className="text-center py-10 text-red-500">{error}</div>
      )}

      {!loading && !error && (
        <div
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
          }}
          className="rounded-xl overflow-hidden overflow-x-auto"
        >
          <div
            className="grid text-xs font-bold tracking-wide px-5 py-3 border-b min-w-230"
            style={{
              color: COLORS.muted,
              borderColor: COLORS.border,
              gridTemplateColumns: "1.6fr 1.2fr 1fr 1.3fr 1fr 1.5fr 1fr 0.9fr",
            }}
          >
            <div>NAME</div>
            <div>PHONE</div>
            <div>TYPE</div>
            <div>INTEREST</div>
            <div>COUNTRY</div>
            <div>LAST ENGAGEMENT</div>
            <div>SOURCE</div>
            <div></div>
          </div>

          {filtered.length === 0 && (
            <div
              className="px-5 py-10 text-center text-sm"
              style={{ color: COLORS.muted }}
            >
              No contacts match this view.
            </div>
          )}

          {filtered.map((c) => (
            <div
              key={c.id}
              className="grid items-center px-5 py-4 border-b last:border-b-0 min-w-230"
              style={{
                borderColor: COLORS.border,
                gridTemplateColumns:
                  "1.6fr 1.2fr 1fr 1.3fr 1fr 1.5fr 1fr 0.9fr",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ background: avatarColor(c.name) }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                >
                  {initials(c.name)}
                </div>
                <span
                  className="font-semibold text-sm"
                  style={{ color: COLORS.text }}
                >
                  {c.name}
                </span>
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {c.phone}
              </div>
              <div>
                <TypeBadge type={c.type} />
              </div>
              <div
                className="text-sm"
                style={{ color: COLORS.text }}
                title={c.interest || ''}
              >
                {truncate(c.interest, 50)}
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {c.country || "—"}
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {c.lastEngagement}
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {c.source}
              </div>
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => setViewTarget(c)}
                  className="p-1.5 rounded-lg hover:bg-black/5"
                  title="View details"
                >
                  <Eye size={14} color={COLORS.muted} />
                </button>
                <button
                  onClick={() => setDeleteTarget(c)}
                  className="p-1.5 rounded-lg hover:bg-black/5"
                  title="Delete"
                >
                  <Trash2 size={14} color="#b23b3b" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewTarget && (
        <ViewContactModal
          contact={viewTarget}
          onClose={() => setViewTarget(null)}
          colors={COLORS}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          contact={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteContact}
          colors={COLORS}
        />
      )}
    </div>
  );
}