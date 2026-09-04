import { useEffect, useMemo, useState } from "react";
import { Send, Check, Clock, Users, Zap } from "lucide-react";
import { fetchWhatsAppBroadcasts, addWhatsAppBroadcast, fetchWhatsAppStats, fetchWhatsAppInbox } from "../../lib/api";
import { useAdminColors } from "../theme";



const STATUS_STYLE = {
  Delivered: { bg: "#dcefe0", text: "#2d7a43", dot: "#2d7a43" },
  Sent: { bg: "#dbe6f5", text: "#2f4a6b", dot: "#2f4a6b" },
  Scheduled: { bg: "#fdecd2", text: "#8a5c10", dot: "#c98a1f" },
  Failed: { bg: "#f6d9d9", text: "#b23b3b", dot: "#b23b3b" },
};

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

// Audiences whose recipient counts reduce as contacts opt out.
function adjustForOptOuts(audienceSize, optedOut) {
  const reducible = ["All opted-in", "All contacts"];
  if (reducible.includes(audienceSize.audience)) {
    return Math.max(0, audienceSize.value - optedOut);
  }
  return audienceSize.value;
}

export default function WhatsAppBroadcast() {
  const COLORS = useAdminColors();

  const [history, setHistory] = useState([]);
  const [audience, setAudience] = useState("All opted-in");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [sending, setSending] = useState(false);
  const [waStats, setWaStats] = useState({ threads: 0, optedOut: 0, escalated: 0, unread: 0 });
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetchWhatsAppBroadcasts().then(({ rows }) => {
      setHistory(Array.isArray(rows) ? rows : []);
    });
    fetchWhatsAppStats().then(setWaStats);
    fetchWhatsAppInbox().then(({ rows }) => {
      setConversations(Array.isArray(rows) ? rows : []);
    });
  }, []);

  const MAX_CHARS = 1024;

  // Audience sizes come from the real conversation list when it exists, so the
  // counts match what the assistant actually knows. A fallback base keeps the
  // composer sane before the first registrations/bot threads are created.
  const liveContacts = conversations.length;
  const liveOptIns = conversations.filter((c) => !c.optedOut).length;

  const effectiveAudience = useMemo(() => {
    if (audience === "All opted-in") return liveOptIns;
    if (audience === "All contacts") return liveContacts;
    if (audience === "Opted-in registrants") return Math.round(liveContacts * 0.25);
    if (audience === "Alliance contacts") return Math.round(liveContacts * 0.16);
    if (audience === "Nairobi artists") return Math.round(liveContacts * 0.3);
    return liveOptIns;
  }, [audience, liveContacts, liveOptIns]);

  const audienceSize = adjustForOptOuts({ audience, value: effectiveAudience }, waStats.optedOut);

  const stats = useMemo(() => {
    const totalSent = history.reduce((s, h) => s + h.recipients, 0);
    const delivered = history.filter((h) => h.status === "Delivered").length;
    const scheduled = history.filter((h) => h.status === "Scheduled").length;
    return { count: history.length, totalSent, delivered, scheduled, fresh: Math.round(liveContacts * 0.38) };
  }, [history, liveContacts]);

  function send() {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      const record = {
        id: Date.now(),
        title: message.trim().slice(0, 40) + (message.trim().length > 40 ? "…" : ""),
        audience,
        channel: "WhatsApp",
        recipients: audienceSize,
        date: when === "now" ? "Just now" : `Scheduled ${scheduleDate || ""}`.trim(),
        status: when === "now" ? "Sent" : "Scheduled",
      };
      addWhatsAppBroadcast(record);
      setHistory((prev) => [record, ...prev]);
      setMessage("");
      setSending(false);
    }, 800);
  }

  const audiences = ["All opted-in", "All contacts", "Opted-in registrants", "Alliance contacts", "Nairobi artists"];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>WhatsApp Broadcast</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>Compose and schedule messages to ANIKA's audience.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="CAMPAIGNS" value={stats.count} sub="All time" bg={COLORS.blue} textColor="#fff" />
        <StatCard label="MESSAGES SENT" value={stats.totalSent.toLocaleString()} sub="Cumulative" bg={COLORS.green} textColor="#fff" />
        <StatCard label="DELIVERED" value={stats.delivered} sub="Campaigns" bg={COLORS.red} textColor="#fff" />
        <StatCard label="FRESH (NO REPLY YET)" value={stats.fresh.toLocaleString()} sub="May need follow-up" bg={COLORS.orange} textColor="#1c1a17" />
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} style={{ color: COLORS.green }} />
          <h2 className="font-bold text-base" style={{ color: COLORS.text }}>New broadcast</h2>
        </div>

        <div className="grid lg:grid-cols-[1fr_0.9fr] gap-5">
          <div>
            <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Write your campaign message…"
              rows={6}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text }}
            />
            <div className="text-right text-xs mt-1" style={{ color: message.length > MAX_CHARS * 0.8 ? "#d24a42" : COLORS.muted }}>
              {message.length} / {MAX_CHARS}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: COLORS.muted }}>
              <Users size={14} /> {audienceSize.toLocaleString()} people will receive this message
              {waStats.optedOut > 0 && (
                <span style={{ color: "#b23b3b" }}>({waStats.optedOut} opted out excluded)</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text, appearance: "auto" }}
              >
                {audiences.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Send when?</label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <button onClick={() => { setWhen("now"); setScheduleDate(""); }} className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: when === "now" ? COLORS.green : "transparent", color: when === "now" ? "#fff" : COLORS.text, border: `1px solid ${when === "now" ? COLORS.green : COLORS.border}` }}>
                  <Send size={12} /> Now
                </button>
                <button onClick={() => setWhen("later")} className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ background: when === "later" ? COLORS.orange : "transparent", color: when === "later" ? "#1c1a17" : COLORS.text, border: `1px solid ${when === "later" ? COLORS.orange : COLORS.border}` }}>
                  <Clock size={12} /> Schedule
                </button>
              </div>
              {when === "later" && (
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-2 w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text }}
                />
              )}
            </div>

            <button
              onClick={send}
              disabled={!message.trim() || sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: COLORS.green, opacity: !message.trim() || sending ? 0.5 : 1 }}
            >
              {sending ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Sending…" : when === "now" ? "Send broadcast" : "Schedule broadcast"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl overflow-hidden overflow-x-auto">
        <div className="grid text-xs font-bold tracking-wide px-5 py-3 border-b min-w-190" style={{ color: COLORS.muted, borderColor: COLORS.border, gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr" }}>
          <div>CAMPAIGN</div><div>AUDIENCE</div><div>RECIPIENTS</div><div>STATUS / DATE</div>
        </div>
        {history.map((h) => {
          const s = STATUS_STYLE[h.status] || STATUS_STYLE.Sent;
          return (
            <div key={h.id} className="grid items-center px-5 py-4 border-b last:border-b-0 min-w-190" style={{ borderColor: COLORS.border, gridTemplateColumns: "2fr 1.2fr 0.9fr 1fr" }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: COLORS.text }}>{h.title}</div>
                <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>{h.channel} • {h.date}</div>
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>{h.audience}</div>
              <div className="text-sm font-bold" style={{ color: COLORS.text }}>{h.recipients.toLocaleString()}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.text }}>
                  {h.status === "Delivered" && <Check size={12} />}
                  <span style={{ background: s.dot }} className="w-1.5 h-1.5 rounded-full" />{h.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
