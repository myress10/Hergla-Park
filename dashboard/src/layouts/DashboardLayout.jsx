import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import LangSwitcher from '../components/LangSwitcher';
import { Bell, User } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const PAGE_TITLES = {
  '/espaces': 'nav.spaces',
  '/mon-espace': 'nav.mySpace',
  '/utilisateurs': 'nav.users',
  '/mon-profil': 'nav.myProfile',
};

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const titleKey = PAGE_TITLES[location.pathname] || 'nav.dashboard';

  const initials = user?.nom
    ? user.nom.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar />

      {/* Main content — offset by sidebar width, RTL-compatible */}
      <div className="flex-1 ms-[250px] flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-slate-700 text-sm">{t(titleKey)}</h1>
            <span className="text-slate-300">|</span>
            <LangSwitcher variant="toggle" />
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
              id="topbar-notifications-btn"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-700 leading-tight">{user?.nom}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Global toast notifications */}
      <Toaster
        position="top-end"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}
