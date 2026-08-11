import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import LangSwitcher from '../components/LangSwitcher';
import { Bell, Building, Globe, UserCircle2, Search } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const PAGE_TITLES = {
  '/espaces': 'nav.spaces',
  '/mon-espace': 'nav.mySpace',
  '/utilisateurs': 'nav.users',
  '/mon-profil': 'nav.myProfile',
  '/editeur-3d': 'nav.editor3d',
  '/configuration-karts': 'Configuration Karts',
  '/audit-logs': "Logs d'Audit",
};

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { user, availableCompanies, activeCompanyId, switchCompany } = useAuth();
  const location = useLocation();

  // Dynamic Title Determination
  let pageTitle = 'Piste Karting';
  if (location.pathname.startsWith('/espaces/')) {
    pageTitle = 'Piste Karting';
  } else if (PAGE_TITLES[location.pathname]) {
    pageTitle = t(PAGE_TITLES[location.pathname]);
  } else if (location.pathname === '/mon-espace') {
    pageTitle = 'Piste Karting';
  }

  const handleCompanyChange = async (e) => {
    const newCompanyId = e.target.value;
    if (newCompanyId === activeCompanyId) return;
    try {
      const comp = await switchCompany(newCompanyId);
      toast.success(`Entreprise active : ${comp.nom}`);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la bascule d\'entreprise');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 ms-[250px] flex flex-col min-h-screen">
        {/* Topbar matching screen.jpg benchmark */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 sm:px-8 py-3 flex items-center justify-between shadow-sm">
          {/* Universal Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Search size={15} className="absolute start-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                className="bg-slate-100/80 text-slate-800 text-xs font-medium rounded-xl ps-9 pe-4 py-2 w-64 sm:w-80 border border-slate-200/50 focus:border-slate-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                id="topbar-search-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            {/* Multi-Company Selector */}
            {availableCompanies && availableCompanies.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700">
                <Building size={14} className="text-navy" />
                <select
                  value={activeCompanyId || ''}
                  onChange={handleCompanyChange}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer text-slate-700"
                  id="company-switcher-select"
                >
                  {availableCompanies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Language Switcher (FR / AR Minimalist Tab) */}
            <LangSwitcher variant="minimal" />

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Global Settings / Web Icon */}
            <button
              type="button"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              id="topbar-global-btn"
              title="Paramètres Globaux"
            >
              <Globe size={18} />
            </button>

            {/* Notification Bell with Red Badge Dot */}
            <button
              type="button"
              className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              id="topbar-notifications-btn"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* User Profile Info Pill */}
            <div className="flex items-center gap-2.5">
              <div className="text-end hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.nom || 'Admin User'}
                </p>
                <p className="text-[10px] font-medium text-slate-400">
                  {user?.role === 'SUPERADMIN' ? 'System Master' : user?.role === 'ROOT' ? 'Root Controller' : user?.role || 'User'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-slate-100">
                {user?.nom ? user.nom.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 sm:p-8">
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
