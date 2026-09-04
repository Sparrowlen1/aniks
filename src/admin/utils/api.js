const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'anika_admin_session';

function getSession() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveAccessToken(newAccessToken) {
  const session = getSession();
  if (!session) return;
  session.token = newAccessToken;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('auth:unauthorized'));
}

let refreshPromise = null;

async function refreshAccessToken() {
  const session = getSession();
  if (!session?.refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.refreshToken}` },
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        return data?.access_token || null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/**
 * apiRequest – authenticated fetch with token refresh and FormData support.
 */
export async function apiRequest(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const isFormData = body instanceof FormData;

  const doFetch = async () => {
    const session = getSession();
    const token = session?.token;

    const requestHeaders = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    const requestBody = isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
      ...rest,
    });

    const data = await response.json().catch(() => null);
    return { response, data };
  };

  let { response, data } = await doFetch();

  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      saveAccessToken(newAccessToken);
      ({ response, data } = await doFetch());
    } else {
      clearSession();
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}