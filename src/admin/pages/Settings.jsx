import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Building2,
  UserCircle,
  Bell,
  ShieldAlert,
  Check,
  Lock,
  Unlock,
  Filter,
  Users,
  HandCoins,
  FileText,
  AlertTriangle,
  Key,
  Loader2,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

// ---- API helpers -----------------------------------------------------
const API_BASE = (() => {
  const raw = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
})();

// Settings.jsx is not inside AuthContext, so it talks to the same
// storage AuthContext.jsx uses directly: one JSON blob under this key,
// shaped { user, token, refreshToken }. Keep this key and shape in sync
// with AuthContext.jsx / utils/auth.js if either ever changes.
const SESSION_KEY = "anika_admin_session";

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAuthToken() {
  return readSession()?.token || null;
}

function getRefreshToken() {
  return readSession()?.refreshToken || null;
}

function updateStoredAccessToken(newToken) {
  const session = readSession();
  if (!session) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, token: newToken }));
}

// Session is unrecoverable (no refresh token, or the refresh call itself
// failed). Clear it and tell AuthContext, the same way it already listens
// for this event — ProtectedRoute then redirects to /admin/login on its
// next render, same as a normal logout.
function clearSessionAndNotify() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("auth:unauthorized"));
}

// Refreshes the access token using the refresh token. Coalesces
// concurrent calls so a burst of 401s doesn't fire multiple refreshes.
let refreshInFlight = null;
async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.access_token) return null;
      updateStoredAccessToken(data.access_token);
      return data.access_token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function doFetch(path, options, token) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

async function apiFetch(path, options = {}) {
  let token = getAuthToken();
  let res = await doFetch(path, options, token);

  // Access token expired/invalid — try a silent refresh, then retry once.
  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(path, options, newToken);
    } else {
      clearSessionAndNotify();
    }
  } else if (res.status === 401) {
    // No refresh token available at all — nothing to retry with.
    clearSessionAndNotify();
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok) {
    const message = (body && body.error) || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return body;
}

// Same light/dark palette shape as Donations.jsx / Partners.jsx
const lightColors = {
  bg: "#fafaf8",
  border: "#e8e5df",
  text: "#1c1a17",
  muted: "#8c8579",
  panel: "#ffffff",
  panelAlt: "#faf8f2",
  green: "#3c8a4c",
  red: "#d24a42",
  buttonBg: "#1c1a17",
  buttonText: "#ffffff",
  inputBg: "#ffffff",
  inputPlaceholder: "#8c8579",
  warning: "#d97706",
  warningBg: "#fffbeb",
};

const darkColors = {
  bg: "#1a1a1a",
  border: "#3a3a3a",
  text: "#f0f0f0",
  muted: "#aaaaaa",
  panel: "#2a2a2a",
  panelAlt: "#242424",
  green: "#4c9a5c",
  red: "#d24a42",
  buttonBg: "#f0f0f0",
  buttonText: "#1a1a1a",
  inputBg: "#2a2a2a",
  inputPlaceholder: "#aaaaaa",
  warning: "#f59e0b",
  warningBg: "#3f2e1f",
};

function SectionCard({ icon: Icon, title, description, colors, children }) {
  return (
    <div
      style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
      className="rounded-xl overflow-hidden"
    >
      <div className="flex items-start gap-3 px-5 py-4 border-b" style={{ borderColor: colors.border }}>
        <div
          style={{ background: colors.panelAlt, color: colors.text }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        >
          <Icon size={16} />
        </div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: colors.text }}>
            {title}
          </h2>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, colors, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: colors.muted }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ colors, className = "", style, ...props }) {
  return (
    <input
      {...props}
      className={`settings-input px-3 py-2 rounded-lg text-sm outline-none w-full ${className}`}
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.inputBg,
        color: colors.text,
        ...style,
      }}
    />
  );
}

function PasswordInput({ colors, className = "", style, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput
        colors={colors}
        {...props}
        type={visible ? "text" : "password"}
        className={`pr-9 ${className}`}
        style={style}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2"
        style={{ color: colors.muted }}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Toggle({ checked, onChange, colors }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ background: checked ? colors.green : colors.border }}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
    >
      <span
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
      />
    </button>
  );
}

function ToggleRow({ label, sub, checked, onChange, colors }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold" style={{ color: colors.text }}>
          {label}
        </div>
        {sub && (
          <div className="text-xs mt-0.5" style={{ color: colors.muted }}>
            {sub}
          </div>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} colors={colors} />
    </div>
  );
}

function PasswordChangeConfirmModal({ isOpen, onClose, onConfirm, colors, isLoading }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(20,18,15,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Key size={20} color={colors.text} />
            <h2 className="font-bold text-lg" style={{ color: colors.text }}>
              Confirm password change
            </h2>
          </div>
          <p className="text-sm" style={{ color: colors.muted }}>
            You'll be signed out immediately after this and need to log back in
            with your new password. Continue?
          </p>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: colors.border }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-sm font-semibold px-3 py-2"
            style={{ color: colors.muted }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: colors.buttonBg,
              color: colors.buttonText,
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            className="text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
            Change password
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  colors,
  selectedData,
  onDataToggle,
}) {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    // Check if at least one data type is selected
    if (!selectedData.partners && !selectedData.donations && !selectedData.applications) {
      setPasswordError("Please select at least one data type to reset");
      return;
    }

    setIsLoading(true);
    try {
      setPasswordError("");
      await onConfirm(selectedData, password);
      onClose();
      setPassword("");
    } catch (error) {
      setPasswordError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(20,18,15,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.red}` }}
        className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} color={colors.red} />
            <h2 className="font-bold text-lg" style={{ color: colors.text }}>
              Reset Data Confirmation
            </h2>
          </div>
          
          <p className="text-sm" style={{ color: colors.muted }}>
            This action permanently clears selected data from the admin desk. 
            This cannot be undone.
          </p>

          {/* Data Selection */}
          <div className="mt-4">
            <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: colors.muted }}>
              <Filter size={14} />
              Select data to reset:
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedData.partners}
                  onChange={() => onDataToggle("partners")}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: colors.red }}
                />
                <span className="text-sm flex items-center gap-1.5" style={{ color: colors.text }}>
                  <Users size={14} />
                  Partners
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedData.donations}
                  onChange={() => onDataToggle("donations")}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: colors.red }}
                />
                <span className="text-sm flex items-center gap-1.5" style={{ color: colors.text }}>
                  <HandCoins size={14} />
                  Donations
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedData.applications}
                  onChange={() => onDataToggle("applications")}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: colors.red }}
                />
                <span className="text-sm flex items-center gap-1.5" style={{ color: colors.text }}>
                  <FileText size={14} />
                  Applications
                </span>
              </label>
            </div>
            {passwordError === "Please select at least one data type to reset" && (
              <p className="text-xs mt-1" style={{ color: colors.red }}>
                {passwordError}
              </p>
            )}
          </div>

          {/* Password Confirmation */}
          <div className="mt-4">
            <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: colors.muted }}>
              <Key size={14} />
              Enter admin password to confirm:
            </label>
            <PasswordInput
              colors={colors}
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder="Enter your admin password"
              className="mt-1"
              style={{
                borderColor: passwordError ? colors.red : colors.border,
                background: passwordError ? colors.warningBg : colors.inputBg,
              }}
            />
            {passwordError && (
              <p className="text-xs mt-1" style={{ color: colors.red }}>
                {passwordError}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: colors.border }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              setPassword("");
              setPasswordError("");
            }}
            className="text-sm font-semibold px-3 py-2"
            style={{ color: colors.muted }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              background: colors.red,
              color: "#fff",
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
            className="text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Resetting...
              </>
            ) : (
              "Yes, reset selected"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Result modal shown after a successful reset — same shell as Partners.jsx's
// DeleteConfirmModal (overlay, panel, header with X, footer button) instead
// of a native browser alert().
function ResetResultModal({ isOpen, onClose, result, colors }) {
  if (!isOpen || !result) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(20,18,15,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: colors.border }}>
          <h2 className="flex items-center gap-2 font-bold text-lg" style={{ color: colors.text }}>
            <CheckCircle2 size={18} color={colors.green} />
            Reset complete
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X size={18} color={colors.muted} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm" style={{ color: colors.text }}>
            <span className="font-bold">{result.types.join(", ")}</span> {result.types.length > 1 ? "were" : "was"} cleared from the admin desk.
          </p>
          {result.counts.length > 0 && (
            <ul className="text-xs space-y-1" style={{ color: colors.muted }}>
              {result.counts.map(({ label, count }) => (
                <li key={label}>
                  {count} {label} record{count === 1 ? "" : "s"} deleted
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end p-4 border-t" style={{ borderColor: colors.border }}>
          <button
            type="button"
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
  
export default function Settings() {
  const { theme } = useOutletContext();
  const COLORS = theme === "dark" ? darkColors : lightColors;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [org, setOrg] = useState({
    name: "ANIKA Initiative",
    email: "hello@anikainitiative.org",
    phone: "+254 700 000 000",
  });

  const [account, setAccount] = useState({
    name: "Admin",
    email: "admin@anikainitiative.org",
    currentPassword: "",
    password: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    donationAlerts: true,
    applicationAlerts: true,
    weeklyDigest: false,
    whatsappAlerts: true,
  });

  const [zoneUnlocked, setZoneUnlocked] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [selectedData, setSelectedData] = useState({
    partners: true,
    donations: true,
    applications: true,
  });

  // Load current settings from the backend on mount.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    const loadSettings = async () => {
      try {
        const data = await apiFetch("/settings");
        if (cancelled || !data) return;
        
        // Update org data
        if (data.org) {
          setOrg((prev) => ({ 
            ...prev, 
            name: data.org.name || prev.name,
            email: data.org.email || prev.email,
            phone: data.org.phone || prev.phone,
          }));
        }
        
        // Update notification preferences
        if (data.notifications) {
          setNotifications((prev) => ({ 
            ...prev, 
            ...data.notifications 
          }));
        }
        
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          if (err.status === 401) {
            // apiFetch already tried a silent token refresh before this
            // error surfaced, so a 401 here means the session is genuinely
            // gone. It has also already dispatched auth:unauthorized, so
            // ProtectedRoute is about to redirect to /admin/login — this
            // message just covers the brief moment before that happens.
            setLoadError("Your session has expired. Redirecting to login…");
          } else {
            setLoadError(err.message || "Failed to load settings. Please try again.");
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleDataSelection(type) {
    setSelectedData((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }

  function closeConfirm() {
    setConfirmReset(false);
    setSelectedData({
      partners: true,
      donations: true,
      applications: true,
    });
  }

  async function doReset(selectedTypes, password) {
    const result = await apiFetch("/settings/reset", {
      method: "POST",
      body: JSON.stringify({ password, types: selectedTypes }),
    });

    const types = [];
    if (selectedTypes.partners) types.push("Partners");
    if (selectedTypes.donations) types.push("Donations");
    if (selectedTypes.applications) types.push("Applications");

    const counts = result?.deleted
      ? Object.entries(result.deleted).map(([label, count]) => ({ label, count }))
      : [];

    closeConfirm();
    setZoneUnlocked(false);
    setResetResult({ types, counts });
  }

  function handleSaveClick(e) {
    e.preventDefault();
    setSaveError("");
    setSaved(false);

    if (account.password && account.password !== account.confirm) {
      setSaveError("New password and confirmation don't match.");
      return;
    }
    if (account.password && !account.currentPassword) {
      setSaveError("Enter your current password to set a new one.");
      return;
    }

    // Password changes go through a confirmation modal first — org and
    // notification-only saves proceed immediately, same as before.
    if (account.password) {
      setShowPasswordConfirm(true);
      return;
    }

    performSave();
  }

  async function performSave() {
    const isPasswordChange = Boolean(account.password);
    setShowPasswordConfirm(false);
    setIsSaving(true);
    try {
      await Promise.all([
        apiFetch("/settings/org", {
          method: "PUT",
          body: JSON.stringify(org),
        }),
        apiFetch("/settings/notifications", {
          method: "PUT",
          body: JSON.stringify(notifications),
        }),
        (account.name || account.email || account.password)
          ? apiFetch("/settings/account", {
              method: "PUT",
              body: JSON.stringify({
                name: account.name,
                email: account.email,
                ...(account.password
                  ? { password: account.password, currentPassword: account.currentPassword }
                  : {}),
              }),
            })
          : Promise.resolve(),
      ]);

      setAccount((prev) => ({ ...prev, currentPassword: "", password: "", confirm: "" }));

      if (isPasswordChange) {
        // Password changed on the backend — the old token/session is stale
        // by design. Force a fresh login rather than silently continuing
        // on a session tied to the now-old password.
        clearSessionAndNotify();
        return;
      }

      setSaved(true);
      setSaveError("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateOrg(key, value) {
    setOrg((prev) => ({ ...prev, [key]: value }));
  }

  function updateAccount(key, value) {
    setAccount((prev) => ({ ...prev, [key]: value }));
  }

  function toggleNotification(key, value) {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  }

  // Show loading spinner while fetching settings
  if (isLoading) {
    return (
      <div 
        style={{ background: COLORS.bg, minHeight: "100%" }} 
        className="p-6 font-sans rounded-lg flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: COLORS.muted }} />
          <p style={{ color: COLORS.muted }} className="text-sm">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100%" }} className="p-6 font-sans rounded-lg">
      <style>{`
        .settings-input::placeholder {
          color: ${COLORS.inputPlaceholder};
          opacity: 1;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Manage organisation, account and notification preferences.
          </p>
        </div>
        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          style={{
            background: COLORS.buttonBg,
            color: COLORS.buttonText,
            opacity: isSaving ? 0.6 : 1,
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
          className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-opacity"
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              SAVING...
            </>
          ) : saved ? (
            <>
              <Check size={14} />
              SAVED
            </>
          ) : (
            "SAVE CHANGES"
          )}
        </button>
      </div>

      {loadError && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: COLORS.warningBg, color: COLORS.warning }}
        >
          <AlertTriangle size={16} />
          {loadError}
        </div>
      )}
      {saveError && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: COLORS.warningBg, color: COLORS.red }}
        >
          <AlertTriangle size={16} />
          {saveError}
        </div>
      )}

      <form onSubmit={handleSaveClick} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          icon={Building2}
          title="Organisation profile"
          description="Public details shown across the site and receipts."
          colors={COLORS}
        >
          <Field label="Organisation name" colors={COLORS}>
            <TextInput
              colors={COLORS}
              value={org.name}
              onChange={(e) => updateOrg("name", e.target.value)}
              placeholder="e.g. ANIKA Initiative"
            />
          </Field>
          <Field label="Contact email" colors={COLORS}>
            <TextInput
              colors={COLORS}
              type="email"
              value={org.email}
              onChange={(e) => updateOrg("email", e.target.value)}
              placeholder="hello@organisation.org"
            />
          </Field>
          <Field label="Contact phone" colors={COLORS}>
            <TextInput
              colors={COLORS}
              value={org.phone}
              onChange={(e) => updateOrg("phone", e.target.value)}
              placeholder="+254 7•• ••• •••"
            />
          </Field>
        </SectionCard>

        <SectionCard
          icon={UserCircle}
          title="Admin account"
          description="Your login details for the admin desk."
          colors={COLORS}
        >
          <Field label="Full name" colors={COLORS}>
            <TextInput
              colors={COLORS}
              value={account.name}
              onChange={(e) => updateAccount("name", e.target.value)}
              placeholder="e.g. Jane W."
            />
          </Field>
          <Field label="Email" colors={COLORS}>
            <TextInput
              colors={COLORS}
              type="email"
              value={account.email}
              onChange={(e) => updateAccount("email", e.target.value)}
              placeholder="you@anikainitiative.org"
            />
          </Field>
          <Field label="Current password" colors={COLORS}>
            <PasswordInput
              colors={COLORS}
              value={account.currentPassword}
              onChange={(e) => updateAccount("currentPassword", e.target.value)}
              placeholder="Required to change your password"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="New password" colors={COLORS}>
              <PasswordInput
                colors={COLORS}
                value={account.password}
                onChange={(e) => updateAccount("password", e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Confirm password" colors={COLORS}>
              <PasswordInput
                colors={COLORS}
                value={account.confirm}
                onChange={(e) => updateAccount("confirm", e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={Bell}
          title="Notifications"
          description="Choose what the admin desk alerts you about."
          colors={COLORS}
        >
          <ToggleRow
            label="New donation alerts"
            sub="Ping when an M-Pesa donation comes in"
            checked={notifications.donationAlerts}
            onChange={(v) => toggleNotification("donationAlerts", v)}
            colors={COLORS}
          />
          <ToggleRow
            label="New application alerts"
            sub="Ping when someone applies to a programme"
            checked={notifications.applicationAlerts}
            onChange={(v) => toggleNotification("applicationAlerts", v)}
            colors={COLORS}
          />
          <ToggleRow
            label="WhatsApp alerts"
            sub="Forward key alerts to the admin WhatsApp line"
            checked={notifications.whatsappAlerts}
            onChange={(v) => toggleNotification("whatsappAlerts", v)}
            colors={COLORS}
          />
          <ToggleRow
            label="Weekly digest"
            sub="A Monday summary of the week's activity"
            checked={notifications.weeklyDigest}
            onChange={(v) => toggleNotification("weeklyDigest", v)}
            colors={COLORS}
          />
        </SectionCard>

        <SectionCard
          icon={ShieldAlert}
          title="Danger zone"
          description="These actions are hard to undo."
          colors={COLORS}
        >
          <div
            style={{ borderColor: COLORS.red }}
            className="rounded-lg border overflow-hidden"
          >
            <div
              className="flex items-center justify-between gap-4 p-4"
              style={{ borderBottom: zoneUnlocked ? `1px solid ${COLORS.red}` : "none" }}
            >
              <div className="flex items-center gap-2.5">
                {zoneUnlocked ? (
                  <Unlock size={15} color={COLORS.red} />
                ) : (
                  <Lock size={15} color={COLORS.muted} />
                )}
                <div>
                  <div className="text-sm font-semibold" style={{ color: COLORS.text }}>
                    {zoneUnlocked ? "Danger zone unlocked" : "Danger zone locked"}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
                    {zoneUnlocked
                      ? "Destructive actions are now visible below."
                      : "Unlock to reveal destructive actions."}
                  </div>
                </div>
              </div>
              <Toggle checked={zoneUnlocked} onChange={setZoneUnlocked} colors={COLORS} />
            </div>

            {zoneUnlocked && (
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: COLORS.text }}>
                      Reset admin data
                    </div>
                    <div className="text-xs mt-0.5 max-w-xs" style={{ color: COLORS.muted }}>
                      Select specific data types to clear from the admin desk. This cannot be undone.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    style={{ background: COLORS.red, color: "#fff" }}
                    className="text-xs font-bold tracking-wide px-4 py-2.5 rounded-lg shrink-0 hover:opacity-90 transition-opacity"
                  >
                    RESET SELECTED
                  </button>
                </div>

                {/* Quick filter options */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedData({
                      partners: true,
                      donations: false,
                      applications: false,
                    })}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                      background: selectedData.partners && !selectedData.donations && !selectedData.applications 
                        ? COLORS.panelAlt 
                        : "transparent",
                    }}
                    className="text-xs px-3 py-1 rounded-full hover:border-current transition-colors"
                  >
                    <Users size={12} className="inline mr-1" />
                    Partners only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedData({
                      partners: false,
                      donations: true,
                      applications: false,
                    })}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                      background: !selectedData.partners && selectedData.donations && !selectedData.applications 
                        ? COLORS.panelAlt 
                        : "transparent",
                    }}
                    className="text-xs px-3 py-1 rounded-full hover:border-current transition-colors"
                  >
                    <HandCoins size={12} className="inline mr-1" />
                    Donations only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedData({
                      partners: false,
                      donations: false,
                      applications: true,
                    })}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                      background: !selectedData.partners && !selectedData.donations && selectedData.applications 
                        ? COLORS.panelAlt 
                        : "transparent",
                    }}
                    className="text-xs px-3 py-1 rounded-full hover:border-current transition-colors"
                  >
                    <FileText size={12} className="inline mr-1" />
                    Applications only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedData({
                      partners: true,
                      donations: true,
                      applications: true,
                    })}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                      background: selectedData.partners && selectedData.donations && selectedData.applications 
                        ? COLORS.panelAlt 
                        : "transparent",
                    }}
                    className="text-xs px-3 py-1 rounded-full hover:border-current transition-colors"
                  >
                    <Filter size={12} className="inline mr-1" />
                    All data
                  </button>
                </div>

                {/* Status indicators */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {selectedData.partners && (
                    <span className="flex items-center gap-1" style={{ color: COLORS.text }}>
                      <Users size={12} /> Partners
                    </span>
                  )}
                  {selectedData.donations && (
                    <span className="flex items-center gap-1" style={{ color: COLORS.text }}>
                      <HandCoins size={12} /> Donations
                    </span>
                  )}
                  {selectedData.applications && (
                    <span className="flex items-center gap-1" style={{ color: COLORS.text }}>
                      <FileText size={12} /> Applications
                    </span>
                  )}
                  {!selectedData.partners && !selectedData.donations && !selectedData.applications && (
                    <span style={{ color: COLORS.warning }}>⚠️ No data selected</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </form>

      <PasswordChangeConfirmModal
        isOpen={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={performSave}
        colors={COLORS}
        isLoading={isSaving}
      />

      <ResetConfirmModal
        isOpen={confirmReset}
        onClose={closeConfirm}
        onConfirm={doReset}
        colors={COLORS}
        selectedData={selectedData}
        onDataToggle={toggleDataSelection}
      />

      <ResetResultModal
        isOpen={!!resetResult}
        onClose={() => setResetResult(null)}
        result={resetResult}
        colors={COLORS}
      />
    </div>
  );
}