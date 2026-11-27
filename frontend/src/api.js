// Fetch API wrapper: attaches the access token and silently refreshes it once on 401
export const BASE = import.meta.env.VITE_API_URL || '';
const tokens = () => ({ access: localStorage.getItem('cv_access'), refresh: localStorage.getItem('cv_refresh') });
export const setTokens = (a, r) => { localStorage.setItem('cv_access', a); localStorage.setItem('cv_refresh', r); };
export const clearTokens = () => { localStorage.removeItem('cv_access'); localStorage.removeItem('cv_refresh'); };

const raw = (path, method, body, token) =>
  fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

let refreshing = null;
async function refreshAccess() {
  const { refresh } = tokens();
  if (!refresh) throw new Error('No refresh token');
  const res = await raw('/auth/refresh', 'POST', { refreshToken: refresh });
  if (!res.ok) throw new Error('Session expired');
  const d = await res.json();
  setTokens(d.accessToken, d.refreshToken);
  return d.accessToken;
}

export async function api(path, { method = 'GET', body } = {}) {
  let res = await raw(path, method, body, tokens().access);
  if (res.status === 401 && tokens().refresh && !path.startsWith('/auth/login') && !path.startsWith('/auth/refresh')) {
    try {
      refreshing = refreshing || refreshAccess();
      const t = await refreshing;
      res = await raw(path, method, body, t);
    } catch {
      clearTokens();
      window.dispatchEvent(new Event('cv-logout'));
    } finally {
      refreshing = null;
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.errors ? ': ' + data.errors.map((e) => e.message).join(', ') : '';
    throw new Error((data.message || 'Request failed') + detail);
  }
  return data;
}
