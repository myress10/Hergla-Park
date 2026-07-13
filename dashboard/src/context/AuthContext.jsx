import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi } from '../api/authApi';

const AuthContext = createContext(null);

const ROLE_DEFAULT_ROUTES = {
  SUPERADMIN: '/espaces',
  ADMIN: '/mon-espace',
  EMPLOYE: '/mon-espace',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('hergla_token');
    const storedUser = localStorage.getItem('hergla_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('hergla_token');
        localStorage.removeItem('hergla_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password, remember = false) => {
    const response = await loginApi(email, password);

    // Backend returns { success, data, token }
    const responseBody = response.data;
    const userData = responseBody.data;
    const jwtToken = responseBody.token;

    if (!userData || !jwtToken) {
      throw new Error('Réponse inattendue du serveur');
    }

    setToken(jwtToken);
    setUser(userData);

    // Always persist in localStorage for interceptor use; clear on logout if not "remember"
    localStorage.setItem('hergla_token', jwtToken);
    localStorage.setItem('hergla_user', JSON.stringify(userData));
    if (!remember) {
      // Mark as session-only so we can clear on tab close (best effort)
      sessionStorage.setItem('hergla_session_only', 'true');
    }

    return userData;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hergla_token');
    localStorage.removeItem('hergla_user');
    sessionStorage.removeItem('hergla_session_only');
  }, []);

  const getDefaultRoute = useCallback((role) => {
    return ROLE_DEFAULT_ROUTES[role] || '/mon-espace';
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, getDefaultRoute }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
