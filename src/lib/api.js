/* ============================================================
   ANIKA - API client
   Talks to the backend (Server) when it is running. If the API
   is unreachable, submissions transparently fall back to the
   local store so the product works end-to-end in demo mode.

   Expected backend contract (REST):
     POST /api/registrations
     POST /api/applications
     POST /api/donations
     POST /api/inquiries
     GET  /api/metrics
   ============================================================ */

import { addRecord, getRecords, updateRecord, deleteRecord, getMetrics } from './store';

// --- Use VITE_API_BASE_URL (e.g., http://localhost:5000), without trailing slash.
// If not defined, default to localhost:5000 so team members don't need a .env file.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// kind -> REST collection path (API prefix added in submit)
const KIND_COLLECTION = {
  registration: 'registrations',
  application: 'applications',
  donation: 'donations',
  inquiry: 'inquiries',
  event: 'events',
  whatsappInbox: 'whatsapp-inbox',
  whatsappBroadcast: 'whatsapp-broadcasts',
  whatsappSettings: 'whatsapp-settings',
  team: 'team',
};
const COLLECTION_KIND = Object.fromEntries(
  Object.entries(KIND_COLLECTION).map(([k, v]) => [v, k])
);

// --- Auth ---
// Public forms (registration/donation/inquiry) call this with no session —
// token is only attached when one exists, so they're unaffected.
const SESSION_KEY = 'anika_admin_session';

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

// Only clears if a session existed — avoids false logout events for anonymous callers.
function clearSessionAndNotify() {
  if (!readSession()) return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('auth:unauthorized'));
}

// Coalesces concurrent refresh calls.
let refreshInFlight = null;
async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

async function doRequest(method, path, body, token, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request(method, path, body, timeoutMs = 4000) {
  const token = getAuthToken();
  let res = await doRequest(method, path, body, token, timeoutMs);

  if (res.status === 401) {
    if (getRefreshToken()) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        res = await doRequest(method, path, body, newToken, timeoutMs);
      } else {
        clearSessionAndNotify();
      }
    } else {
      clearSessionAndNotify();
    }
  }

  if (!res.ok) throw new Error(`API ${path} responded ${res.status}`);
  return await res.json();
}

// kind -> local store collection name
const STORE_COLLECTION = {
  registration: 'registrations',
  application: 'applications',
  donation: 'donations',
  inquiry: 'inquiries',
  event: 'events',
  whatsappInbox: 'whatsAppInbox',
  whatsappBroadcast: 'whatsAppBroadcasts',
  whatsappSettings: 'whatsAppSettings',
  team: 'team',
};

/** Fetch a collection. API-first, falls back to local store. */
export async function fetchCollection(kind) {
  try {
    const rows = await request('GET', `/api/${KIND_COLLECTION[kind]}`);
    return { ok: true, source: 'api', rows };
  } catch {
    return { ok: true, source: 'local', rows: getRecords(STORE_COLLECTION[kind]) };
  }
}

/** Create a record. API-first, falls back to local store. */
async function submit(kind, payload) {
  try {
    const path = `/api/${KIND_COLLECTION[kind]}`;
    const data = await request('POST', path, payload);
    return { ok: true, source: 'api', record: data };
  } catch {
    const record = addRecord(STORE_COLLECTION[kind], payload);
    return { ok: true, source: 'local', record };
  }
}

/** Update a record. API-first, falls back to local store. */
export async function patchRecord(kind, id, patch) {
  try {
    const data = await request('PATCH', `/api/${KIND_COLLECTION[kind]}/${id}`, patch);
    return { ok: true, source: 'api', record: data };
  } catch {
    const record = updateRecord(STORE_COLLECTION[kind], id, patch);
    return { ok: true, source: 'local', record };
  }
}

/** Delete a record. API-first, falls back to local store. */
export async function removeRecord(kind, id) {
  try {
    await request('DELETE', `/api/${KIND_COLLECTION[kind]}/${id}`);
    return { ok: true, source: 'api' };
  } catch {
    deleteRecord(STORE_COLLECTION[kind], id);
    return { ok: true, source: 'local' };
  }
}

// --- creation helpers ---
export function submitRegistration(payload) {
  return submit('registration', payload);
}
export function submitApplication(payload) {
  return submit('application', payload);
}
export function submitDonation(payload) {
  return submit('donation', payload);
}
export function submitInquiry(payload) {
  return submit('inquiry', payload);
}

// --- collection helpers ---
export function fetchEvents() {
  return fetchCollection('event');
}
export async function fetchPublicEvents() {
  try {
    // --- UPDATED: include /api prefix for public events ---
    const rows = await request('GET', '/api/events?public=1');
    return { ok: true, source: 'api', rows };
  } catch {
    return { ok: true, source: 'local', rows: getRecords(STORE_COLLECTION.event) };
  }
}
export function fetchWhatsAppInbox() {
  return fetchCollection('whatsappInbox');
}
export function fetchWhatsAppBroadcasts() {
  return fetchCollection('whatsappBroadcast');
}
export function addEvent(payload) {
  return submit('event', payload);
}
export function addWhatsAppBroadcast(payload) {
  return submit('whatsappBroadcast', payload);
}
export function updateEvent(id, patch) {
  return patchRecord('event', id, patch);
}
export function deleteEvent(id) {
  return removeRecord('event', id);
}
export function updateWhatsAppMessage(id, patch) {
  return patchRecord('whatsappInbox', id, patch);
}

export function fetchWhatsAppSettings() {
  return fetchCollection('whatsappSettings').then((res) => {
    // Backend returns a single settings object; normalise to an array.
    if (res.rows && !Array.isArray(res.rows)) res.rows = [res.rows];
    return res;
  });
}
export function addWhatsAppSettings(payload) {
  return submit('whatsappSettings', payload);
}
export function updateWhatsAppSettings(id, patch) {
  return patchRecord('whatsappSettings', id, patch);
}

/** Aggregate WhatsApp live-state (shared across Assistant / Inbox / Broadcast). */
export async function fetchWhatsAppStats() {
  try {
    const stats = await request('GET', '/api/whatsapp/stats');
    return stats;
  } catch {
    const { rows } = await fetchCollection('whatsappInbox');
    const list = Array.isArray(rows) ? rows : [];
    return {
      threads: list.length,
      optedOut: list.filter((c) => c.optedOut).length,
      escalated: list.filter((c) => c.intent === 'escalation' && !c.resolved).length,
      unread: list.reduce((sum, c) => sum + (c.unread || 0), 0),
    };
  }
}

/**
 * Run the real Anika Assistant bot engine on a visitor message (live test).
 * The backend builds a synthetic Meta payload so the exact production logic
 * (FAQ menu, HELP escalation, STOP opt-out, re-subscribe) processes it, and
 * the resulting thread lands in the shared inbox.
 */
export async function simulateWhatsAppMessage({ name, phone, message }) {
  const data = await request('POST', '/api/whatsapp/simulate', { name, phone, message }, 8000);
  return data;
}

/** Whether the WhatsApp Cloud API is configured for real sends or simulated. */
export async function fetchWhatsAppStatus() {
  try {
    const status = await request('GET', '/api/whatsapp/status');
    if (!status?.configured && !status?.simulated) status.simulated = true;
    return status;
  } catch {
    return { configured: false, tokenSet: false, phoneIdSet: false, verifyTokenSet: false, simulated: true };
  }
}

export function fetchRegistrations() {
  return fetchCollection('registration');
}
export function updateRegistration(id, patch) {
  return patchRecord('registration', id, patch);
}
export function deleteRegistration(id) {
  return removeRecord('registration', id);
}

export function fetchApplications() {
  return fetchCollection('application');
}
export function updateApplication(id, patch) {
  return patchRecord('application', id, patch);
}
export function deleteApplication(id) {
  return removeRecord('application', id);
}

export function fetchDonations() {
  return fetchCollection('donation');
}
export function updateDonation(id, patch) {
  return patchRecord('donation', id, patch);
}
export function deleteDonation(id) {
  return removeRecord('donation', id);
}

/** Normalizes backend (donor/created_at) vs local (name/createdAt) donation shapes. */
export function normalizeDonation(d) {
  return {
    id: d.id,
    name: d.donor ?? d.name ?? 'Anonymous',
    amount: Number(d.amount) || 0,
    currency: d.currency ?? 'KES',
    method: d.method ?? 'manual',
    status: d.status ?? 'Completed',
    createdAt: d.created_at ?? d.createdAt ?? null,
  };
}

// --- Team ---
export function fetchTeam() {
  return fetchCollection('team');
}
export function addTeamMember(payload) {
  return submit('team', payload);
}
export function updateTeamMember(id, patch) {
  return patchRecord('team', id, patch);
}
export function deleteTeamMember(id) {
  return removeRecord('team', id);
}

export async function fetchMetrics() {
  try {
    return await request('GET', '/metrics');
  } catch {
    return getMetrics();
  }
}

export { COLLECTION_KIND };