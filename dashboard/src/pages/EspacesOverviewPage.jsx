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
import toast from 'react-hot-toast';

const CATEGORIES = ['Karting', 'Restaurant', 'Paintball', 'Zone Enfants', 'Café', 'Aquatique', 'Jardin', 'Autre'];
const STATUS_OPTIONS = [
  { value: 'OUVERT', label: 'Ouvert', color: 'text-emerald-600' },
  { value: 'FERME', label: 'Fermé', color: 'text-red-500' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-amber-600' },
];

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

function QuickNavCard({ title, description, icon: Icon, to, badgeText, gradient }) {
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
        <span>Accéder au module</span>
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
        setError('Impossible de charger les espaces.');
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
  }, [fetchData]);

  // Status toggle callback from EspaceCard
  const handleUpdateEspace = useCallback((updated) => {
    setEspaces((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
    toast.success('Statut de l\'espace mis à jour');
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
      toast.success('Espace créé avec succès');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
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
      <div className="relative rounded-3xl bg-gradient-to-r from-navy via-slate-900 to-indigo-950 text-white p-8 overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-400 backdrop-blur-md">
            <Zap size={14} />
            <span>Panneau Global Hergla Park Admin</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Vue d'Ensemble & Dashboard Global
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Supervisez en temps réel les espaces d'attraction, les configurations de karts, les scènes 3D interactives et le journal des audits système.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-white text-navy font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors shadow-md flex items-center gap-2"
              id="dashboard-create-space-btn"
            >
              <Plus size={18} />
              Nouveau Espace
            </button>
            <Link
              to="/editeur-3d"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors backdrop-blur-md flex items-center gap-2"
            >
              <Box size={18} />
              Éditeur 3D
            </Link>
          </div>
        </div>

        {/* Decorative backdrop elements */}
        <div className="absolute -end-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMetricCard
          icon={CheckCircle}
          label="Espaces Ouverts"
          value={ouverts}
          subtext={`${espaces.length} espaces au total`}
          bg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatMetricCard
          icon={Flag}
          label="Flotte Karts"
          value="12 Karts"
          subtext="Sodi RT10, 2Drive & LR5"
          bg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatMetricCard
          icon={Users}
          label="Staff & Opérateurs"
          value={totalStaff || 8}
          subtext="Affectés aux pistes & espaces"
          bg="bg-indigo-50"
          iconColor="text-indigo-500"
        />
        <StatMetricCard
          icon={ShieldCheck}
          label="Activité Système"
          value={recentLogs.length ? `${recentLogs.length} Events` : '100% OK'}
          subtext="Audits enregistrés"
          bg="bg-purple-50"
          iconColor="text-purple-500"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Layers size={20} className="text-navy" />
          <span>Accès Rapide aux Modules</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickNavCard
            title="Éditeur 3D Interactif"
            description="Visualisez et organisez le mobilier 3D des espaces en temps réel."
            icon={Box}
            to="/editeur-3d"
            badgeText="Studio 3D"
            gradient="bg-gradient-to-r from-blue-500 to-indigo-600"
          />
          <QuickNavCard
            title="Configuration Karts"
            description="Gérez la flotte, attribuez les numéros de course et les couleurs."
            icon={Flag}
            to="/configuration-karts"
            badgeText="Karting"
            gradient="bg-gradient-to-r from-emerald-500 to-teal-600"
          />
          <QuickNavCard
            title="Gestion Utilisateurs"
            description="Administrez les rôles, permissions et l'accès multi-entreprises."
            icon={Users}
            to="/utilisateurs"
            badgeText="Multi-Tenant"
            gradient="bg-gradient-to-r from-purple-500 to-pink-600"
          />
          <QuickNavCard
            title="Logs d'Audit"
            description="Consultez l'historique complet des actions et modifications système."
            icon={ShieldCheck}
            to="/audit-logs"
            badgeText="Sécurité"
            gradient="bg-gradient-to-r from-amber-500 to-orange-600"
          />
        </div>
      </div>

      {/* Espaces List Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Map size={20} className="text-navy" />
            <span>Espaces d'Attractions & Restauration</span>
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
            <h2 className="font-bold text-slate-800 text-base">Activité Récente & Audit Logs</h2>
          </div>
          <Link
            to="/audit-logs"
            className="text-xs font-bold text-navy hover:underline flex items-center gap-1"
          >
            Voir tous les logs
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
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Créer un nouvel Espace">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de l'espace</label>
            <input
              type="text"
              value={newEspace.nom}
              onChange={(e) => setNewEspace((p) => ({ ...p, nom: e.target.value }))}
              required
              placeholder="ex: Piste Karting Principale"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label>
            <select
              value={newEspace.categorie}
              onChange={(e) => setNewEspace((p) => ({ ...p, categorie: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              <option value="">— Sélectionner —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 disabled:opacity-60"
            >
              {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Créer l\'espace'}
            </button>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      {/* ROOT Verification Security Modal */}
      <RootVerificationModal
        isOpen={rootCreateModalOpen}
        onClose={() => setRootCreateModalOpen(false)}
        onConfirm={handleRootCreateConfirm}
        title="Création d'Espace — Validation ROOT"
        actionName={`Créer l'espace : ${newEspace.nom} (${newEspace.categorie})`}
      />
    </div>
  );
}
