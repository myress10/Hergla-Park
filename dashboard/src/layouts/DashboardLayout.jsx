import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import Sidebar from '../components/Sidebar';
import { getAuditLogs } from '../api/auditLogsApi';
import { getEspaces } from '../api/espacesApi';
import { getUsers } from '../api/usersApi';
import { subscribeActivity } from '../utils/activityBus';
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
  const { t } = useTranslation();
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
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'n1',
        type: 'warning',
        titleKey: 'notifications.n1Title',
        messageKey: 'notifications.n1Msg',
        timeKey: 'notifications.time5m',
        targetRoute: '/audit-logs',
        read: false,
      },
      {
        id: 'n2',
        type: 'info',
        titleKey: 'notifications.n2Title',
        messageKey: 'notifications.n2Msg',
        timeKey: 'notifications.time14m',
        targetRoute: '/utilisateurs',
        read: false,
      },
      {
        id: 'n3',
        type: 'success',
        titleKey: 'notifications.n3Title',
        messageKey: 'notifications.n3Msg',
        timeKey: 'notifications.time1h',
        targetRoute: '/configuration-karts',
        read: false,
      },
      {
        id: 'n4',
        type: 'info',
        titleKey: 'notifications.n4Title',
        messageKey: 'notifications.n4Msg',
        timeKey: 'notifications.time2h',
        targetRoute: '/espaces',
        read: true,
      },
      {
        id: 'n5',
        type: 'error',
        titleKey: 'notifications.n5Title',
        messageKey: 'notifications.n5Msg',
        timeKey: 'notifications.timeYesterday',
        targetRoute: '/configuration-karts',
        read: true,
      },
    ];
  });

  // Sync notifications to localStorage
  useEffect(() => {
    localStorage.setItem('hergla_notifications_store', JSON.stringify(notifications));
  }, [notifications]);

  const isFirstLoadRef = useRef(true);

  // Helper to format dynamic elapsed time
  const formatTimeAgo = useCallback((isoString) => {
    if (!isoString) return t('common.justNow');
    const diffMs = Math.max(0, Date.now() - new Date(isoString).getTime());
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return t('common.justNow');
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t('common.minsAgo', { count: diffMin });
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return t('common.hoursAgo', { count: diffHours });
    return t('common.daysAgo', { count: Math.floor(diffHours / 24) });
  }, [t]);

  // Notification polling - always silent (no loading state), smart dedup
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const espacesRes = await getEspaces().catch(() => null);
        if (isMounted && espacesRes?.data?.data) {
          const newEspaces = espacesRes.data.data;
          setAllEspaces((prev) => {
            const prevKey = prev.map((e) => e.id).join(',');
            const nextKey = newEspaces.map((e) => e.id).join(',');
            return prevKey === nextKey ? prev : newEspaces;
          });
        }

        if (isMounted && (user?.role === 'SUPERADMIN' || user?.role === 'ROOT')) {
          const usersRes = await getUsers().catch(() => null);
          if (usersRes?.data?.data) {
            const newUsers = usersRes.data.data;
            setAllUsers((prev) => {
              const prevKey = prev.map((u) => u.id).join(',');
              const nextKey = newUsers.map((u) => u.id).join(',');
              return prevKey === nextKey ? prev : newUsers;
            });
          }
        }

        const logsRes = await getAuditLogs({ limit: 12 }).catch(() => null);
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
              createdAt: log.createdAt || new Date().toISOString(),
              targetRoute,
              read: false,
            };
          });

          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newOnes = liveNotifs.filter((n) => !existingIds.has(n.id));
            
            // Pop a toast only for genuinely new events after initial load
            if (newOnes.length > 0 && !isFirstLoadRef.current) {
              const latest = newOnes[0];
              toast(
                (tObj) => (
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => { toast.dismiss(tObj.id); if (latest.targetRoute) navigate(latest.targetRoute); }}>
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <Bell size={16} className="animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white leading-tight">{latest.title}</p>
                      <p className="text-[11px] text-slate-300 truncate">{latest.message}</p>
                    </div>
                  </div>
                ),
                {
                  duration: 4000,
                  style: {
                    background: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    padding: '10px 14px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                  },
                }
              );
            }

            if (newOnes.length > 0) {
              return [...newOnes, ...prev].slice(0, 30);
            }
            return prev;
          });

          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
          }
        }
      } catch (err) {
        console.error('Failed to load live notification/search data', err);
      }
    }

    // Immediate fetch on mount / role change
    loadData();

    // Instant update when this tab performs an action (0ms)
    const unsubscribe = subscribeActivity(() => {
      loadData();
    });

    // Background heartbeat every 10s - completely silent, no re-render unless data changes
    const intervalId = setInterval(loadData, 10000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [user?.role, navigate]);

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
    toast.success(t('topbar.allReadToast'));
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
    toast.success(t('topbar.clearedToast'));
  };

  // Settings toggles
  const toggleSecurityLock = () => {
    const next = !securityLock;
    setSecurityLock(next);
    localStorage.setItem('hergla_security_lock', String(next));
    toast(next ? t('topbar.securityLockOn') : t('topbar.securityLockOff'), { icon: next ? '🔒' : '🔓' });
  };
  const toggleAutoAssign = () => {
    const next = !autoAssign;
    setAutoAssign(next);
    localStorage.setItem('hergla_auto_assign', String(next));
    toast.success(next ? t('topbar.autoAssignOn') : t('topbar.autoAssignOff'));
  };

  // Logout
  const handleLogout = () => {
    logout();
    toast.success(t('topbar.logoutSuccess'));
    navigate('/login');
  };

  // Company switch
  const handleCompanyChange = async (e) => {
    const newCompanyId = e.target.value;
    if (newCompanyId === activeCompanyId) return;
    try {
      const comp = await switchCompany(newCompanyId);
      toast.success(t('topbar.companySwitched', { name: comp.nom }));
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || t('topbar.companySwitchError'));
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
        category: t('topbar.categories.modules'),
        title: t('nav.spaces'),
        subtitle: t('spaces.subtitle'),
        icon: Layers,
        route: '/espaces',
      });
    } else {
      items.push({
        id: 'mod-monespace',
        category: t('topbar.categories.modules'),
        title: t('nav.mySpace'),
        subtitle: t('mySpace.operationalStatus'),
        icon: Layers,
        route: '/mon-espace',
      });
    }

    items.push({
      id: 'mod-editeur-3d',
      category: t('topbar.categories.modules'),
      title: t('nav.editor3d'),
      subtitle: t('sceneEditor.subtitle'),
      icon: Box,
      route: '/editeur-3d',
    });

    items.push({
      id: 'mod-karts',
      category: t('topbar.categories.modules'),
      title: t('nav.kartsConfig'),
      subtitle: t('karts.subtitle'),
      icon: Flag,
      route: '/configuration-karts',
    });

    if (isSuperOrRoot) {
      items.push({
        id: 'mod-users',
        category: t('topbar.categories.modules'),
        title: t('nav.users'),
        subtitle: t('users.subtitle'),
        icon: UsersIcon,
        route: '/utilisateurs',
      });
    }

    if (isAdminOrAbove) {
      items.push({
        id: 'mod-audit',
        category: t('topbar.categories.modules'),
        title: t('nav.auditLogs'),
        subtitle: t('audit.subtitle'),
        icon: ShieldCheck,
        route: '/audit-logs',
      });
    }

    items.push({
      id: 'mod-profile',
      category: t('topbar.categories.modules'),
      title: t('nav.myProfile'),
      subtitle: t('profile.subtitle'),
      icon: User,
      route: '/mon-profil',
    });

    // 2. Real Espaces
    allEspaces.forEach((esp) => {
      items.push({
        id: `esp-${esp.id}`,
        category: t('topbar.categories.spaces'),
        title: esp.nom,
        subtitle: `${esp.categorie || 'Parc'} • ${t('spaces.statuses.' + (esp.statut || 'OUVERT'))}`,
        icon: Layers,
        route: isSuperOrRoot ? `/espaces/${esp.id}` : '/mon-espace',
      });
    });

    // 3. Flotte Karts
    const kartFleet = [
      { no: '01', model: 'Sodi RT10' },
      { no: '02', model: 'Sodi RT10' },
      { no: '05', model: 'Sodi 2Drive' },
      { no: '08', model: 'Sodi LR5 Junior' },
      { no: '12', model: 'Sodi RT10 Pro' },
    ];
    kartFleet.forEach((k) => {
      items.push({
        id: `kart-${k.no}`,
        category: t('topbar.categories.karts'),
        title: `Kart #${k.no} (${k.model})`,
        subtitle: `${t('karts.inService')}`,
        icon: Flag,
        route: '/configuration-karts',
      });
    });

    // 4. Users (for SuperAdmin/Root)
    if (isSuperOrRoot && allUsers.length > 0) {
      allUsers.forEach((u) => {
        items.push({
          id: `user-${u.id}`,
          category: t('topbar.categories.users'),
          title: u.nom,
          subtitle: `${u.email} • ${u.role}`,
          icon: User,
          route: '/utilisateurs',
        });
      });
    }

    // 5. Quick Actions
    items.push({
      id: 'act-lang-fr',
      category: t('topbar.categories.quickActions'),
      title: t('topbar.switchLangFr'),
      subtitle: t('topbar.switchLangFrSub'),
      icon: Globe,
      action: () => { switchLang('fr'); toast.success(t('topbar.langChangedFr')); },
    });
    items.push({
      id: 'act-lang-ar',
      category: t('topbar.categories.quickActions'),
      title: t('topbar.switchLangAr'),
      subtitle: t('topbar.switchLangArSub'),
      icon: Globe,
      action: () => { switchLang('ar'); toast.success(t('topbar.langChangedAr')); },
    });
    items.push({
      id: 'act-lang-en',
      category: t('topbar.categories.quickActions'),
      title: t('topbar.switchLangEn'),
      subtitle: t('topbar.switchLangEnSub'),
      icon: Globe,
      action: () => { switchLang('en'); toast.success(t('topbar.langChangedEn')); },
    });

    return items;
  }, [user?.role, allEspaces, allUsers, switchLang, t]);

  // Filtered search results
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return searchableItems.filter((i) => i.category === t('topbar.categories.modules') || i.category === t('topbar.categories.quickActions')).slice(0, 6);
    }
    return searchableItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchQuery, searchableItems, t]);

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

  const roleLabel = user?.role || 'Utilisateur';

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
                placeholder={t('topbar.searchPlaceholder')}
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
                    {searchQuery ? t('topbar.searchResultsFor', { query: searchQuery }) : t('topbar.searchSuggestions')}
                  </span>
                  <span className="text-[10px] text-slate-400">{t('topbar.foundCount', { count: searchResults.length })}</span>
                </div>

                {/* Results List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 p-1.5">
                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center">
                      <Search size={24} className="mx-auto text-slate-300 mb-1.5" />
                      <p className="text-xs text-slate-600 font-bold">{t('topbar.noResultsFound')}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t('topbar.tryOtherKeyword')}</p>
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
                          <ArrowRight size={13} className={`flex-shrink-0 transition-transform ${isSelected ? 'text-indigo-600 translate-x-0.5 rtl:-translate-x-0.5' : 'text-slate-300'}`} />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{t('topbar.navigation')} <kbd className="font-sans font-bold">↑</kbd> <kbd className="font-sans font-bold">↓</kbd> {t('topbar.navHint')}</span>
                  <span><kbd className="font-sans font-bold">↵</kbd> {t('topbar.enterHint')}</span>
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
                title={t('topbar.globalSettings')}
              >
                <Globe size={18} />
              </button>

              {settingsOpen && (
                <div className="absolute end-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header */}
                  <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-emerald-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wider">{t('topbar.globalSettings')}</span>
                    </div>
                    <button onClick={() => setSettingsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-3.5 space-y-3">
                    {/* Unified Language Selector (Français, العربية, English) */}
                    <div>
                      <div className="flex items-center justify-between px-1 pb-1.5">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('topbar.uiLanguage')}</p>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          {lang === 'fr' ? 'FR' : lang === 'ar' ? 'AR' : 'EN'} {t('topbar.active')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            switchLang('fr');
                            toast.success(t('topbar.langChangedFr'));
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
                            toast.success(t('topbar.langChangedAr'));
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
                            toast.success(t('topbar.langChangedEn'));
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
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 pb-1">{t('topbar.securitySystem')}</p>

                      {/* Security Lock Toggle */}
                      <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          {securityLock ? <Lock size={14} className="text-slate-800" /> : <Unlock size={14} className="text-slate-400" />}
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{t('topbar.securityLock')}</p>
                            <p className="text-[10px] text-slate-400">{securityLock ? t('topbar.securityLockEnabled') : t('topbar.securityLockDisabled')}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={toggleSecurityLock}
                          className={`w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0 ${securityLock ? 'bg-slate-900' : 'bg-slate-200'}`}
                          style={{ width: 40, height: 22 }}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transition-transform absolute top-[3px] ${securityLock ? 'translate-x-[20px] rtl:-translate-x-[20px]' : 'translate-x-[3px] rtl:-translate-x-[3px]'}`}
                          />
                        </button>
                      </div>

                      {/* Auto-Assign Toggle */}
                      <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <RotateCcw size={14} className={autoAssign ? 'text-emerald-600' : 'text-slate-400'} />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{t('topbar.autoAssign')}</p>
                            <p className="text-[10px] text-slate-400">{autoAssign ? t('topbar.autoAssignEnabled') : t('topbar.autoAssignManual')}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={toggleAutoAssign}
                          className={`w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0 ${autoAssign ? 'bg-emerald-500' : 'bg-slate-200'}`}
                          style={{ width: 40, height: 22 }}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow transition-transform absolute top-[3px] ${autoAssign ? 'translate-x-[20px] rtl:-translate-x-[20px]' : 'translate-x-[3px] rtl:-translate-x-[3px]'}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Quick Access Links */}
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 pb-1">{t('topbar.directAccess')}</p>

                      <Link
                        to="/audit-logs"
                        onClick={() => setSettingsOpen(false)}
                        className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck size={14} className="text-slate-500 group-hover:text-indigo-600" />
                          <span className="text-xs font-semibold text-slate-700">{t('topbar.auditSecurityLogs')}</span>
                        </div>
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-600 transition-colors rtl:rotate-180" />
                      </Link>

                      <Link
                        to="/utilisateurs"
                        onClick={() => setSettingsOpen(false)}
                        className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Settings size={14} className="text-slate-500 group-hover:text-indigo-600" />
                          <span className="text-xs font-semibold text-slate-700">{t('topbar.userManagement')}</span>
                        </div>
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-600 transition-colors rtl:rotate-180" />
                      </Link>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{t('topbar.appVersion')}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t('topbar.connectedStatus')}
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
                title={t('topbar.notifCenter')}
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
                      <span className="text-xs font-extrabold uppercase tracking-wider">{t('topbar.notifCenter')}</span>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {t('topbar.newNotifs', { count: unreadCount })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-emerald-300 transition-colors"
                          title={t('topbar.markAllRead')}
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-red-300 transition-colors"
                          title={t('topbar.clearAll')}
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
                      {t('topbar.allNotifs')} ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifTab('unread')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${notifTab === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      {t('topbar.unreadNotifs')} ({unreadCount})
                    </button>
                    <button
                      onClick={() => setNotifTab('alerts')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${notifTab === 'alerts' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      {t('topbar.alertsNotifs')}
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell size={28} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs text-slate-500 font-bold">{t('topbar.noNotifs')}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t('topbar.parkEventsUpToDate')}</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notif) => {
                        const cfg = getNotifConfig(notif.type);
                        const Icon = cfg.icon;
                        const titleText = notif.titleKey ? t(notif.titleKey) : notif.title;
                        const msgText = notif.messageKey ? t(notif.messageKey) : notif.message;
                        const timeText = notif.createdAt ? formatTimeAgo(notif.createdAt) : notif.timeKey ? t(notif.timeKey) : notif.time;

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
                                  {titleText}
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
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">{msgText}</p>
                              <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 font-medium">
                                <span>{timeText}</span>
                                {notif.targetRoute && (
                                  <span className="text-indigo-600 font-bold flex items-center gap-0.5 hover:underline">
                                    {t('topbar.viewDetail')} <ChevronRight size={10} className="rtl:rotate-180" />
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
                      {t('topbar.fullAuditHistory')}
                      <ExternalLink size={11} />
                    </Link>
                    <span className="text-[10px] text-slate-400">{t('topbar.realTime')}</span>
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
                      {t('topbar.myProfile')}
                      <ChevronRight size={12} className="ms-auto text-slate-300 group-hover:text-slate-500 rtl:rotate-180" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        toast(t('topbar.passwordChangeToast'), { icon: '🔑' });
                        navigate('/mon-profil');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors group"
                    >
                      <Key size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                      {t('topbar.changePassword')}
                      <ChevronRight size={12} className="ms-auto text-slate-300 group-hover:text-slate-500 rtl:rotate-180" />
                    </button>

                    <Link
                      to="/audit-logs"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors group"
                    >
                      <ShieldCheck size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
                      {t('topbar.activityHistory')}
                      <ChevronRight size={12} className="ms-auto text-slate-300 group-hover:text-slate-500 rtl:rotate-180" />
                    </Link>

                    {/* Role badge info */}
                    <div className="mx-2 my-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">{t('topbar.accessLevel')}</p>
                      <p className="text-xs font-bold text-slate-700">{roleLabel}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {user?.role === 'ROOT' ? t('topbar.totalAccessAll') :
                         user?.role === 'SUPERADMIN' ? t('topbar.totalAccessSpaces') :
                         user?.role === 'ADMIN' ? t('topbar.accessAssignedSpace') :
                         t('topbar.limitedAccess')}
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
                      {t('common.logout')}
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-[10px] text-slate-400 font-medium text-center">{t('topbar.activeSession')}</p>
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
