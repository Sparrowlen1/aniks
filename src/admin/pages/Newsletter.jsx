import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Send, Users, Mail, Trash2, X } from "lucide-react";

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


function DeactivateConfirmModal({ subscriber, onClose, onConfirm, colors }) {
  if (!subscriber) return null;

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
            Confirm Deactivation
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
            Are you sure you want to deactivate <strong>{subscriber.name || subscriber.email}</strong>?
            They will no longer receive newsletters.
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
              onConfirm(subscriber.id);
              onClose();
            }}
            style={{
              background: "#b23b3b",
              color: "#ffffff",
            }}
            className="text-sm font-semibold px-4 py-2 rounded-full"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Newsletter() {
  const { theme } = useOutletContext();
  const COLORS = theme === "dark" ? darkColors : lightColors;

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const getToken = () => {
    const session = localStorage.getItem("anika_admin_session");
    if (!session) return null;
    try {
      const parsed = JSON.parse(session);
      return parsed.token || null;
    } catch {
      return null;
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/newsletter/subscribers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        let errMsg = "Failed to fetch subscribers";
        try {
          const data = await response.json();
          errMsg = data.error || data.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      setSubscribers(data);
    } catch (err) {
      setLoadError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    if (!emailSubject || !emailContent) {
      toast.error("Please fill in both subject and content");
      return;
    }
    setSending(true);
    try {
      const token = getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/newsletter/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subject: emailSubject, content: emailContent }),
        }
      );
      if (!response.ok) {
        let errMsg = "Failed to send newsletter";
        try {
          const data = await response.json();
          errMsg = data.error || data.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      toast.success(`Newsletter sent to ${data.sent_count} subscribers!`);
      setEmailSubject("");
      setEmailContent("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/newsletter/${id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        let errMsg = "Failed to deactivate subscriber";
        try {
          const data = await response.json();
          errMsg = data.error || data.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      toast.success("Subscriber deactivated.");
      fetchSubscribers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <style>{`
        .newsletter-input::placeholder {
          color: ${COLORS.inputPlaceholder};
          opacity: 1;
        }
      `}</style>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
            Newsletter
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Manage subscribers and send email campaigns. Only approved subscribers will receive emails.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.text,
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
          >
            <Users size={18} style={{ color: COLORS.muted }} />
            <span className="font-semibold">{subscribers.length}</span>
            <span className="text-sm" style={{ color: COLORS.muted }}>
              subscribers
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
            }}
            className="rounded-xl overflow-hidden"
          >
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: COLORS.border }}
            >
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.text }}>
                <Mail size={18} style={{ color: COLORS.muted }} />
                Send Newsletter
              </h2>
            </div>
            <form onSubmit={handleSendNewsletter} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  style={{
                    background: COLORS.inputBg,
                    color: COLORS.text,
                    border: `1px solid ${COLORS.border}`,
                  }}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#E6A15E]/50 newsletter-input"
                  placeholder="ANIKA Newsletter – October 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: COLORS.text }}>
                  Message
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={10}
                  style={{
                    background: COLORS.inputBg,
                    color: COLORS.text,
                    border: `1px solid ${COLORS.border}`,
                  }}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm font-mono outline-none transition focus:ring-2 focus:ring-[#E6A15E]/50 newsletter-input"
                  placeholder="Hello subscribers! ..."
                  required
                />
                <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                  You can use plain text or HTML. We'll handle both.
                </p>
              </div>
              <button
                type="submit"
                disabled={sending || subscribers.length === 0}
                style={{
                  background: COLORS.buttonBg,
                  color: COLORS.buttonText,
                }}
                className="w-full rounded-lg py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
              >
                {sending ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                    SENDING...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    SEND TO {subscribers.length} SUBSCRIBER{subscribers.length !== 1 ? "S" : ""}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div
            style={{
              background: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
            }}
            className="rounded-xl overflow-hidden"
          >
            <div
              className="px-6 py-4 border-b flex justify-between items-center"
              style={{ borderColor: COLORS.border }}
            >
              <h2 className="text-lg font-bold" style={{ color: COLORS.text }}>
                Subscribers
              </h2>
              <button
                onClick={fetchSubscribers}
                className="text-xs font-medium hover:underline"
                style={{ color: COLORS.muted }}
              >
                Refresh
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {loading && (
                <div className="text-center py-4 text-sm" style={{ color: COLORS.muted }}>
                  Loading...
                </div>
              )}
              {!loading && loadError && (
                <div className="text-center py-4 text-sm" style={{ color: "#b23b3b" }}>
                  {loadError}
                </div>
              )}
              {!loading && !loadError && subscribers.length === 0 && (
                <div className="text-center py-4 text-sm" style={{ color: COLORS.muted }}>
                  No active subscribers yet.
                </div>
              )}
              {!loading &&
                !loadError &&
                subscribers.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                    }}
                    className="py-3 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: COLORS.text }}>
                          {sub.name || "Anonymous"}
                        </p>
                        <p className="text-xs" style={{ color: COLORS.muted }}>
                          {sub.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            background: "#2d7a43",
                            color: "#fff",
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        >
                          Active
                        </span>
                        <button
                          onClick={() => setDeactivateTarget(sub)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Deactivate subscriber"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: COLORS.muted }}>
                      Subscribed {new Date(sub.subscribed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deactivation confirmation modal */}
      <DeactivateConfirmModal
        subscriber={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        colors={COLORS}
      />
    </div>
  );
}