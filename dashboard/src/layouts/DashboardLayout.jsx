import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import Sidebar from '../components/Sidebar';
import { getAuditLogs } from '../api/auditLogsApi';
import { getEspaces } from '../api/espacesApi';
import { getUsers } from '../api/usersApi';
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
  ExternalLink,
  Trash2,
  Check,
  Layers,
  Box,
  Flag,
  Users as UsersIcon,
  Sparkles,
  Command,
  ArrowRight,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Initial notification fallback dataset
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'warning',
    title: 'Tentative de connexion inhabituelle',
    message: 'Compte h.karim@herglapark.tn — 3 tentatives bloquées par le pare-feu.',
    time: 'Il y a 5 min',
    targetRoute: '/audit-logs',
    read: false,
  },
  {
    id: 'n2',
    type: 'info',
    title: 'Mise à jour des permissions',
    message: 'Rôle ADMIN attribué avec succès pour Sonia Ben Romdhane.',
    time: 'Il y a 14 min',
    targetRoute: '/utilisateurs',
    read: false,
  },
  {
    id: 'n3',
    type: 'success',
    title: 'Flotte Karts actualisée',
    message: '3 karts Sodi RT10 inspectés et prêts pour la session Grand Prix.',
    time: 'Il y a 1 h',
    targetRoute: '/configuration-karts',
    read: false,
  },
  {
    id: 'n4',
    type: 'info',
    title: 'Espace attraction ouvert',
    message: "L'espace Piste Karting Principale est désormais opérationnel.",
    time: 'Il y a 2 h',
    targetRoute: '/espaces',
    read: true,
  },
  {
    id: 'n5',
    type: 'error',
    title: 'Alerte maintenance requise',
    message: 'Capteur de télémétrie Kart #08 nécessite une réinitialisation.',
    time: 'Hier, 16:45',
    targetRoute: '/configuration-karts',
    read: true,
  },
];

// Helper to format notification icon & colors
function getNotifConfig(type) {
  switch (type) {
    case 'warning':
      return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200/60' };
    case 'error':
      return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200/60' };
    case 'success':
      return { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200/60' };
    case 'info':
    default:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200/60' };
  }
}

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
  const { user, availableCompanies, activeCompanyId, switchCompany, logout } = useAuth();
  const { lang, switchLang } = useLang();
  const navigate = useNavigate();

  // Dropdown open states
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Notification Filter Tab: 'all' | 'unread' | 'alerts'
  const [notifTab, setNotifTab] = useState('all');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search cached data
  const [allEspaces, setAllEspaces] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Local settings state
  const [securityLock, setSecurityLock] = useState(
    () => localStorage.getItem('hergla_security_lock') === 'true'
  );
  const [autoAssign, setAutoAssign] = useState(
    () => localStorage.getItem('hergla_auto_assign') !== 'false'
  );

  // Notifications state with localStorage persistence
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('hergla_notifications_store');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  // Sync notifications to localStorage
  useEffect(() => {
    localStorage.setItem('hergla_notifications_store', JSON.stringify(notifications));
  }, [notifications]);

  // Load real audit logs & entities for notifications and search
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Fetch spaces for universal search
        const espacesRes = await getEspaces().catch(() => null);
        if (isMounted && espacesRes?.data?.data) {
          setAllEspaces(espacesRes.data.data);
        }

        // If admin/superadmin/root, fetch users for search
        if (isMounted && (user?.role === 'SUPERADMIN' || user?.role === 'ROOT')) {
          const usersRes = await getUsers().catch(() => null);
          if (usersRes?.data?.data) {
            setAllUsers(usersRes.data.data);
          }
        }

        // Fetch live audit logs to enrich notifications
        const logsRes = await getAuditLogs({ limit: 8 }).catch(() => null);
        if (isMounted && logsRes?.data && Array.isArray(logsRes.data)) {
          const liveNotifs = logsRes.data.map((log, idx) => {
            const isWarning = log.action?.includes('DELETE') || log.action?.includes('LOCK');
            const isSuccess = log.action?.includes('CREATE') || log.action?.includes('STATUS');
            const type = isWarning ? 'warning' : isSuccess ? 'success' : 'info';
            
            let targetRoute = '/audit-logs';
            if (log.action?.includes('KART')) targetRoute = '/configuration-karts';
            else if (log.action?.includes('ESPACE')) targetRoute = '/espaces';
            else if (log.action?.includes('USER') || log.action?.includes('ROLE')) targetRoute = '/utilisateurs';
            else if (log.action?.includes('SCENE') || log.action?.includes('OBJECT')) targetRoute = '/editeur-3d';

            return {
              id: log.id || `live-log-${idx}-${Date.now()}`,
              type,
              title: `${log.action?.replace(/_/g, ' ') || 'Action Système'}`,
              message: `${log.actor?.nom || 'Admin'} : ${log.entityType || 'Module'} (${log.company?.nom || 'Hergla Park'})`,
              time: 'Récent',
              targetRoute,
              read: false,
            };
          });

          setNotifications((prev) => {
            // Keep unique notifications
            const existingIds = new Set(prev.map((n) => n.id));
            const newOnes = liveNotifs.filter((n) => !existingIds.has(n.id));
            if (newOnes.length > 0) {
              return [...newOnes, ...prev].slice(0, 20);
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to load live notification/search data', err);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (notifTab === 'unread') return notifications.filter((n) => !n.read);
    if (notifTab === 'alerts') return notifications.filter((n) => n.type === 'warning' || n.type === 'error');
    return notifications;
  }, [notifications, notifTab]);

  // Dropdown refs for click-outside
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const settingsRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(settingsRef, () => setSettingsOpen(false));
  useClickOutside(searchRef, () => setSearchOpen(false));

  // Global Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close other popups when one opens
  const openNotif = () => { setNotifOpen((v) => !v); setProfileOpen(false); setSettingsOpen(false); setSearchOpen(false); };
  const openProfile = () => { setProfileOpen((v) => !v); setNotifOpen(false); setSettingsOpen(false); setSearchOpen(false); };
  const openSettings = () => { setSettingsOpen((v) => !v); setNotifOpen(false); setProfileOpen(false); setSearchOpen(false); };

  // Notification actions
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('Toutes les notifications marquées comme lues');
  };
  const dismissNotif = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const markOneRead = (notif) => {
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.targetRoute) {
      navigate(notif.targetRoute);
      setNotifOpen(false);
    }
  };
  const clearAll = () => {
    setNotifications([]);
    toast.success('Toutes les notifications effacées');
  };

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
    toast.success(next ? 'Auto-assignation activée' : 'Auto-assignation désactivée');
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

  // Build searchable items based on user role
  const searchableItems = useMemo(() => {
    const items = [];
    const isSuperOrRoot = user?.role === 'SUPERADMIN' || user?.role === 'ROOT';
    const isAdminOrAbove = isSuperOrRoot || user?.role === 'ADMIN';

    // 1. Navigation Modules
    if (isSuperOrRoot) {
      items.push({
        id: 'mod-espaces',
        category: 'Modules',
        title: 'Vue d\'Ensemble des Espaces',
        subtitle: 'Supervision globale du parc et attractions',
        icon: Layers,
        route: '/espaces',
      });
    } else {
      items.push({
        id: 'mod-monespace',
        category: 'Modules',
        title: 'Mon Espace Assigné',
        subtitle: 'Gestion de mon espace opérationnel',
        icon: Layers,
        route: '/mon-espace',
      });
    }

    items.push({
      id: 'mod-editeur-3d',
      category: 'Modules',
      title: 'Studio & Éditeur 3D',
      subtitle: 'Aménagement immersif et objets 3D',
      icon: Box,
      route: '/editeur-3d',
    });

    items.push({
      id: 'mod-karts',
      category: 'Modules',
      title: 'Configuration Flotte Karts',
      subtitle: 'Gestion des karts, numéros et modèles',
      icon: Flag,
      route: '/configuration-karts',
    });

    if (isSuperOrRoot) {
      items.push({
        id: 'mod-users',
        category: 'Modules',
        title: 'Gestion des Utilisateurs',
        subtitle: 'Comptes, rôles et affectations',
        icon: UsersIcon,
        route: '/utilisateurs',
      });
    }

    if (isAdminOrAbove) {
      items.push({
        id: 'mod-audit',
        category: 'Modules',
        title: 'Journal des Logs d\'Audit',
        subtitle: 'Historique des actions système',
        icon: ShieldCheck,
        route: '/audit-logs',
      });
    }

    items.push({
      id: 'mod-profile',
      category: 'Modules',
      title: 'Mon Profil & Paramètres',
      subtitle: 'Informations personnelles et mot de passe',
      icon: User,
      route: '/mon-profil',
    });

    // 2. Real Espaces
    allEspaces.forEach((esp) => {
      items.push({
        id: `esp-${esp.id}`,
        category: 'Espaces d\'Attraction',
        title: esp.nom,
        subtitle: `Catégorie : ${esp.categorie || 'Parc'} • Statut : ${esp.statut || 'OUVERT'}`,
        icon: Layers,
        route: isSuperOrRoot ? `/espaces/${esp.id}` : '/mon-espace',
      });
    });

    // 3. Flotte Karts Preset Search Entries
    const kartFleet = [
      { no: '01', model: 'Sodi RT10', status: 'En Course' },
      { no: '02', model: 'Sodi RT10', status: 'Stand' },
      { no: '05', model: 'Sodi 2Drive', status: 'En Course' },
      { no: '08', model: 'Sodi LR5 Junior', status: 'Maintenance' },
      { no: '12', model: 'Sodi RT10 Pro', status: 'En Course' },
    ];
    kartFleet.forEach((k) => {
      items.push({
        id: `kart-${k.no}`,
        category: 'Flotte Karts',
        title: `Kart #${k.no} (${k.model})`,
        subtitle: `État : ${k.status} • Piste Principale`,
        icon: Flag,
        route: '/configuration-karts',
      });
    });

    // 4. Users (for SuperAdmin/Root)
    if (isSuperOrRoot && allUsers.length > 0) {
      allUsers.forEach((u) => {
        items.push({
          id: `user-${u.id}`,
          category: 'Utilisateurs',
          title: u.nom,
          subtitle: `${u.email} • Rôle : ${u.role}`,
          icon: User,
          route: '/utilisateurs',
        });
      });
    }

    // 5. Quick Actions
    items.push({
      id: 'act-lang-fr',
      category: 'Actions Rapides',
      title: 'Passer en Français',
      subtitle: 'Changer la langue d\'interface en Français',
      icon: Globe,
      action: () => { switchLang('fr'); toast.success('Langue : Français'); },
    });
    items.push({
      id: 'act-lang-ar',
      category: 'Actions Rapides',
      title: 'التحويل إلى العربية',
      subtitle: 'تغيير لغة لوحة التحكم إلى العربية',
      icon: Globe,
      action: () => { switchLang('ar'); toast.success('تم التغيير: العربية'); },
    });
    items.push({
      id: 'act-lang-en',
      category: 'Actions Rapides',
      title: 'Switch to English',
      subtitle: 'Change interface language to English',
      icon: Globe,
      action: () => { switchLang('en'); toast.success('Language: English'); },
    });

    return items;
  }, [user?.role, allEspaces, allUsers, switchLang]);

  // Filtered search results
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // Return top module suggestions if no query
      return searchableItems.filter((i) => i.category === 'Modules' || i.category === 'Actions Rapides').slice(0, 6);
    }
    return searchableItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchQuery, searchableItems]);

  const handleSelectSearchResult = (item) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(searchResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(searchResults.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectSearchResult(searchResults[selectedIndex]);
      }
    }
  };

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
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-8 py-3 flex items-center justify-between shadow-sm">

          {/* Universal Search Bar */}
          <div className="relative" ref={searchRef}>
            <div className="relative flex items-center">
              <Search size={15} className="absolute start-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Rechercher modules, espaces, karts, staff… (Ctrl+K)"
                className="bg-slate-100/90 text-slate-800 text-xs font-medium rounded-xl ps-9 pe-14 py-2 w-64 sm:w-80 md:w-96 border border-slate-200/70 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400 shadow-inner"
                id="topbar-search-input"
              />
              <div className="absolute end-2.5 flex items-center gap-1 pointer-events-none">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                    className="pointer-events-auto p-0.5 hover:bg-slate-200 rounded-md text-slate-400"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-extrabold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-xs">
                    <Command size={10} /> K
                  </kbd>
                )}
              </div>
            </div>

            {/* Universal Search Dropdown / Command Palette */}
            {searchOpen && (
              <div className="absolute start-0 top-full mt-2 w-80 sm:w-96 md:w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Search header status */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Sparkles size={13} className="text-indigo-600" />
                    {searchQuery ? `Résultats pour "${searchQuery}"` : 'Suggestions & Navigation rapide'}
                  </span>
                  <span className="text-[10px] text-slate-400">{searchResults.length} trouvé(s)</span>
                </div>

                {/* Results List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 p-1.5">
                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center">
                      <Search size={24} className="mx-auto text-slate-300 mb-1.5" />
                      <p className="text-xs text-slate-600 font-bold">Aucun résultat trouvé</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Essayez un autre mot-clé (ex: "kart", "studio", "espace")</p>
                    </div>
                  ) : (
                    searchResults.map((item, idx) => {
                      const Icon = item.icon || Layers;
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSearchResult(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                            isSelected ? 'bg-indigo-50/80 text-indigo-950 ring-1 ring-indigo-200' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold truncate">{item.title}</p>
                              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                          </div>
                          <ArrowRight size={13} className={`flex-shrink-0 transition-transform ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'}`} />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Navigation : <kbd className="font-sans font-bold">↑</kbd> <kbd className="font-sans font-bold">↓</kbd> pour naviguer</span>
                  <span><kbd className="font-sans font-bold">Entrée</kbd> pour valider</span>
                </div>
              </div>
            )}
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

            {/* ── GLOBAL SETTINGS & UNIFIED LANGUAGE DROPDOWN ────────── */}
            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                onClick={openSettings}
                className={`p-2 rounded-xl transition-all ${settingsOpen ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                id="topbar-global-btn"
                title="Paramètres Globaux & Langues"
              >
                <Globe size={18} />
              </button>

              {settingsOpen && (
                <div className="absolute end-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header */}
                  <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-emerald-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">Paramètres Globaux</span>
                    </div>
                    <button onClick={() => setSettingsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-3.5 space-y-3">
                    {/* Unified Language Selector (Français, العربية, English) */}
                    <div>
                      <div className="flex items-center justify-between px-1 pb-1.5">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Langue de l'Interface</p>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          {lang === 'fr' ? 'FR' : lang === 'ar' ? 'AR' : 'EN'} Actif
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            switchLang('fr');
                            toast.success('Langue changée : Français');
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center gap-1 ${
                            lang === 'fr'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/30'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm">🇫🇷</span>
                          <span>Français</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            switchLang('ar');
                            toast.success('تم تغيير اللغة : العربية');
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center gap-1 ${
                            lang === 'ar'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/30'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm">🇹🇳</span>
                          <span>العربية</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            switchLang('en');
                            toast.success('Language changed: English');
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center gap-1 ${
                            lang === 'en'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/30'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm">🇬🇧</span>
                          <span>English</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Security & System Toggles */}
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 pb-1">Sécurité & Système</p>

                      {/* Security Lock Toggle */}
                      <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          {securityLock ? <Lock size={14} className="text-slate-800" /> : <Unlock size={14} className="text-slate-400" />}
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Verrouillage Sécurité</p>
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
                            <p className="text-[10px] text-slate-400">{autoAssign ? 'Attribution automatique' : 'Manuel'}</p>
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
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Quick Access Links */}
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 pb-1">Accès Direct</p>

                      <Link
                        to="/audit-logs"
                        onClick={() => setSettingsOpen(false)}
                        className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck size={14} className="text-slate-500 group-hover:text-indigo-600" />
                          <span className="text-xs font-semibold text-slate-700">Logs d'Audit & Sécurité</span>
                        </div>
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </Link>

                      <Link
                        to="/utilisateurs"
                        onClick={() => setSettingsOpen(false)}
                        className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Settings size={14} className="text-slate-500 group-hover:text-indigo-600" />
                          <span className="text-xs font-semibold text-slate-700">Gestion Utilisateurs</span>
                        </div>
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </Link>
                    </div>
                  </div>

                  {/* Footer: App version & multi-tenant status */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Hergla Park v2.4 · Multi-Tenant</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connecté
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── NOTIFICATIONS DROPDOWN ───────────────────────────── */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={openNotif}
                className={`relative p-2 rounded-xl transition-all ${notifOpen ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                id="topbar-notifications-btn"
                title="Notifications Système"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -end-0.5 min-w-[17px] h-4.5 rounded-full bg-red-500 ring-2 ring-white flex items-center justify-center text-[9px] font-black text-white px-1 shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute end-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header */}
                  <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={15} className="text-emerald-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">Centre de Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} nouvelle(s)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-emerald-300 transition-colors"
                          title="Tout marquer comme lu"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-red-300 transition-colors"
                          title="Effacer tout"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 text-xs font-bold text-slate-500">
                    <button
                      onClick={() => setNotifTab('all')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${notifTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Toutes ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifTab('unread')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${notifTab === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Non lues ({unreadCount})
                    </button>
                    <button
                      onClick={() => setNotifTab('alerts')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${notifTab === 'alerts' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Alertes
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={28} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs text-slate-500 font-bold">Aucune notification à afficher</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Le flux d'événements du parc est à jour.</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notif) => {
                        const cfg = getNotifConfig(notif.type);
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markOneRead(notif)}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-slate-50 ${
                              !notif.read ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl ${cfg.bg} border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs`}>
                              <Icon size={14} className={cfg.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-extrabold ${notif.read ? 'text-slate-700' : 'text-slate-950'} truncate`}>
                                  {notif.title}
                                  {!notif.read && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600 ms-1.5 mb-0.5 align-middle shadow-xs" />
                                  )}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotif(notif.id);
                                  }}
                                  className="p-1 hover:bg-slate-200/70 rounded-md text-slate-400 hover:text-slate-700 flex-shrink-0 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                              <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 font-medium">
                                <span>{notif.time}</span>
                                {notif.targetRoute && (
                                  <span className="text-indigo-600 font-bold flex items-center gap-0.5 hover:underline">
                                    Voir détail <ChevronRight size={10} />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <Link
                      to="/audit-logs"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                      <ShieldCheck size={13} />
                      Historique complet des audits
                      <ExternalLink size={11} />
                    </Link>
                    <span className="text-[10px] text-slate-400">Temps réel</span>
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
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs shadow-sm ring-2 ring-slate-200">
                  {initials}
                </div>
              </button>

              {profileOpen && (
                <div className="absolute end-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Info Header */}
                  <div className="px-4 py-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-extrabold text-sm ring-2 ring-white/30">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm leading-tight truncate">{user?.nom || 'Admin User'}</p>
                        <p className="text-[11px] text-slate-300 truncate">{user?.email || '—'}</p>
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
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
