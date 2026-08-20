import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEspaces, createEspace, updateEspace, deleteEspace } from '../api/espacesApi';
import { getAuditLogs } from '../api/auditLogsApi';
import EspaceCard from '../components/EspaceCard';
import SkeletonCard from '../components/SkeletonCard';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { getEspaceImage, handleImageError } from '../utils/imageUtils';
import {
  CheckCircle, XCircle, Wrench, Users, Plus, RefreshCw, Map,
  Flag, Box, ShieldCheck, ArrowRight, Activity, Zap, Layers, AlertTriangle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RootVerificationModal from '../components/RootVerificationModal';
import { subscribeActivity } from '../utils/activityBus';
import toast from 'react-hot-toast';

const CATEGORIES = ['Karting', 'Restaurant', 'Paintball', 'Zone Enfants', 'Café', 'Aquatique', 'Jardin', 'Autre'];

function StatMetricCard({ icon: Icon, label, value, subtext, bg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={24} className={iconColor} />
        </div>
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-extrabold text-slate-800 leading-tight">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}

function QuickNavCard({ title, description, icon: Icon, to, badgeText, gradient, accessLabel }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
    >
      <div className={`absolute top-0 start-0 w-full h-1.5 ${gradient}`} />
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-navy group-hover:text-white transition-colors flex items-center justify-center text-slate-700">
            <Icon size={20} />
          </div>
          {badgeText && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {badgeText}
            </span>
          )}
        </div>
        <h3 className="font-bold text-slate-800 group-hover:text-navy text-base transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>
      </div>

      <div className="flex items-center text-xs font-bold text-navy mt-4 gap-1 group-hover:translate-x-1 transition-transform">
        <span>{accessLabel || title}</span>
        <ArrowRight size={14} />
      </div>
    </Link>
  );
}

export default function EspacesOverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [espaces, setEspaces] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEspace, setNewEspace] = useState({ nom: '', categorie: '', statut: 'OUVERT' });

  const [editTarget, setEditTarget] = useState(null);
  const [editFields, setEditFields] = useState([]);
  const [editing, setEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [espacesRes, logsRes] = await Promise.allSettled([
        getEspaces(),
        getAuditLogs({ limit: 5 }),
      ]);

      if (espacesRes.status === 'fulfilled') {
        setEspaces(espacesRes.value.data.data || []);
      } else {
        setError(t('common.error'));
      }

      if (logsRes.status === 'fulfilled' && logsRes.value.data) {
        setRecentLogs(logsRes.value.data || []);
      }
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();

    // Subscribe to instant local and cross-tab updates (0ms)
    const unsubscribe = subscribeActivity(() => {
      fetchData();
    });

    // 2-second heartbeat sync
    const intervalId = setInterval(() => {
      fetchData();
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [fetchData]);

  // Status toggle callback from EspaceCard
  const handleUpdateEspace = useCallback((updated) => {
    setEspaces((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
  }, []);

  const { user } = useAuth();
  const [rootCreateModalOpen, setRootCreateModalOpen] = useState(false);

  // ── CREATE ────────────────────────────────────────────────────────────────
  const performCreate = async (reason) => {
    if (!newEspace.nom || !newEspace.categorie) return;
    setCreating(true);
    try {
      const res = await createEspace({ nom: newEspace.nom, categorie: newEspace.categorie, statut: newEspace.statut }, reason);
      setEspaces((prev) => [...prev, res.data.data || res.data]);
      setCreateModalOpen(false);
      setNewEspace({ nom: '', categorie: '', statut: 'OUVERT' });
      toast.success(t('spaces.create.success'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('spaces.create.error'));
    } finally {
      setCreating(false);
    }
  };

  const handleCreate = (e) => {
    if (e) e.preventDefault();
    if (!newEspace.nom || !newEspace.categorie) return;
    if (user?.role === 'ROOT') {
      setRootCreateModalOpen(true);
      return;
    }
    performCreate();
  };

  const handleRootCreateConfirm = ({ passcode, reason }) => {
    performCreate(`${reason} [Validé avec code ${passcode}]`);
  };

  // Computed stats
  const ouverts = espaces.filter((e) => e.statut === 'OUVERT').length;
  const fermes = espaces.filter((e) => e.statut === 'FERME').length;
  const maintenance = espaces.filter((e) => e.statut === 'MAINTENANCE').length;
  const totalStaff = espaces.reduce((acc, e) => acc + (e.employes?.length || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-2xl border border-indigo-500/20">
        {/* Glow ambient background orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl space-y-3.5">
            {/* Glowing Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-400/30 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <Zap size={13} className="text-emerald-400" />
              <span>{t('spaces.globalPanel')}</span>
            </div>

            {/* Heading with high contrast & radiant gradient accent */}
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {t('spaces.overviewTitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-emerald-300">{t('spaces.overviewGradient')}</span>
            </h1>

            {/* Crisp, readable subtitle */}
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
              {t('spaces.overviewDesc')}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 hover:shadow-emerald-400/30 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                id="dashboard-create-space-btn"
              >
                <Plus size={18} />
                {t('spaces.createButton')}
              </button>
              <Link
                to="/editeur-3d"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all border border-white/20 backdrop-blur-md flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Box size={18} />
                {t('spaces.editor3dButton')}
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4.5 min-w-[250px] text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">{t('spaces.systemPark')}</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t('spaces.live247')}
              </span>
            </div>
            <div className="space-y-1.5 pt-0.5">
              <div className="flex justify-between text-slate-300">
                <span>{t('spaces.activeSpaces')}</span>
                <span className="font-extrabold text-white">{ouverts} / {espaces.length}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{t('spaces.sessionRole')}</span>
                <span className="font-bold text-emerald-300">{user?.role || 'SuperAdmin'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{t('spaces.auditEvents')}</span>
                <span className="font-bold text-blue-300">{t('spaces.recentCount', { count: recentLogs.length })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          icon={CheckCircle}
          label={t('spaces.stats.open')}
          value={ouverts}
          subtext={t('spaces.stats.totalSpacesCount', { count: espaces.length })}
          bg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatMetricCard
          icon={Flag}
          label={t('spaces.stats.fleet')}
          value="12 Karts"
          subtext={t('spaces.stats.fleetSub')}
          bg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatMetricCard
          icon={Users}
          label={t('spaces.stats.activeStaff')}
          value={totalStaff || 8}
          subtext={t('spaces.stats.staffSub')}
          bg="bg-indigo-50"
          iconColor="text-indigo-500"
        />
        <StatMetricCard
          icon={ShieldCheck}
          label={t('spaces.stats.activity')}
          value={recentLogs.length ? `${recentLogs.length} Events` : '100% OK'}
          subtext={t('spaces.stats.activitySub')}
          bg="bg-purple-50"
          iconColor="text-purple-500"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Layers size={20} className="text-navy" />
          <span>{t('spaces.quickAccessTitle')}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickNavCard
            title={t('nav.editor3d')}
            description={t('sceneEditor.subtitle')}
            icon={Box}
            to="/editeur-3d"
            badgeText="Studio 3D"
            gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
            accessLabel={t('spaces.accessModule')}
          />
          <QuickNavCard
            title={t('nav.kartsConfig')}
            description={t('karts.subtitle')}
            icon={Flag}
            to="/configuration-karts"
            badgeText="Karting"
            gradient="bg-gradient-to-r from-emerald-500 to-teal-600"
            accessLabel={t('spaces.accessModule')}
          />
          <QuickNavCard
            title={t('nav.users')}
            description={t('users.subtitle')}
            icon={Users}
            to="/utilisateurs"
            badgeText="Multi-Tenant"
            gradient="bg-gradient-to-r from-purple-500 to-pink-600"
            accessLabel={t('spaces.accessModule')}
          />
          <QuickNavCard
            title={t('nav.auditLogs')}
            description={t('audit.subtitle')}
            icon={ShieldCheck}
            to="/audit-logs"
            badgeText={t('users.categories.security')}
            gradient="bg-gradient-to-r from-amber-500 to-orange-600"
            accessLabel={t('spaces.accessModule')}
          />
        </div>
      </div>

      {/* Espaces List Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Map size={20} className="text-navy" />
            <span>{t('spaces.title')}</span>
          </h2>
          <button
            onClick={fetchData}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500"
            id="refresh-overview-btn"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : espaces.map((espace) => (
                <EspaceCard
                  key={espace.id}
                  espace={espace}
                  onUpdate={handleUpdateEspace}
                  onClick={() => navigate(`/espaces/${espace.id}`)}
                />
              ))}
        </div>
      </div>

      {/* Recent Audit Logs Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-navy" />
            <h2 className="font-bold text-slate-800 text-base">{t('spaces.recentAlerts')}</h2>
          </div>
          <Link
            to="/audit-logs"
            className="text-xs font-bold text-navy hover:underline flex items-center gap-1"
          >
            {t('common.viewAll')}
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-bold text-slate-800">{log.actor?.nom}</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                  {log.action}
                </span>
                <span className="text-slate-500">{log.entityType}</span>
              </div>
              <span className="text-slate-400">{log.company?.nom || 'Global'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title={t('spaces.create.title')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('spaces.create.name')}</label>
            <input
              type="text"
              value={newEspace.nom}
              onChange={(e) => setNewEspace((p) => ({ ...p, nom: e.target.value }))}
              required
              placeholder={t('spaces.create.namePlaceholder')}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('spaces.create.category')}</label>
            <select
              value={newEspace.categorie}
              onChange={(e) => setNewEspace((p) => ({ ...p, categorie: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              <option value="">{t('spaces.create.selectCategory')}</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 disabled:opacity-60"
            >
              {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('spaces.create.submit')}
            </button>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
            >
              {t('spaces.create.cancel')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ROOT Verification Security Modal */}
      <RootVerificationModal
        isOpen={rootCreateModalOpen}
        onClose={() => setRootCreateModalOpen(false)}
        onConfirm={handleRootCreateConfirm}
        title={t('rootModal.title')}
        actionName={`${t('spaces.create.submit')}: ${newEspace.nom} (${newEspace.categorie})`}
      />
    </div>
  );
}
