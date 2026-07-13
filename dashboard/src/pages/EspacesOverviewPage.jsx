import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getEspaces, createEspace, updateEspace, deleteEspace } from '../api/espacesApi';
import EspaceCard from '../components/EspaceCard';
import SkeletonCard from '../components/SkeletonCard';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import {
  CheckCircle, XCircle, Wrench, Users, Plus, RefreshCw, Map,
  Edit2, Trash2, Loader2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Karting', 'Restaurant', 'Paintball', 'Zone Enfants', 'Café', 'Aquatique', 'Jardin', 'Autre'];
const STATUS_OPTIONS = [
  { value: 'OUVERT', label: 'Ouvert', color: 'text-emerald-600' },
  { value: 'FERME', label: 'Fermé', color: 'text-red-500' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-amber-600' },
];

function StatCard({ icon: Icon, label, value, bg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="text-slate-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function EspacesOverviewPage() {
  const { t } = useTranslation();
  const [espaces, setEspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEspace, setNewEspace] = useState({ nom: '', categorie: '', statut: 'OUVERT' });

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editFields, setEditFields] = useState([]);
  const [editing, setEditing] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchEspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEspaces();
      setEspaces(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchEspaces(); }, [fetchEspaces]);

  // Status toggle callback from EspaceCard
  const handleUpdateEspace = useCallback((updated) => {
    setEspaces((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
    toast.success('Statut mis à jour');
  }, []);

  // ── CREATE ────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEspace.nom || !newEspace.categorie) return;
    setCreating(true);
    try {
      const res = await createEspace({ nom: newEspace.nom, categorie: newEspace.categorie, statut: newEspace.statut });
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

  // ── EDIT ─────────────────────────────────────────────────────────────────
  const openEdit = (espace, e) => {
    e.stopPropagation();
    setEditTarget({ ...espace });
    if (espace.donneesSpecifiques && typeof espace.donneesSpecifiques === 'object') {
      setEditFields(
        Object.entries(espace.donneesSpecifiques).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      );
    } else {
      setEditFields([]);
    }
  };

  const handleEdit = async (ev) => {
    ev.preventDefault();
    if (!editTarget) return;
    setEditing(true);

    const donneesSpecifiques = Object.fromEntries(
      editFields.filter((f) => f.key.trim()).map((f) => [f.key.trim(), f.value])
    );

    try {
      const payload = {
        nom: editTarget.nom,
        categorie: editTarget.categorie,
        statut: editTarget.statut,
        donneesSpecifiques,
      };
      const res = await updateEspace(editTarget.id, payload);
      const updated = res.data.data || res.data;
      setEspaces((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
      setEditTarget(null);
      toast.success('Espace mis à jour');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setEditing(false);
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const openDelete = (espace, e) => {
    e.stopPropagation();
    setDeleteConfirmText('');
    setDeleteTarget(espace);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirmText !== deleteTarget.nom) return;
    setDeleting(true);
    try {
      await deleteEspace(deleteTarget.id);
      setEspaces((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Espace supprimé');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // Computed stats
  const ouverts = espaces.filter((e) => e.statut === 'OUVERT').length;
  const fermes = espaces.filter((e) => e.statut === 'FERME').length;
  const maintenance = espaces.filter((e) => e.statut === 'MAINTENANCE').length;
  const totalStaff = espaces.reduce((acc, e) => acc + (e.employes?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('spaces.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('spaces.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEspaces}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500"
            id="refresh-espaces-btn"
            title="Rafraîchir"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
            id="create-espace-btn"
          >
            <Plus size={16} />
            {t('spaces.createButton')}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label={t('spaces.stats.open')} value={ouverts} bg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatCard icon={XCircle} label={t('spaces.stats.closed')} value={fermes} bg="bg-red-50" iconColor="text-red-500" />
        <StatCard icon={Wrench} label={t('spaces.stats.maintenance')} value={maintenance} bg="bg-amber-50" iconColor="text-amber-500" />
        <StatCard icon={Users} label={t('spaces.stats.activeStaff')} value={totalStaff} bg="bg-blue-50" iconColor="text-blue-500" />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={fetchEspaces} className="text-red-600 text-sm font-medium hover:underline">{t('common.retry')}</button>
        </div>
      )}

      {/* Espaces grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : espaces.map((espace) => (
              <EspaceCard
                key={espace.id}
                espace={espace}
                onUpdate={handleUpdateEspace}
                onEdit={(e) => openEdit(espace, e)}
                onDelete={(e) => openDelete(espace, e)}
              />
            ))}
      </div>

      {!loading && espaces.length === 0 && !error && (
        <div className="text-center py-16 text-slate-400">
          <Map size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun espace trouvé. Créez votre premier espace.</p>
        </div>
      )}

      {/* Recent alerts table */}
      {!loading && espaces.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">{t('spaces.recentAlerts')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['table.space', 'table.type', 'table.status'].map((key) => (
                    <th key={key} className="text-start px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t(`spaces.${key}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {espaces.slice(0, 5).map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{e.nom}</td>
                    <td className="px-5 py-3 text-slate-500">{e.categorie}</td>
                    <td className="px-5 py-3"><StatusBadge status={e.statut} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ─────────────────────────────────────────────────────── */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title={t('spaces.create.title')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('spaces.create.name')}</label>
            <input
              id="create-espace-nom"
              type="text"
              value={newEspace.nom}
              onChange={(e) => setNewEspace((p) => ({ ...p, nom: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('spaces.create.category')}</label>
            <select
              id="create-espace-categorie"
              value={newEspace.categorie}
              onChange={(e) => setNewEspace((p) => ({ ...p, categorie: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
            >
              <option value="">— Sélectionner —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Statut initial</label>
            <select
              id="create-espace-statut"
              value={newEspace.statut}
              onChange={(e) => setNewEspace((p) => ({ ...p, statut: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
            >
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              id="create-espace-submit"
              className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 disabled:opacity-60 transition-colors"
            >
              {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('spaces.create.submit')}
            </button>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              {t('spaces.create.cancel')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT MODAL ───────────────────────────────────────────────────────── */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Modifier l'espace">
        {editTarget && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label>
              <input
                id="edit-espace-nom"
                type="text"
                value={editTarget.nom}
                onChange={(e) => setEditTarget((p) => ({ ...p, nom: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label>
              <select
                id="edit-espace-categorie"
                value={editTarget.categorie}
                onChange={(e) => setEditTarget((p) => ({ ...p, categorie: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Statut</label>
              <select
                id="edit-espace-statut"
                value={editTarget.statut}
                onChange={(e) => setEditTarget((p) => ({ ...p, statut: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Données spécifiques (scores, activités, etc.)</label>
              <div className="space-y-2 mb-3">
                {editFields.map((field, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Clé (ex: menu)"
                      value={field.key}
                      onChange={(e) => setEditFields(p => p.map((f, idx) => idx === i ? { ...f, key: e.target.value } : f))}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                    <input
                      type="text"
                      placeholder="Valeur"
                      value={field.value}
                      onChange={(e) => setEditFields(p => p.map((f, idx) => idx === i ? { ...f, value: e.target.value } : f))}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                    <button
                      type="button"
                      onClick={() => setEditFields(p => p.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEditFields(p => [...p, { key: '', value: '' }])}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-navy transition-colors font-semibold"
              >
                <Plus size={12} />
                Ajouter un champ
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={editing}
                id="edit-espace-submit"
                className="flex-1 bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/90 disabled:opacity-60"
              >
                {editing ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────────────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer l'espace" size="sm">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">
                Cette action est <strong>irréversible</strong>. Toutes les données de l'espace{' '}
                <strong>{deleteTarget.nom}</strong> seront supprimées définitivement.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tapez <strong className="text-slate-800">{deleteTarget.nom}</strong> pour confirmer :
              </label>
              <input
                id="delete-espace-confirm-input"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget.nom}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText !== deleteTarget.nom}
                id="confirm-delete-espace-btn"
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Supprimer définitivement'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
