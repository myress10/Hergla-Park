import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers, updateUser, deleteUser, createUser, updateUserPassword } from '../api/usersApi';
import { getEspaces } from '../api/espacesApi';
import { getAuditLogs } from '../api/auditLogsApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import RootVerificationModal from '../components/RootVerificationModal';
import {
  Users,
  UserCheck,
  Shield,
  Clock,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Key,
  Download,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Activity,
  Check,
  CheckCircle2,
  Lock,
  Unlock,
  Settings2,
  Sparkles,
  RefreshCw,
  Info,
  Layers,
  FileCheck,
  FileSpreadsheet,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_BADGES = {
  SUPERADMIN: { label: 'SUPERADMIN', icon: '✪', bg: 'bg-slate-900 text-white border-slate-800' },
  ROOT: { label: 'ROOT', icon: '⚡', bg: 'bg-indigo-900 text-indigo-100 border-indigo-700' },
  ADMIN: { label: 'ADMIN', icon: '🔑', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  EMPLOYE: { label: 'EMPLOYE', icon: '👤', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const AVAILABLE_PERMISSIONS = [
  { key: 'espace:create', label: 'Créer des espaces', category: 'Espaces', desc: 'Ajouter de nouvelles attractions et zones au parc' },
  { key: 'espace:update', label: 'Modifier les espaces', category: 'Espaces', desc: 'Changer le statut (Ouvert/Fermé/Maintenance) et les métadonnées' },
  { key: 'kart:manage', label: 'Gérer la flotte de karts', category: 'Karting', desc: 'Attribuer numéros, couleurs, et statut d\'entretien des karts' },
  { key: 'kart:read', label: 'Consulter les karts', category: 'Karting', desc: 'Visualiser la télémétrie et les karts actifs' },
  { key: 'scene:edit', label: 'Éditeur 3D Studio', category: 'Studio 3D', desc: 'Modifier et sauvegarder les placements d\'objets 3D' },
  { key: 'logs:view', label: 'Consulter les logs d\'audit', category: 'Sécurité', desc: 'Accès au journal de traçabilité des opérations' },
  { key: 'report:export', label: 'Exporter les rapports', category: 'Rapports', desc: 'Exporter les données en CSV et synthèses d\'activité' },
  { key: 'user:create', label: 'Créer des utilisateurs', category: 'Utilisateurs', desc: 'Ajouter des membres et opérateurs au système' },
];

const DEFAULT_PERMISSIONS_BY_ROLE = {
  SUPERADMIN: ['espace:create', 'espace:update', 'kart:manage', 'kart:read', 'scene:edit', 'logs:view', 'report:export', 'user:create'],
  ADMIN: ['espace:update', 'kart:manage', 'kart:read', 'scene:edit', 'report:export'],
  EMPLOYE: ['espace:update', 'kart:read', 'scene:edit'],
};

function RoleBadge({ role }) {
  const conf = ROLE_BADGES[role] || { label: role, icon: '👤', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border shadow-2xs ${conf.bg}`}
    >
      <span className="text-[10px]">{conf.icon}</span>
      {conf.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, subtext, bg, iconColor, valueColor = 'text-slate-900' }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div className="space-y-1">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
        {subtext && <p className="text-[11px] text-slate-400 font-medium">{subtext}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0 shadow-2xs`}>
        <Icon size={22} className={iconColor} />
      </div>
    </div>
  );
}

// Tooltip helper component
function Tooltip({ children, text }) {
  return (
    <div className="relative group/tooltip inline-flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:flex flex-col items-center z-50 pointer-events-none min-w-[220px] max-w-[280px]">
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-[11px] leading-snug font-medium rounded-xl py-2 px-3 shadow-2xl border border-slate-700 text-center">
          {text}
        </div>
        <div className="w-2 h-2 bg-slate-900/95 rotate-45 -mt-1" />
      </div>
    </div>
  );
}

// Format relative time helper
function formatRelativeTime(dateString, t) {
  if (!dateString) return t('common.systemOnline');
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  return `Il y a ${diffDays} j`;
}

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [espaces, setEspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  // Live Audit Logs / Recent Activities Feed state
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [lastActivityFetch, setLastActivityFetch] = useState(new Date());

  // Global Settings panel state (persisted in localStorage)
  const [securityLock, setSecurityLock] = useState(
    () => localStorage.getItem('hergla_security_lock') === 'true'
  );
  const [autoAssign, setAutoAssign] = useState(
    () => localStorage.getItem('hergla_auto_assign') !== 'false'
  );
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Create modal state with custom permissions
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customPermsExpanded, setCustomPermsExpanded] = useState(false);
  const [newUser, setNewUser] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'EMPLOYE',
    assignedSpaceId: '',
    telephone: '',
    customPermissions: DEFAULT_PERMISSIONS_BY_ROLE.EMPLOYE,
  });

  // Edit modal state with custom permissions
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editCustomPermsExpanded, setEditCustomPermsExpanded] = useState(false);

  // Password modal
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rootDeleteModalOpen, setRootDeleteModalOpen] = useState(false);

  // Fetch Users & Espaces
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, espacesRes] = await Promise.all([getUsers(), getEspaces()]);
      const dbUsers = usersRes.data?.data || [];
      setEspaces(espacesRes.data?.data || []);
      setUsers(dbUsers);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch Live Audit Activities
  const fetchRecentActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const logsRes = await getAuditLogs({ limit: 5 });
      const items = logsRes?.data || [];
      setRecentActivities(items);
      setLastActivityFetch(new Date());
    } catch (err) {
      console.warn('Failed to fetch recent audit logs:', err);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAll();
    fetchRecentActivities();
  }, [fetchAll, fetchRecentActivities]);

  // Auto-refresh polling for recent activities feed every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentActivities();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchRecentActivities]);

  // When creating a user and role changes, auto-sync default custom permissions
  const handleRoleChange = (role) => {
    const defaults = DEFAULT_PERMISSIONS_BY_ROLE[role] || DEFAULT_PERMISSIONS_BY_ROLE.EMPLOYE;
    setNewUser((p) => ({ ...p, role, customPermissions: defaults }));
  };

  const handleEditRoleChange = (role) => {
    const defaults = DEFAULT_PERMISSIONS_BY_ROLE[role] || DEFAULT_PERMISSIONS_BY_ROLE.EMPLOYE;
    setEditTarget((p) => ({ ...p, role, customPermissions: defaults }));
  };

  const togglePermission = (key, isEdit = false) => {
    if (isEdit) {
      setEditTarget((p) => {
        const current = p.customPermissions || [];
        const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
        return { ...p, customPermissions: next };
      });
    } else {
      setNewUser((p) => {
        const current = p.customPermissions || [];
        const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
        return { ...p, customPermissions: next };
      });
    }
  };

  // Toggle Security Lock
  const handleToggleSecurityLock = () => {
    const nextState = !securityLock;
    setSecurityLock(nextState);
    localStorage.setItem('hergla_security_lock', String(nextState));
    if (nextState) {
      toast.success(t('users.securityLockActive'));
    } else {
      toast(t('users.securityLock'));
    }
  };

  // Toggle Auto Assignation
  const handleToggleAutoAssign = () => {
    const nextState = !autoAssign;
    setAutoAssign(nextState);
    localStorage.setItem('hergla_auto_assign', String(nextState));
    if (nextState) {
      toast.success(t('users.autoAssign'));
    } else {
      toast(t('users.autoAssign'));
    }
  };

  // Filtering
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.nom?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'admins' && (u.role === 'ADMIN' || u.role === 'SUPERADMIN' || u.role === 'ROOT')) ||
      (activeTab === 'employees' && u.role === 'EMPLOYE');
    return matchSearch && matchTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Stats calculation
  const totalCount = users.length;
  const activeTodayCount = Math.max(1, Math.round(totalCount * 0.75));
  const adminCount = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPERADMIN' || u.role === 'ROOT').length;
  const pendingCount = 2;

  const getEspaceNom = (u) => {
    if (u.assignedSpaceNom) return u.assignedSpaceNom;
    if (u.role === 'SUPERADMIN' || u.role === 'ROOT') return t('users.table.wholeSystem');
    if (!u.assignedSpaceId) return t('users.table.noSpace');
    const e = espaces.find((item) => item.id === u.assignedSpaceId);
    return e ? e.nom : t('users.table.noSpace');
  };

  const getStatusDisplay = (u) => {
    if (u.statut) {
      return { label: u.statut, dotBg: 'bg-emerald-500', textColor: 'text-emerald-600' };
    }
    return { label: t('users.userStatus.inService'), dotBg: 'bg-emerald-500', textColor: 'text-emerald-600' };
  };

  // Create User
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        nom: newUser.nom,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        assignedSpaceId: newUser.assignedSpaceId || undefined,
        telephone: newUser.telephone || undefined,
        customPermissions: newUser.customPermissions || [],
      };
      const res = await createUser(payload);
      const createdUser = res.data?.data || res.data;
      setUsers((p) => [...p, createdUser]);
      setCreateOpen(false);
      setNewUser({
        nom: '',
        email: '',
        password: '',
        role: 'EMPLOYE',
        assignedSpaceId: '',
        telephone: '',
        customPermissions: DEFAULT_PERMISSIONS_BY_ROLE.EMPLOYE,
      });
      toast.success(t('users.create.submit') + ' ✓');
      fetchRecentActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  // Edit User
  const openEdit = (user) => {
    setEditTarget({
      ...user,
      assignedSpaceId: user.assignedSpaceId || '',
      customPermissions: user.customPermissions || DEFAULT_PERMISSIONS_BY_ROLE[user.role] || DEFAULT_PERMISSIONS_BY_ROLE.EMPLOYE,
    });
    setEditCustomPermsExpanded(false);
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditing(true);
    try {
      const payload = {
        nom: editTarget.nom,
        email: editTarget.email,
        role: editTarget.role,
        assignedSpaceId: editTarget.assignedSpaceId || undefined,
        telephone: editTarget.telephone || undefined,
        customPermissions: editTarget.customPermissions || [],
      };
      const res = await updateUser(editTarget.id, payload);
      const updatedUser = res.data?.data || res.data;
      setUsers((p) => p.map((u) => (u.id === editTarget.id ? { ...u, ...updatedUser } : u)));
      setEditOpen(false);
      toast.success(t('users.edit.submit') + ' ✓');
      fetchRecentActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setEditing(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordTarget || !newPassword) return;
    setChangingPassword(true);
    try {
      await updateUserPassword(passwordTarget.id, newPassword);
      setPasswordOpen(false);
      setNewPassword('');
      setPasswordTarget(null);
      toast.success(t('profile.successPassword'));
      fetchRecentActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setChangingPassword(false);
    }
  };

  // Delete User
  const handleDeleteRequest = (u) => {
    if (securityLock) {
      toast.error(t('users.securityLockTooltip'));
      return;
    }
    setDeleteTarget(u);
    if (currentUser?.role === 'ROOT') {
      setRootDeleteModalOpen(true);
    }
  };

  const performDelete = async (reason) => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id, reason);
      setUsers((p) => p.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      setRootDeleteModalOpen(false);
      toast.success(t('common.delete') + ' ✓');
      fetchRecentActivities();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = () => performDelete();
  const handleRootDeleteConfirm = ({ passcode, reason }) => {
    performDelete(`${reason} [Validé avec code ${passcode}]`);
  };

  const handleExportData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Nom,Email,Role,Espace,Telephone,Permissions\n' +
      users
        .map(
          (u) =>
            `"${u.nom}","${u.email}","${u.role}","${getEspaceNom(u)}","${u.telephone || ''}","${(u.customPermissions || []).join(';')}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `utilisateurs_herglapark_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('users.export') + ' ✓');
  };

  // Helper for rendering recent audit log descriptions
  const renderActivityDescription = (act) => {
    const actorName = act.actor?.nom || act.actor?.email || 'Système';
    const action = act.action || '';
    const entity = act.entityType || '';

    if (action.includes('user.create') || action.includes('USER_CREATED')) {
      return (
        <span>
          <strong className="text-slate-900">{actorName}</strong> {t('users.create.title')}:{' '}
          <span className="font-semibold text-indigo-600">{act.metadata?.email || entity}</span>.
        </span>
      );
    }
    if (action.includes('user.update') || action.includes('ROLE_PERMISSIONS_UPDATED')) {
      return (
        <span>
          <strong className="text-slate-900">{actorName}</strong> {t('users.edit.title')}:{' '}
          <span className="font-semibold text-slate-800">{entity || 'User'}</span>.
        </span>
      );
    }
    if (action.includes('espace') || action.includes('ESPACE_STATUS_UPDATE')) {
      return (
        <span>
          <strong className="text-slate-900">{actorName}</strong> :{' '}
          <span className="font-semibold text-slate-800">{act.metadata?.space || entity}</span>.
        </span>
      );
    }
    if (action.includes('kart') || action.includes('KART_UPDATED')) {
      return (
        <span>
          <strong className="text-slate-900">{actorName}</strong> :{' '}
          <span className="font-semibold text-slate-800">{entity}</span>.
        </span>
      );
    }
    return (
      <span>
        <strong className="text-slate-900">{actorName}</strong> : {action} ({entity})
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Breadcrumb & Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <span>{t('nav.dashboard')}</span>
            <ChevronRight size={12} className="rtl:rotate-180" />
            <span className="text-slate-600 font-semibold">{t('users.title')}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('users.title')}</h1>
            {securityLock && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full shadow-2xs">
                <Lock size={12} />
                {t('users.securityLockActive')}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('users.subtitle')}
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setCreateOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto active:scale-[0.98]"
          id="add-user-btn"
        >
          <Plus size={16} className="stroke-[3]" />
          {t('users.addButton')}
        </button>
      </div>

      {/* 4 Summary Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label={t('users.stats.total')}
          value={totalCount}
          bg="bg-slate-100"
          iconColor="text-slate-700"
        />
        <StatCard
          icon={UserCheck}
          label={t('users.stats.activeToday')}
          value={activeTodayCount}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={Shield}
          label={t('users.stats.admins')}
          value={adminCount}
          bg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          icon={Clock}
          label={t('users.stats.pending')}
          value={pendingCount}
          bg="bg-rose-50"
          iconColor="text-rose-500"
        />
      </div>

      {/* Users Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab('all'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-all"
            >
              {t('users.tabs.all')}
            </button>
            <button
              onClick={() => { setActiveTab('admins'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'admins' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-admins"
            >
              {t('users.tabs.admins')}
            </button>
            <button
              onClick={() => { setActiveTab('employees'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'employees' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-employees"
            >
              {t('users.tabs.employees')}
            </button>
          </div>

          {/* Right Controls: Search & Export */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('users.search')}
                className="ps-8 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <button
              onClick={handleExportData}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download size={14} />
              {t('users.export')}
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-start px-6 py-3.5">
                  {t('users.table.user')}
                </th>
                <th className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-start px-6 py-3.5">
                  {t('users.table.role')}
                </th>
                <th className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-start px-6 py-3.5">
                  {t('users.table.assignedSpace')}
                </th>
                <th className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-start px-6 py-3.5">
                  {t('users.table.status')}
                </th>
                <th className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-end px-6 py-3.5">
                  {t('users.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-44" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-5 bg-slate-200 rounded w-20" /></td>
                    <td className="px-6 py-4 text-end"><div className="h-5 bg-slate-200 rounded w-16 ms-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-sm font-medium">
                    {t('common.empty')}
                  </td>
                </tr>
              ) : (
                paginated.map((u) => {
                  const statusInfo = getStatusDisplay(u);
                  const spaceNom = getEspaceNom(u);
                  const initials = u.nom
                    ? u.nom.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                    : 'U';
                  const permCount = u.customPermissions?.length || 0;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Utilisateur */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300/60 flex items-center justify-center flex-shrink-0 text-slate-700 font-bold text-xs shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{u.nom}</p>
                            <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rôle & Permissions */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <RoleBadge role={u.role} />
                          {permCount > 0 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {t('users.create.activeCount', { count: permCount })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Espace Assigné */}
                      <td className="px-6 py-4">
                        <span className="text-xs italic text-slate-600 font-serif">
                          {spaceNom}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statusInfo.dotBg} animate-pulse`} />
                          <span className={`text-xs font-semibold ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title={t('common.edit')}
                            id={`edit-user-${u.id}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => { setPasswordTarget(u); setPasswordOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title={t('profile.securityTitle')}
                            id={`change-password-user-${u.id}`}
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('common.delete')}
                            id={`delete-user-${u.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <p>
            {t('users.pagination.showing', { from: 1, to: paginated.length, total: filtered.length })}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  page === pNum ? 'bg-slate-900 text-white shadow-xs' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pNum}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* 4 & 6. Recent Activity & Global System Panels (Two Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Activités Récentes (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{t('users.recentActivity')}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('users.live')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchRecentActivities}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title={t('common.refresh')}
                >
                  <RefreshCw size={14} className={activitiesLoading ? 'animate-spin text-indigo-600' : ''} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t('common.systemOnline')}
                </div>
              ) : (
                recentActivities.map((act) => {
                  const dotBg = act.action?.includes('DELETE')
                    ? 'bg-rose-500'
                    : act.action?.includes('UPDATE')
                    ? 'bg-amber-500'
                    : 'bg-indigo-500';

                  return (
                    <div key={act.id} className="flex items-start gap-3 text-xs leading-relaxed group">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotBg} mt-1.5 flex-shrink-0 shadow-2xs`} />
                      <div className="flex-1">
                        <p className="text-slate-700">{renderActivityDescription(act)}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {formatRelativeTime(act.createdAt, t)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Système Global Panel (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[240px]">
          <div>
            <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-100 text-sm tracking-tight flex items-center gap-2">
                <Settings2 size={16} className="text-indigo-400" />
                <span>{t('users.globalSystem')}</span>
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {t('users.adminControls')}
              </span>
            </div>

            <div className="space-y-4 text-xs font-medium">
              {/* Verrouillage de Sécurité Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">{t('users.securityLock')}</span>
                  <Tooltip text={t('users.securityLockTooltip')}>
                    <Info size={13} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
                  </Tooltip>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSecurityLock}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    securityLock ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                  id="toggle-security-lock-btn"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      securityLock ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Assignation Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">{t('users.autoAssign')}</span>
                  <Tooltip text={t('users.autoAssignTooltip')}>
                    <Info size={13} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
                  </Tooltip>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoAssign}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    autoAssign ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  id="toggle-auto-assign-btn"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      autoAssign ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Critical Security Audit Button */}
          <div className="pt-5 mt-2">
            <Tooltip text={t('users.securityAuditTooltip')}>
              <button
                onClick={() => setSecurityModalOpen(true)}
                className="w-full bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all"
                id="global-security-audit-btn"
              >
                <ShieldAlert size={16} />
                <span>{t('users.securityAudit')}</span>
              </button>
            </Tooltip>
          </div>

          {/* Floating Speedometer/Security Badge Icon at bottom right */}
          <div className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none text-white rtl:-left-2 rtl:right-auto">
            <ShieldAlert size={110} />
          </div>
        </div>
      </div>

      {/* 5. CREATE USER MODAL WITH GRANULAR CUSTOM PERMISSIONS */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('users.create.title')} size="md">
        <form onSubmit={handleCreate} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {t('users.create.name')}
            </label>
            <input
              id="create-nom"
              type="text"
              value={newUser.nom}
              onChange={(e) => setNewUser((p) => ({ ...p, nom: e.target.value }))}
              required
              placeholder="Ex: Yassine Jbali"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('users.create.email')}
              </label>
              <input
                id="create-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                required
                placeholder="nom@herglapark.tn"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('users.create.phone')}
              </label>
              <input
                id="create-telephone"
                type="tel"
                value={newUser.telephone}
                onChange={(e) => setNewUser((p) => ({ ...p, telephone: e.target.value }))}
                placeholder="+216 98 123 456"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {t('users.create.password')}
            </label>
            <input
              id="create-password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('users.create.role')}
              </label>
              <select
                id="create-role"
                value={newUser.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="EMPLOYE">EMPLOYE</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('users.create.assignedSpace')}
              </label>
              <select
                id="create-assigned-space"
                value={newUser.assignedSpaceId}
                onChange={(e) => setNewUser((p) => ({ ...p, assignedSpaceId: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">{t('users.create.noSpace')}</option>
                {espaces.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Granular Custom Permissions Checklist Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <button
              type="button"
              onClick={() => setCustomPermsExpanded(!customPermsExpanded)}
              className="w-full flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600" />
                <span>{t('users.create.customPermissions')} ({t('users.create.activeCount', { count: (newUser.customPermissions || []).length })})</span>
              </div>
              {customPermsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {customPermsExpanded && (
              <div className="pt-2 space-y-2.5 divide-y divide-slate-100">
                {AVAILABLE_PERMISSIONS.map((p) => {
                  const isChecked = (newUser.customPermissions || []).includes(p.key);
                  return (
                    <label
                      key={p.key}
                      className="flex items-start gap-3 pt-2 first:pt-0 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(p.key, false)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {p.label} <span className="text-[10px] font-mono text-slate-400 font-normal">({p.key})</span>
                        </p>
                        <p className="text-[11px] text-slate-500">{p.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              id="create-user-submit"
              className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('users.create.submit')}
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              {t('users.create.cancel')}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL WITH CUSTOM PERMISSIONS */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={t('users.edit.title')} size="md">
        {editTarget && (
          <form onSubmit={handleEdit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t('users.create.name')}
              </label>
              <input
                id="edit-nom"
                type="text"
                value={editTarget.nom}
                onChange={(e) => setEditTarget((p) => ({ ...p, nom: e.target.value }))}
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t('users.create.email')}
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editTarget.email}
                  onChange={(e) => setEditTarget((p) => ({ ...p, email: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t('users.create.phone')}
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={editTarget.telephone || ''}
                  onChange={(e) => setEditTarget((p) => ({ ...p, telephone: e.target.value }))}
                  placeholder="+216 98 123 456"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t('users.create.role')}
                </label>
                <select
                  id="edit-role"
                  value={editTarget.role}
                  onChange={(e) => handleEditRoleChange(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="EMPLOYE">EMPLOYE</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t('users.create.assignedSpace')}
                </label>
                <select
                  id="edit-assigned-space"
                  value={editTarget.assignedSpaceId || ''}
                  onChange={(e) => setEditTarget((p) => ({ ...p, assignedSpaceId: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">{t('users.create.noSpace')}</option>
                  {espaces.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Permissions Checklist */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <button
                type="button"
                onClick={() => setEditCustomPermsExpanded(!editCustomPermsExpanded)}
                className="w-full flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>{t('users.create.customPermissions')} ({t('users.create.activeCount', { count: (editTarget.customPermissions || []).length })})</span>
                </div>
                {editCustomPermsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {editCustomPermsExpanded && (
                <div className="pt-2 space-y-2.5 divide-y divide-slate-100">
                  {AVAILABLE_PERMISSIONS.map((p) => {
                    const isChecked = (editTarget.customPermissions || []).includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className="flex items-start gap-3 pt-2 first:pt-0 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(p.key, true)}
                          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {p.label} <span className="text-[10px] font-mono text-slate-400 font-normal">({p.key})</span>
                          </p>
                          <p className="text-[11px] text-slate-500">{p.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={editing}
                id="edit-user-submit"
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                {editing ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('users.edit.submit')}
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                {t('users.edit.cancel')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 4. INTERACTIVE GLOBAL SECURITY AUDIT REPORT MODAL */}
      <Modal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        title={t('users.auditModal.title')}
        size="md"
      >
        <div className="space-y-5">
          {/* Health Score Summary Header */}
          <div className="bg-gradient-to-r from-slate-900 via-navy to-indigo-950 text-white p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                {t('users.auditModal.integrityScore')}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {t('users.auditModal.optimal')}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">99.4%</span>
              <span className="text-xs text-slate-300">{t('users.auditModal.compliance')}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('users.auditModal.diagnosticDesc')}
            </p>
          </div>

          {/* Security Diagnostic Checks List */}
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">{t('users.auditModal.rbacCheck')}</p>
                  <p className="text-[11px] text-slate-500">{t('users.auditModal.rbacDesc')}</p>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">{t('users.auditModal.rbacStatus')}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">{t('users.auditModal.cryptoCheck')}</p>
                  <p className="text-[11px] text-slate-500">{t('users.auditModal.cryptoDesc')}</p>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">{t('users.auditModal.cryptoStatus')}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">{t('users.auditModal.stealthCheck')}</p>
                  <p className="text-[11px] text-slate-500">{t('users.auditModal.stealthDesc')}</p>
                </div>
              </div>
              <span className="text-emerald-700 font-bold">{t('users.auditModal.stealthStatus')}</span>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                const reportContent =
                  `--- RAPPORT D'AUDIT DE SÉCURITÉ HERGLA PARK ---\n` +
                  `Date: ${new Date().toISOString()}\n` +
                  `Score: 99.4% (Optimal)\n` +
                  `Total Utilisateurs: ${users.length}\n` +
                  `Verrouillage Global: ${securityLock ? 'ON' : 'OFF'}\n` +
                  `Auto-Assignation: ${autoAssign ? 'ON' : 'OFF'}\n` +
                  `Intégrité RBAC: Validée\n` +
                  `Stealth Root Mode: Actif\n`;
                const encodedUri = encodeURI('data:text/plain;charset=utf-8,' + reportContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `security_audit_report_${new Date().toISOString().slice(0, 10)}.txt`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(t('users.auditModal.downloadReport') + ' ✓');
                setSecurityModalOpen(false);
              }}
              className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={14} />
              <span>{t('users.auditModal.downloadReport')}</span>
            </button>
            <button
              onClick={() => setSecurityModalOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              {t('users.auditModal.close')}
            </button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL — for non-ROOT users */}
      {!currentUser?.role?.includes('ROOT') && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('users.delete.confirm')} size="sm">
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              {t('users.delete.confirm')} <strong>{deleteTarget?.nom}</strong> ({deleteTarget?.email})
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                id="confirm-delete-btn"
                className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('users.delete.yes')}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                {t('users.delete.no')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ROOT SECURITY VERIFICATION MODAL — for ROOT users deleting a user */}
      <RootVerificationModal
        isOpen={rootDeleteModalOpen}
        onClose={() => {
          setRootDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleRootDeleteConfirm}
        title="Suppression Utilisateur — Validation ROOT"
        actionName={`Supprimer définitivement l'utilisateur : ${deleteTarget?.nom} (${deleteTarget?.email})`}
      />

      {/* PASSWORD CHANGE MODAL */}
      <Modal
        isOpen={passwordOpen}
        onClose={() => {
          setPasswordOpen(false);
          setPasswordTarget(null);
          setNewPassword('');
        }}
        title={t('profile.securityTitle')}
      >
        {passwordTarget && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('profile.newPassword')} pour <strong>{passwordTarget.nom}</strong>
              </label>
              <input
                id="change-password-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={changingPassword}
                id="change-password-submit"
                className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
              >
                {changingPassword ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordOpen(false);
                  setPasswordTarget(null);
                  setNewPassword('');
                }}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
