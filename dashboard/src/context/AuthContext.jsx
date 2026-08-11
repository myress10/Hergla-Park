import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, switchCompany as switchCompanyApi } from '../api/authApi';

const AuthContext = createContext(null);

const ROLE_DEFAULT_ROUTES = {
  ROOT: '/espaces',
  SUPERADMIN: '/espaces',
  ADMIN: '/mon-espace',
  EMPLOYE: '/mon-espace',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('hergla_token');
    const storedUser = localStorage.getItem('hergla_user');
    const storedCompanies = localStorage.getItem('hergla_companies');
    const storedActiveCompanyId = localStorage.getItem('hergla_active_company_id');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedCompanies) setAvailableCompanies(JSON.parse(storedCompanies));
        if (storedActiveCompanyId) setActiveCompanyId(storedActiveCompanyId);
      } catch {
        localStorage.removeItem('hergla_token');
        localStorage.removeItem('hergla_user');
        localStorage.removeItem('hergla_companies');
        localStorage.removeItem('hergla_active_company_id');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password, remember = false) => {
    const response = await loginApi(email, password);

    // Backend returns { success, data, token, activeCompanyId, availableCompanies }
    const responseBody = response.data;
    const userData = responseBody.data;
    const jwtToken = responseBody.token;
    const companies = responseBody.availableCompanies || [];
    const activeId = responseBody.activeCompanyId || userData.companyId;

    if (!userData || !jwtToken) {
      throw new Error('Réponse inattendue du serveur');
    }

    setToken(jwtToken);
    setUser(userData);
    setAvailableCompanies(companies);
    setActiveCompanyId(activeId);

    // Always persist in localStorage for interceptor use
    localStorage.setItem('hergla_token', jwtToken);
    localStorage.setItem('hergla_user', JSON.stringify(userData));
    localStorage.setItem('hergla_companies', JSON.stringify(companies));
    if (activeId) localStorage.setItem('hergla_active_company_id', activeId);

    if (!remember) {
      sessionStorage.setItem('hergla_session_only', 'true');
    }

    return userData;
  }, []);

  const switchCompany = useCallback(async (companyId) => {
    const response = await switchCompanyApi(companyId);
    const { token: newToken, activeCompanyId: newActiveId, company } = response.data;

    setToken(newToken);
    setActiveCompanyId(newActiveId);
    setUser((prev) => (prev ? { ...prev, companyId: newActiveId } : prev));

    localStorage.setItem('hergla_token', newToken);
    localStorage.setItem('hergla_active_company_id', newActiveId);
    if (user) {
      localStorage.setItem('hergla_user', JSON.stringify({ ...user, companyId: newActiveId }));
    }
    return company;
  }, [user]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAvailableCompanies([]);
    setActiveCompanyId(null);
    localStorage.removeItem('hergla_token');
    localStorage.removeItem('hergla_user');
    localStorage.removeItem('hergla_companies');
    localStorage.removeItem('hergla_active_company_id');
    sessionStorage.removeItem('hergla_session_only');
  }, []);

  const getDefaultRoute = useCallback((role) => {
    return ROLE_DEFAULT_ROUTES[role] || '/mon-espace';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        availableCompanies,
        activeCompanyId,
        loading,
        login,
        switchCompany,
        logout,
        getDefaultRoute,
      }}
    >
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
