import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import Sidebar from '../components/Sidebar';
import LangSwitcher from '../components/LangSwitcher';
import {
  Bell,
  Building,
  Globe,
  Search,
  X,
  CheckCheck,
  LogOut,
  User,
  Key,
  Settings,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Info,
  AlertTriangle,
  Lock,
  Unlock,
  RotateCcw,
  Languages,
  Moon,
  Sun,
  ExternalLink,
  Trash2,
  Check,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const PAGE_TITLES = {
  '/espaces': 'nav.spaces',
  '/mon-espace': 'nav.mySpace',
  '/utilisateurs': 'nav.users',
  '/mon-profil': 'nav.myProfile',
  '/editeur-3d': 'nav.editor3d',
  '/configuration-karts': 'nav.kartsConfig',
  '/audit-logs': 'nav.auditLogs',
};

// Initial notification dataset
const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'warning',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    title: 'Tentative de connexion échouée',
    message: 'Compte h.karim@herglapark.tn — 3 tentatives bloquées.',
    time: 'Il y a 5 min',
    read: false,
  },
  {
    id: 'n2',
    type: 'info',
    icon: Info,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    title: 'Mise à jour des permissions',
    message: 'Mehdi Kolsi a mis à jour le rôle ADMIN pour Sonia Ben Romdhane.',
    time: 'Il y a 14 min',
    read: false,
  },
  {
    id: 'n3',
    type: 'success',
    icon: Check,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    title: '3 nouveaux employés assignés',
    message: 'Sonia Ben Romdhane a assigné 3 employés à la Zone Aquatique.',
    time: 'Il y a 2 h',
    read: false,
  },
  {
    id: 'n4',
    type: 'error',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    title: 'Audit de sécurité requis',
    message: 'Détection d\'une activité inhabituelle sur l\'espace Piste Karting.',
    time: 'Il y a 4 h',
    read: true,
  },
  {
    id: 'n5',
    type: 'info',
    icon: Info,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    title: 'Nouveau kart ajouté',
    message: 'Kart #24 ajouté à la flotte de la Piste Karting Principale.',
    time: 'Hier, 14:32',
    read: true,
  },
];

// Reusable hook: close dropdown when clicking outside
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { user, availableCompanies, activeCompanyId, switchCompany, logout } = useAuth();
  const { lang, switchLang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();

  // Dropdown open states
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Local settings state
  const [darkMode, setDarkMode] = useState(false);
  const [securityLock, setSecurityLock] = useState(
    () => localStorage.getItem('hergla_security_lock') === 'true'
  );
  const [autoAssign, setAutoAssign] = useState(
    () => localStorage.getItem('hergla_auto_assign') !== 'false'
  );

  // Notifications state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Dropdown refs for click-outside
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const settingsRef = useRef(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(settingsRef, () => setSettingsOpen(false));

  // Close others when one opens
  const openNotif = () => { setNotifOpen((v) => !v); setProfileOpen(false); setSettingsOpen(false); };
  const openProfile = () => { setProfileOpen((v) => !v); setNotifOpen(false); setSettingsOpen(false); };
  const openSettings = () => { setSettingsOpen((v) => !v); setNotifOpen(false); setProfileOpen(false); };

  // Notification actions
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismissNotif = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const markOneRead = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => { setNotifications([]); toast.success('Toutes les notifications effacées'); };

  // Settings toggles
  const toggleSecurityLock = () => {
    const next = !securityLock;
    setSecurityLock(next);
    localStorage.setItem('hergla_security_lock', String(next));
    toast(next ? '🔒 Verrouillage de sécurité activé' : '🔓 Verrouillage de sécurité désactivé', { icon: next ? '🔒' : '🔓' });
  };
  const toggleAutoAssign = () => {
    const next = !autoAssign;
    setAutoAssign(next);
    localStorage.setItem('hergla_auto_assign', String(next));
    toast(next ? 'Auto-assignation activée' : 'Auto-assignation désactivée');
  };

  // Logout
  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  // Company switch
  const handleCompanyChange = async (e) => {
    const newCompanyId = e.target.value;
    if (newCompanyId === activeCompanyId) return;
    try {
      const comp = await switchCompany(newCompanyId);
      toast.success(`Entreprise active : ${comp.nom}`);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la bascule d'entreprise");
    }
  };

  // Dynamic page title
  let pageTitle = 'Hergla Park';
  if (location.pathname.startsWith('/espaces/')) {
    pageTitle = 'Détail Espace';
  } else if (PAGE_TITLES[location.pathname]) {
    pageTitle = t(PAGE_TITLES[location.pathname]);
  }

  const initials = user?.nom
    ? user.nom.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'A';

  const roleLabel =
    user?.role === 'SUPERADMIN' ? 'System Master'
    : user?.role === 'ROOT' ? 'Root Controller'
    : user?.role === 'ADMIN' ? 'Administrateur'
    : user?.role === 'EMPLOYE' ? 'Employé'
    : user?.role || 'Utilisateur';

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 ms-[250px] flex flex-col min-h-screen">

        {/* ─── TOPBAR ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 sm:px-8 py-3 flex items-center justify-between shadow-sm">

          {/* Universal Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <Search size={15} className="absolute start-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher…"
                className="bg-slate-100/80 text-slate-800 text-xs font-medium rounded-xl ps-9 pe-4 py-2 w-56 sm:w-72 border border-slate-200/50 focus:border-slate-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                id="topbar-search-input"
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
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
                    <option key={comp.id} value={comp.id}>{comp.nom}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Language Switcher */}
            <LangSwitcher variant="minimal" />

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* ── GLOBAL SETTINGS DROPDOWN ─────────────────────────── */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={openSettings}
                className={`p-1.5 rounded-lg transition-colors ${settingsOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                id="topbar-global-btn"
                title="Paramètres Globaux"
              >
                <Globe size={18} />
              </button>

              {settingsOpen && (
                <div className="absolute end-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={15} className="text-slate-600" />
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Paramètres Globaux</span>
                    </div>
                    <button onClick={() => setSettingsOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                      <X size={14} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="p-3 space-y-1">
                    {/* Language */}
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2 pt-1 pb-0.5">Langue</p>
                    <div className="flex gap-2 px-2 pb-2">
                      <button
                        onClick={() => { switchLang('fr'); toast.success('Langue changée : Français'); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${lang === 'fr' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        🇫🇷 Français
                      </button>
                      <button
                        onClick={() => { switchLang('ar'); toast.success('تم تغيير اللغة: العربية'); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${lang === 'ar' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        🇹🇳 العربية
                      </button>
                    </div>

                    <div className="border-t border-slate-100 my-1" />

                    {/* Security & System Toggles */}
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2 pt-1 pb-0.5">Sécurité & Système</p>

                    {/* Security Lock Toggle */}
                    <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        {securityLock ? <Lock size={14} className="text-slate-700" /> : <Unlock size={14} className="text-slate-400" />}
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Verrouillage de Sécurité</p>
                          <p className="text-[10px] text-slate-400">{securityLock ? 'Activé — accès restreint' : 'Désactivé'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleSecurityLock}
                        className={`w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0 ${securityLock ? 'bg-slate-900' : 'bg-slate-200'}`}
                        style={{ width: 40, height: 22 }}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white shadow transition-transform absolute top-[3px] ${securityLock ? 'translate-x-[20px]' : 'translate-x-[3px]'}`}
                        />
                      </button>
                    </div>

                    {/* Auto-Assign Toggle */}
                    <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <RotateCcw size={14} className={autoAssign ? 'text-emerald-600' : 'text-slate-400'} />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Auto-Assignation</p>
                          <p className="text-[10px] text-slate-400">{autoAssign ? 'Activé' : 'Désactivé'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAutoAssign}
                        className={`w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0 ${autoAssign ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        style={{ width: 40, height: 22 }}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white shadow transition-transform absolute top-[3px] ${autoAssign ? 'translate-x-[20px]' : 'translate-x-[3px]'}`}
                        />
                      </button>
                    </div>

                    <div className="border-t border-slate-100 my-1" />

                    {/* Quick Links */}
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2 pt-1 pb-0.5">Accès Rapide</p>

                    <Link
                      to="/audit-logs"
                      onClick={() => setSettingsOpen(false)}
                      className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck size={14} className="text-slate-500" />
                        <span className="text-xs font-semibold text-slate-700">Logs d'Audit</span>
                      </div>
                      <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </Link>

                    <Link
                      to="/utilisateurs"
                      onClick={() => setSettingsOpen(false)}
                      className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings size={14} className="text-slate-500" />
                        <span className="text-xs font-semibold text-slate-700">Gestion Utilisateurs</span>
                      </div>
                      <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </Link>
                  </div>

                  {/* Footer: App version */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-[10px] text-slate-400 font-medium">Hergla Park Dashboard v1.0 · Production</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── NOTIFICATIONS DROPDOWN ───────────────────────────── */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={openNotif}
                className={`relative p-1.5 rounded-lg transition-colors ${notifOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                id="topbar-notifications-btn"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 rounded-full bg-red-500 ring-2 ring-white flex items-center justify-center text-[9px] font-extrabold text-white px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute end-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-slate-600" />
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{unreadCount} nouvelles</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                          title="Tout marquer comme lu"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          title="Effacer tout"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                        <X size={14} className="text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={28} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs text-slate-400 font-medium">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon = notif.icon;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markOneRead(notif.id)}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${!notif.read ? 'bg-blue-50/40' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-xl ${notif.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <Icon size={14} className={notif.iconColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-bold ${notif.read ? 'text-slate-700' : 'text-slate-900'} truncate`}>
                                  {notif.title}
                                  {!notif.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 ms-1.5 mb-0.5 align-middle" />}
                                </p>
                                <button
                                  onClick={(e) => { e.stopPropagation(); dismissNotif(notif.id); }}
                                  className="p-0.5 hover:bg-slate-200 rounded text-slate-300 hover:text-slate-600 flex-shrink-0 transition-colors"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">{notif.time}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
                    <Link
                      to="/audit-logs"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Voir tout l'historique
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* ── PROFILE DROPDOWN ──────────────────────────────────── */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={openProfile}
                className={`flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-colors ${profileOpen ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
                id="topbar-profile-btn"
                title={`${user?.nom || 'Utilisateur'} — ${user?.role}`}
              >
                <div className="hidden sm:block text-end">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user?.nom || 'Admin User'}</p>
                  <p className="text-[10px] font-medium text-slate-400">{roleLabel}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-slate-100">
                  {initials}
                </div>
              </button>

              {profileOpen && (
                <div className="absolute end-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Info Header */}
                  <div className="px-4 py-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-extrabold text-sm ring-2 ring-white/30">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm leading-tight truncate">{user?.nom || 'Admin User'}</p>
                        <p className="text-[11px] text-slate-300 truncate">{user?.email || '—'}</p>
                        <span className="inline-flex items-center gap-1 bg-white/15 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {user?.role || 'USER'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2 space-y-0.5">
                    <Link
                      to="/mon-profil"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors group"
                    >
                      <User size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                      Mon Profil
                      <ChevronRight size={12} className="ms-auto text-slate-300 group-hover:text-slate-500" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        toast('Changement de mot de passe — Rendez-vous sur Mon Profil', { icon: '🔑' });
                        navigate('/mon-profil');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors group"
                    >
                      <Key size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                      Changer le mot de passe
                      <ChevronRight size={12} className="ms-auto text-slate-300 group-hover:text-slate-500" />
                    </button>

                    <Link
                      to="/audit-logs"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors group"
                    >
                      <ShieldCheck size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                      Historique d'activité
                      <ChevronRight size={12} className="ms-auto text-slate-300 group-hover:text-slate-500" />
                    </Link>

                    {/* Role badge info */}
                    <div className="mx-2 my-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Niveau d'accès</p>
                      <p className="text-xs font-bold text-slate-700">{roleLabel}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {user?.role === 'ROOT' ? 'Accès total — toutes fonctions' :
                         user?.role === 'SUPERADMIN' ? 'Accès total à tous les espaces' :
                         user?.role === 'ADMIN' ? 'Accès à l\'espace assigné' :
                         'Accès limité à l\'espace assigné'}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 mx-2 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                      id="profile-logout-btn"
                    >
                      <LogOut size={14} />
                      Se déconnecter
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-[10px] text-slate-400 font-medium text-center">Hergla Park · Session active</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── PAGE CONTENT ─────────────────────────────────────── */}
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
            fontSize: '13px',
            fontWeight: '600',
          },
        }}
      />
    </div>
  );
}
