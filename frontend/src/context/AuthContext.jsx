import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setTokens, clearTokens } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try { if (localStorage.getItem('cv_access')) await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    const onForcedLogout = () => setUser(null);
    window.addEventListener('cv-logout', onForcedLogout);
    (async () => {
      if (localStorage.getItem('cv_access')) {
        try { setUser((await api('/auth/me')).user); } catch { clearTokens(); }
      }
      setLoading(false);
    })();
    return () => window.removeEventListener('cv-logout', onForcedLogout);
  }, []);

  const authenticate = async (path, body) => {
    const d = await api(path, { method: 'POST', body });
    setTokens(d.accessToken, d.refreshToken);
    setUser(d.user);
    return d.user;
  };
  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (form) => authenticate('/auth/register', form);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
