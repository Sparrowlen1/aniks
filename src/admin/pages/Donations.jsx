import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { X, Plus } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { apiRequest } from "../utils/api"; 
import { normalizePhone, sanitizePhoneInput } from "../../lib/phone";

const lightColors = {
  bg: "#fafaf8", border: "#e8e5df", text: "#1c1a17", muted: "#8c8579",
  panel: "#ffffff", green: "#3c8a4c", red: "#d24a42", orange: "#e2a63f",
  buttonBg: "#1c1a17", buttonText: "#ffffff", inputBg: "#ffffff", inputPlaceholder: "#8c8579",
};

const darkColors = {
  bg: "#1a1a1a", border: "#3a3a3a", text: "#f0f0f0", muted: "#aaaaaa",
  panel: "#2a2a2a", green: "#4c9a5c", red: "#d24a42", orange: "#e2a63f",
  buttonBg: "#f0f0f0", buttonText: "#1a1a1a", inputBg: "#2a2a2a", inputPlaceholder: "#aaaaaa",
};

const STATUS_STYLE = {
  Completed: { bg: "#dcefe0", text: "#2d7a43" },
  Pending: { bg: "#fdecd2", text: "#8a5c10" },
  Failed: { bg: "#f6d9d9", text: "#b23b3b" },
};

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = ["#c0392b", "#2f4a6b", "#b3760c", "#2d7a43", "#6b4a8a"];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function toCSV(rows) {
  const header = ["Donor", "Amount (KES)", "Phone", "Reference", "Date", "Status"];
  const lines = rows.map((r) =>
    [r.donor, r.amount, r.phone, r.reference, r.date, r.status]
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

function StatCard({ label, value, sub, bg, textColor = "#fff" }) {
  return (
    <div style={{ background: bg }} className="rounded-xl p-5 flex flex-col justify-between min-h-[120px]">
      <div style={{ color: textColor, opacity: 0.85 }} className="text-xs font-bold tracking-wide">{label}</div>
      <div>
        <div style={{ color: textColor }} className="text-3xl font-extrabold leading-tight">{value}</div>
        {sub && <div style={{ color: textColor, opacity: 0.85 }} className="text-xs font-semibold mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function AddDonationModal({ onClose, onAdd, colors, saving }) {
  const [donor, setDonor] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Completed");

  function submit(e) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!donor.trim() || !amt || amt <= 0) return;
    const normalizedPhone = phone.trim() ? normalizePhone(phone) : undefined;
    if (phone.trim() && !normalizedPhone) return;
    onAdd({ donor_name: donor.trim(), amount: amt, phone: normalizedPhone, status });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(20,18,15,0.45)" }} onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border }}>
          <h2 className="font-bold text-lg" style={{ color: colors.text }}>Record M-Pesa donation</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X size={18} color={colors.muted} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>Donor name</label>
            <input
              required value={donor} onChange={(e) => setDonor(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
              placeholder="e.g. Peter O."
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>Amount (KES)</label>
            <input
              required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
              placeholder="1000"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>Phone number</label>
            <input
              value={phone} onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
              placeholder="0712345678"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: colors.muted }}>Status</label>
            <select
              value={status} onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${colors.border}`, background: colors.inputBg, color: colors.text }}
            >
              {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: colors.border }}>
          <button type="button" onClick={onClose} className="text-sm font-semibold px-3 py-2" style={{ color: colors.muted }}>
            Cancel
          </button>
          <button
            type="submit" disabled={saving}
            style={{ background: colors.buttonBg, color: colors.buttonText }}
            className="text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add donation"}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatLocalDate(utcString) {
  if (!utcString) return "—";
  return new Date(utcString).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Donations() {
  const { theme } = useOutletContext();
  const COLORS = theme === "dark" ? darkColors : lightColors;

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadDonations() {
    setLoading(true);
    try {
      const data = await apiRequest('/api/donations');
      setDonations(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Couldn't load donations.");
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDonations();
  }, []);

  const stats = useMemo(() => {
    const completed = donations.filter((d) => d.status === "Completed");
    const now = new Date();
    const thisMonthTotal = completed
      .filter((d) => d.created_at && new Date(d.created_at).getMonth() === now.getMonth() && new Date(d.created_at).getFullYear() === now.getFullYear())
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const yearTotal = completed
      .filter((d) => d.created_at && new Date(d.created_at).getFullYear() === now.getFullYear())
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const totalGifts = completed.length;
    const avgGift = totalGifts ? Math.round(yearTotal / totalGifts) : 0;

    const brackets = { under: 0, mid: 0, over: 0 };
    completed.forEach((d) => {
      const amt = Number(d.amount || 0);
      if (amt < 1000) brackets.under += 1;
      else if (amt <= 5000) brackets.mid += 1;
      else brackets.over += 1;
    });
    const total = totalGifts || 1;
    const pctUnder = Math.round((brackets.under / total) * 100);
    const pctMid = Math.round((brackets.mid / total) * 100);
    const pctOver = 100 - pctUnder - pctMid;

    return { thisMonthTotal, yearTotal, avgGift, totalGifts, pctUnder, pctMid, pctOver };
  }, [donations]);

  const pieData = [
    { name: "Under 1,000", value: stats.pctUnder, color: COLORS.red },
    { name: "1,000–5,000", value: stats.pctMid, color: COLORS.orange },
    { name: "Over 5,000", value: stats.pctOver, color: COLORS.green },
  ];

  const filteredDonations = useMemo(() => {
    if (!searchTerm.trim()) return donations;
    const q = searchTerm.toLowerCase().trim();
    return donations.filter((d) => (d.donor || "").toLowerCase().includes(q));
  }, [donations, searchTerm]);

  async function addDonation(payload) {
    setSaving(true);
    try {
      const record = await apiRequest('/api/donations', {
        method: 'POST',
        body: { ...payload, method: 'manual' },
      });
      setDonations((prev) => [record, ...prev]);
      toast.success(`Recorded ${payload.donor_name}'s donation.`);
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Couldn't record that donation.");
    } finally {
      setSaving(false);
    }
  }

  function fmt(n) {
    return `KES ${Number(n || 0).toLocaleString()}`;
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <style>{`
        .donation-input::placeholder { color: ${COLORS.inputPlaceholder}; opacity: 1; }
      `}</style>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>Donations</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>Total contributions to ANIKA.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text" placeholder="Search donor..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none donation-input"
            style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text, width: "180px" }}
          />
          <button
            onClick={() => setModalOpen(true)}
            style={{ background: COLORS.buttonBg, color: COLORS.buttonText }}
            className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg flex items-center gap-1.5"
          >
            <Plus size={14} /> RECORD DONATION
          </button>
          <button
            onClick={() => downloadCSV(donations, "donations.csv")}
            style={{ border: `1px solid ${COLORS.border}`, background: COLORS.panel, color: COLORS.text }}
            className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg"
          >
            EXPORT CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="THIS MONTH" value={fmt(stats.thisMonthTotal)} sub="Updates as gifts come in" bg={COLORS.green} textColor="#fff" />
        <StatCard label="TOTAL THIS YEAR" value={fmt(stats.yearTotal)} sub={`${stats.totalGifts} gifts`} bg={COLORS.red} textColor="#fff" />
        <StatCard label="AVG GIFT" value={stats.avgGift.toLocaleString()} sub="KES" bg={COLORS.orange} textColor="#1c1a17" />
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-4 flex items-center gap-4">
          <div style={{ width: 84, height: 84 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={26} outerRadius={40} startAngle={90} endAngle={-270}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold mb-1.5" style={{ color: COLORS.text }}>By gift size</div>
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs mb-1" style={{ color: COLORS.text }}>
                <span style={{ background: d.color }} className="w-2 h-2 rounded-sm shrink-0" />
                <span style={{ color: COLORS.muted }}>{d.name}</span>
                <span className="font-bold ml-auto">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl overflow-hidden overflow-x-auto">
        <div
          className="grid text-xs font-bold tracking-wide px-5 py-3 border-b min-w-205"
          style={{
            color: COLORS.muted,
            borderColor: COLORS.border,
            gridTemplateColumns: "1.4fr 1fr 1.8fr 1.3fr 1.5fr 1fr",
          }}
        >
          <div>DONOR</div>
          <div>AMOUNT</div>
          <div>PHONE</div>
          <div>REFERENCE</div>
          <div>DATE (Local)</div>
          <div>STATUS</div>
        </div>

        {loading && (
          <div className="px-5 py-8 text-sm text-center" style={{ color: COLORS.muted }}>Loading donations…</div>
        )}

        {!loading && filteredDonations.length === 0 && (
          <div className="px-5 py-8 text-sm text-center" style={{ color: COLORS.muted }}>No donations yet.</div>
        )}

        {!loading && filteredDonations.map((d) => {
          const s = STATUS_STYLE[d.status] || STATUS_STYLE.Pending;
          return (
            <div
              key={d.id}
              className="grid items-center px-5 py-4 border-b last:border-b-0 min-w-205"
              style={{
                borderColor: COLORS.border,
                gridTemplateColumns: "1.4fr 1fr 1.8fr 1.3fr 1.5fr 1fr",
              }}
            >
              <div className="flex items-center gap-3">
                <div style={{ background: avatarColor(d.donor) }} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {initials(d.donor)}
                </div>
                <span className="font-semibold text-sm" style={{ color: COLORS.text }}>{d.donor}</span>
              </div>
              <div className="text-sm font-bold" style={{ color: COLORS.text }}>
                {d.currency || "KES"} {Number(d.amount || 0).toLocaleString()}
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {d.phone}
              </div>
              <div className="text-sm font-mono" style={{ color: COLORS.text }}>{d.reference}</div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {formatLocalDate(d.created_at)}
              </div>
              <div
                style={{ background: s.bg, color: s.text }}
                className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              >
                <span style={{ background: s.text }} className="w-1.5 h-1.5 rounded-full" />
                {d.status}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <AddDonationModal onClose={() => setModalOpen(false)} onAdd={addDonation} colors={COLORS} saving={saving} />
      )}
    </div>
  );
}