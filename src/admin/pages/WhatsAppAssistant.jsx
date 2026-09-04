import { useEffect, useState } from "react";
import { Bot, Save, MessageSquare, Zap, ShieldCheck, SendHorizonal, UserRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchWhatsAppSettings,
  addWhatsAppSettings,
  updateWhatsAppSettings,
  fetchWhatsAppInbox,
  updateWhatsAppMessage,
  fetchWhatsAppStats,
  simulateWhatsAppMessage,
  fetchWhatsAppStatus,
} from "../../lib/api";
import { useAdminColors } from "../theme";
import { normalizePhone, sanitizePhoneInput } from "../../lib/phone";

const FLOW_LABELS = {
  confirmRegistration: "Event registration confirmation (auto on form submit)",
  sendReminder24h: "24-hour event reminder (auto-scheduled at registration)",
  sendFeedback24h: "Post-event feedback request + survey link (24h after)",
  humanEscalation: "Human escalation when the AI cannot answer or user types HELP",
  optOut: "STOP replies immediately remove the contact from future outbound",
};

const DEFAULT_SETTINGS = {
  key: "assistant",
  menuEnabled: true,
  greeting:
    "Hello! Welcome to ANIKA Initiative. Reply with a number:\n1) Upcoming events\n2) How to apply\n3) How to donate\n4) Talk to a human",
  answers: {
    events: "Our next events are posted on anikainitiative.com/events. Sema-Anika Forum is coming up soon, want me to share the registration link?",
    apply: "You can apply to the Pan-African Arts Alliance at anikainitiative.com/alliance. Reply ALLIANCE and I will guide you through it.",
    donate: "You can support ANIKA at anikainitiative.com/donate with M-Pesa or card. Every donation gets an instant receipt.",
    human: "Switching you to a member of the ANIKA team now. Someone will reply here shortly.",
    default:
      "Sorry, I did not quite catch that. Reply 1 for events, 2 to apply, 3 to donate, or 4 to talk to a human.",
  },
  flows: {
    confirmRegistration: true,
    sendReminder24h: true,
    sendFeedback24h: true,
    humanEscalation: true,
    optOut: true,
  },
};

function ChatBubble({ from, text, colors }) {
  const isBot = from === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className="max-w-[85%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-line"
        style={{
          background: isBot ? colors.panelAlt : "#DCF7E5",
          color: isBot ? colors.text : "#1c3a26",
          border: isBot ? `1px solid ${colors.border}` : "none",
          borderTopLeftRadius: isBot ? 4 : undefined,
          borderTopRightRadius: isBot ? undefined : 4,
        }}
      >
        {text}
      </div>
    </div>
  );
}
export default function WhatsAppAssistant() {
  const COLORS = useAdminColors();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedId, setSavedId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState(null);
  const [chat, setChat] = useState([{ from: "bot", text: DEFAULT_SETTINGS.greeting }]);
  const [draft, setDraft] = useState("");
  const [stats, setStats] = useState({ threads: 0, optedOut: 0, escalated: 0, unread: 0 });
  const [simName, setSimName] = useState("");
  const [simPhone, setSimPhone] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [waStatus, setWaStatus] = useState({ configured: false, simulated: true });

  function rebuildChatFromContact(contact, greeting) {
    if (!contact) return;
    const msgs = (contact.messages || []).map((m) => ({
      from: m.from === "me" ? "bot" : "user",
      text: m.text,
    }));
    setChat([{ from: "bot", text: greeting || settings.greeting }, ...msgs]);
  }

  function refreshStats() {
    fetchWhatsAppStats().then(setStats);
  }

  useEffect(() => {
    fetchWhatsAppSettings().then(({ rows }) => {
      const saved = rows && rows.find((r) => r.key === "assistant");
      if (saved) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...saved,
          answers: { ...DEFAULT_SETTINGS.answers, ...(saved.answers || {}) },
          flows: { ...DEFAULT_SETTINGS.flows, ...(saved.flows || {}) },
        });
        setSavedId(saved.id);
      }
    });
    fetchWhatsAppInbox().then(({ rows }) => {
      if (rows && rows.length) {
        setContacts(rows);
        setContactId(rows[0].id);
        setSimName(rows[0].name);
        setSimPhone(rows[0].phone);
        rebuildChatFromContact(rows[0]);
      }
    });
    fetchWhatsAppStatus().then(setWaStatus);
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function replyFor(input) {
    // Offline mirror of the bot engine (backend /api/whatsapp/simulate is used
    // when available). Kept in sync with anika_assistant.resolve_reply.
    const s = settings;
    const msg = input.trim().toLowerCase();
    if (s.flows.humanEscalation && (msg.includes("help") || msg === "4" || msg.includes("human"))) return s.answers.human;
    if (s.flows.optOut && (msg === "stop" || msg === "unsubscribe" || msg === "opt out")) return "You have been unsubscribed from ANIKA updates. Reply any time to opt back in.";
    if (msg === "1" || msg.includes("event")) return s.answers.events;
    if (msg === "2" || msg === "alliance" || msg.includes("apply") || msg.includes("join") || msg.includes("member")) return s.answers.apply;
    if (msg === "3" || msg.includes("donat") || msg.includes("support")) return s.answers.donate;
    return s.answers.default;
  }

  async function sendMessage() {
    if (!draft.trim() || simulating) return;
    const text = draft.trim();
    const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { from: "them", text, time: now() };

    setChat((prev) => [...prev, { from: "user", text }]);
    setDraft("");
    setSimulating(true);

    const name = simName.trim() || "Test Visitor";
    const phone = normalizePhone(simPhone);
    if (!phone) return;

    try {
      // Push the message through the real bot engine (same code the webhook
      // uses) so FAQ/HELP/STOP/re-subscribe all behave exactly as live.
      const res = await simulateWhatsAppMessage({ name, phone, message: text });
      const botReply = res.reply || "…";
      const conv = res.conversation;

      const upper = text.toUpperCase();
      const note =
        conv?.intent === "escalation"
          ? "Thread flagged for escalation. A team member will be assigned in the inbox."
          : conv?.optedOut && upper !== "STOP"
            ? "Contact re-subscribed. They will receive outbound updates again."
            : upper === "STOP"
              ? "Contact opted out. Removed from outbound lists. Inbox updated."
              : null;

      setChat((prev) => [
        ...prev,
        { from: "bot", text: botReply },
        ...(note ? [{ from: "system", text: note }] : []),
      ]);

      if (conv) {
        setContacts((prev) => {
          const exists = prev.some((c) => c.id === conv.id);
          return exists ? prev.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...prev];
        });
        setContactId(conv.id);
        setSimName(conv.name);
        setSimPhone(conv.phone);
      }
    } catch {
      // Backend offline: keep the demo interactive with the local mirror.
      const botReply = replyFor(text);
      const upper = text.toUpperCase();
      const flowNote =
        upper === "HELP"
          ? "Thread flagged for escalation. A team member will be assigned in the inbox."
          : upper === "STOP"
            ? "Contact opted out. Removed from outbound lists. Inbox updated."
            : null;
      const botMsg = { from: "me", text: botReply, time: now() };

      setChat((prev) => [
        ...prev,
        { from: "bot", text: botReply },
        ...(flowNote ? [{ from: "system", text: flowNote }] : []),
      ]);

      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        const patch = {
          messages: [...(contact.messages || []), userMsg, botMsg],
          preview: text,
          unread: 0,
          ...(upper === "HELP" && settings.flows.humanEscalation
            ? { intent: "escalation", resolved: false }
            : {}),
          ...(upper === "STOP" && settings.flows.optOut ? { optedOut: true } : {}),
        };
        updateWhatsAppMessage(contact.id, patch).then(refreshStats);
        setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, ...patch } : c)));
      }
    } finally {
      setSimulating(false);
      refreshStats();
    }
  }

  function selectContact(id) {
    setContactId(id);
    const c = contacts.find((x) => x.id === id);
    if (c) {
      setSimName(c.name);
      setSimPhone(c.phone);
      rebuildChatFromContact(c);
    }
  }

  const activeContact = contacts.find((c) => c.id === contactId);

  function save() {
    const payload = { key: "assistant", ...settings };
    if (savedId) {
      updateWhatsAppSettings(savedId, payload).then(() => toast.success("Assistant settings saved"));
    } else {
      addWhatsAppSettings(payload).then(({ record }) => {
        setSavedId(record?.id || null);
        toast.success("Assistant settings saved");
      });
    }
  }

  const enabledCount = Object.values(settings.flows).filter(Boolean).length;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>WhatsApp Assistant</h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>AI-powered WhatsApp Business API assistant. Handles FAQs 24/7, routes HELP to staff, and runs outbound sequences.</p>
        </div>
        <button
          onClick={save}
          style={{ background: COLORS.buttonBg, color: COLORS.buttonText }}
          className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg flex items-center gap-1.5"
        >
          <Save size={14} /> SAVE SETTINGS
        </button>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold"
          style={waStatus?.configured
            ? { background: "#dcefe0", color: "#2d7a43" }
            : { background: "#fdecd2", color: "#8a5c10" }}
          title={waStatus?.configured
            ? "WhatsApp Cloud API is configured - replies are sent to real numbers."
            : "WhatsApp credentials are not set. The bot still processes messages (simulated mode)."}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: waStatus?.configured ? "#2d7a43" : "#c98a1f" }} />
          {waStatus?.configured ? "WhatsApp Cloud connected" : "Assistant simulated"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div style={{ background: "#389A51" }} className="rounded-xl p-5 text-white">
          <p className="text-xs font-bold tracking-wide opacity-85">AUTO-REPLIES</p>
          <p className="mt-2 text-3xl font-extrabold">24/7</p>
          <p className="mt-1 text-xs opacity-85">Inbound FAQ menu</p>
        </div>
        <div style={{ background: "#EB4C47" }} className="rounded-xl p-5 text-white">
          <p className="text-xs font-bold tracking-wide opacity-85">FLOWS LIVE</p>
          <p className="mt-2 text-3xl font-extrabold">{enabledCount}/5</p>
          <p className="mt-1 text-xs opacity-85">Confirmation, reminder, feedback</p>
        </div>
        <div style={{ background: "#E8A850" }} className="rounded-xl p-5">
          <p className="text-xs font-bold tracking-wide opacity-85" style={{ color: "#1c1a17" }}>ESCALATED</p>
          <p className="mt-2 text-3xl font-extrabold" style={{ color: "#1c1a17" }}>{stats.escalated}</p>
          <p className="mt-1 text-xs opacity-85" style={{ color: "#1c1a17" }}>HELP threads in inbox</p>
        </div>
        <div style={{ background: "#3A7599" }} className="rounded-xl p-5 text-white">
          <p className="text-xs font-bold tracking-wide opacity-85">OPTED OUT</p>
          <p className="mt-2 text-3xl font-extrabold">{stats.optedOut}</p>
          <p className="mt-1 text-xs opacity-85">Removed from outbound lists</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left: rules */}
        <div className="space-y-5">
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={16} style={{ color: COLORS.green }} />
              <h2 className="font-bold" style={{ color: COLORS.text }}>Greeting & menu</h2>
            </div>
            <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Greeting message</label>
            <textarea
              value={settings.greeting}
              onChange={(e) => setSettings((s) => ({ ...s, greeting: e.target.value }))}
              rows={5}
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text }}
            />
            <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: COLORS.text }}>
              <input
                type="checkbox"
                checked={settings.menuEnabled}
                onChange={(e) => setSettings((s) => ({ ...s, menuEnabled: e.target.checked }))}
                className="h-4 w-4 rounded"
              />
              Show numbered menu to new conversations
            </label>
          </div>

          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} style={{ color: COLORS.blue }} />
              <h2 className="font-bold" style={{ color: COLORS.text }}>FAQ auto-replies</h2>
            </div>
            <div className="space-y-3">
              {[
                ["events", "1) Upcoming events"],
                ["apply", "2) How to apply"],
                ["donate", "3) How to donate"],
                ["human", "4) Talk to a human"],
                ["default", "Fallback"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>{label}</label>
                  <textarea
                    value={settings.answers[key]}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, answers: { ...s.answers, [key]: e.target.value } }))
                    }
                    rows={2}
                    className="mt-1 w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} style={{ color: COLORS.orange }} />
              <h2 className="font-bold" style={{ color: COLORS.text }}>Outbound & routing flows</h2>
            </div>
            <div className="space-y-2.5">
              {Object.entries(FLOW_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-start gap-2.5 text-sm" style={{ color: COLORS.text }}>
                  <input
                    type="checkbox"
                    checked={settings.flows[key]}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, flows: { ...s.flows, [key]: e.target.checked } }))
                    }
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <span className="leading-6">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: simulator */}
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }} className="rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3 border-b flex-wrap" style={{ borderColor: COLORS.border }}>
            <Zap size={16} style={{ color: COLORS.green }} />
            <h2 className="font-bold" style={{ color: COLORS.text }}>Live preview</h2>
            {activeContact && (
              <div className="relative ml-auto">
                <span className="mr-2 text-[11px] font-semibold" style={{ color: COLORS.muted }}>
                  Simulate as
                </span>
                <select
                  value={activeContact.id}
                  onChange={(e) => selectContact(e.target.value)}
                  className="px-2 py-1.5 pr-8 rounded-lg text-xs font-semibold outline-none cursor-pointer appearance-none"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text }}
                  aria-label="Simulate conversation as a contact"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.optedOut ? " (opted out)" : ""}
                    </option>
                  ))}
                </select>
                <UserRound size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: COLORS.muted }} />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: "320px", maxHeight: "480px" }}>
            {chat.map((m, i) =>
              m.from === "system" ? (
                <div key={i} className="text-center">
                  <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full" style={{ background: "#fdecd2", color: "#8a5c10" }}>
                    {m.text}
                  </span>
                </div>
              ) : (
                <ChatBubble key={i} from={m.from} text={m.text} colors={COLORS} />
              )
            )}
          </div>

          <div className="p-3 border-t" style={{ borderColor: COLORS.border }}>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold" style={{ color: COLORS.muted }}>
              <UserRound size={12} /> New visitor (or pick a thread above)
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="Visitor name"
                className="px-3 py-1.5 rounded-lg text-sm outline-none min-w-0"
                style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text }}
              />
              <input
                value={simPhone}
                onChange={(e) => setSimPhone(sanitizePhoneInput(e.target.value))}
                placeholder="+254 700 000 000"
                className="px-3 py-1.5 rounded-lg text-sm outline-none min-w-0"
                style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {["1) Upcoming events", "2) How to apply", "3) How to donate", "4) Talk to a human", "HELP", "STOP"].map((q) => (
                <button
                  key={q}
                  onClick={() => setDraft(q)}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.panelAlt, color: COLORS.text }}
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={"Type a visitor message..."}
                className="flex-1 px-3 py-2 rounded-full text-sm outline-none"
                style={{ border: `1px solid ${COLORS.border}`, background: COLORS.inputBg, color: COLORS.text }}
              />
              <button type="submit" disabled={simulating} className="h-10 w-10 rounded-full flex items-center justify-center text-white" style={{ background: "#25D366", opacity: simulating ? 0.6 : 1 }} title="Send">
                {simulating ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
