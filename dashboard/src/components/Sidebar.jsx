import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Map,
  Users,
  User,
  LogOut,
  Box,
  Flag,
  ShieldCheck,
} from 'lucide-react';

const SUPERADMIN_LINKS = [
  { to: '/espaces', icon: Map, labelKey: 'nav.spaces', id: 'nav-spaces' },
  { to: '/utilisateurs', icon: Users, labelKey: 'nav.users', id: 'nav-users' },
  { to: '/editeur-3d', icon: Box, labelKey: 'nav.editor3d', id: 'nav-editor-3d' },
  { to: '/configuration-karts', icon: Flag, labelKey: 'nav.kartsConfig', id: 'nav-karts' },
  { to: '/audit-logs', icon: ShieldCheck, labelKey: 'nav.auditLogs', id: 'nav-audit-logs' },
  { to: '/mon-profil', icon: User, labelKey: 'nav.myProfile', id: 'nav-profile' },
];

const STAFF_LINKS = [
  { to: '/mon-espace', icon: Map, labelKey: 'nav.mySpace', id: 'nav-my-space' },
  { to: '/editeur-3d', icon: Box, labelKey: 'nav.editor3d', id: 'nav-editor-3d' },
  { to: '/configuration-karts', icon: Flag, labelKey: 'nav.kartsConfig', id: 'nav-karts' },
  { to: '/audit-logs', icon: ShieldCheck, labelKey: 'nav.auditLogs', id: 'nav-audit-logs' },
  { to: '/mon-profil', icon: User, labelKey: 'nav.myProfile', id: 'nav-profile' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isGlobalAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ROOT';
  const links = isGlobalAdmin ? SUPERADMIN_LINKS : STAFF_LINKS;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.nom
    ? user.nom
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <aside className="w-[250px] min-h-screen bg-navy flex flex-col fixed top-0 start-0 z-30">
      {/* Logo / brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Hergla Park Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Hergla Park</p>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {links.map(({ to, icon: Icon, labelKey, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {labelKey.startsWith('nav.') ? t(labelKey) : labelKey}
          </NavLink>
        ))}
      </nav>

      {/* Footer: user info + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        {/* Role badge */}
        <div className="px-3 py-2 mb-3">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Role Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 text-xs font-semibold">{user?.role}</span>
          </div>
        </div>

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.nom || 'User'}</p>
            <p className="text-slate-400 text-xs">{t('common.version')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 transition-colors"
            title={t('common.logout')}
            id="sidebar-logout-btn"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
