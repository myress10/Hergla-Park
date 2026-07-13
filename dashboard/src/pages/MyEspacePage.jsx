import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getEspace, updateEspace } from '../api/espacesApi';
import StatusBadge from '../components/StatusBadge';
import { CheckCircle, Wrench, XOctagon, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Category image fallbacks
const CATEGORY_IMAGES = {
  karting: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  restaurant: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
  paintball: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=80',
  'zone enfants': 'https://images.unsplash.com/photo-1525103504173-8dc1582c7430?w=1200&q=80',
  café: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
};

function getHeroImage(espace) {
  if (!espace) return CATEGORY_IMAGES.default;
  if (espace.imageUrl) return espace.imageUrl;
  const key = (espace.categorie || '').toLowerCase();
  return CATEGORY_IMAGES[key] || CATEGORY_IMAGES.default;
}

export default function MyEspacePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [espace, setEspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState([]); // [{key, value}]

  // Fetch the user's assigned space
  const fetchEspace = useCallback(async () => {
    if (!user?.assignedSpaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getEspace(user.assignedSpaceId);
      const data = res.data.data;
      setEspace(data);

      // Parse donneesSpecifiques JSON into key/value pairs
      if (data.donneesSpecifiques && typeof data.donneesSpecifiques === 'object') {
        setFields(
          Object.entries(data.donneesSpecifiques).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
      } else {
        setFields([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [user?.assignedSpaceId, t]);

  useEffect(() => {
    fetchEspace();
  }, [fetchEspace]);

  // Status update
  const handleStatusChange = async (newStatus) => {
    if (!espace) return;
    const previous = espace.statut;
    setEspace((p) => ({ ...p, statut: newStatus })); // optimistic
    try {
      const res = await updateEspace(espace.id, { statut: newStatus });
      setEspace(res.data.data || res.data);
      toast.success(t('mySpace.updateSuccess'));
    } catch (err) {
      setEspace((p) => ({ ...p, statut: previous })); // rollback
      toast.error(err.response?.data?.message || t('mySpace.updateError'));
    }
  };

  // Save donneesSpecifiques
  const handleSave = async () => {
    if (!espace) return;
    setSaving(true);
    const donneesSpecifiques = Object.fromEntries(
      fields.filter((f) => f.key.trim()).map((f) => [f.key.trim(), f.value])
    );
    try {
      const res = await updateEspace(espace.id, { donneesSpecifiques });
      setEspace(res.data.data || res.data);
      toast.success(t('mySpace.updateSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('mySpace.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const addField = () => setFields((p) => [...p, { key: '', value: '' }]);
  const removeField = (i) => setFields((p) => p.filter((_, idx) => idx !== i));
  const updateField = (i, prop, val) =>
    setFields((p) => p.map((f, idx) => (idx === i ? { ...f, [prop]: val } : f)));

  if (!user?.assignedSpaceId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <XOctagon size={48} className="opacity-30" />
        <p className="text-lg font-medium">Aucun espace assigné</p>
        <p className="text-sm">Contactez votre administrateur pour une assignation.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="h-24 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!espace) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden h-64">
        <img
          src={getHeroImage(espace)}
          alt={espace.nom}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-5 start-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {espace.statut === 'OUVERT' ? 'Currently Open' : espace.statut}
            </span>
          </div>
          <h1 className="text-white text-2xl font-bold">{espace.nom}</h1>
          <p className="text-white/70 text-sm">{espace.categorie}</p>
        </div>
      </div>

      {/* Status controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {t('mySpace.operationalStatus')}
        </p>
        <p className="text-sm text-slate-700 font-medium mb-4">{t('mySpace.updateAccessibility')}</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleStatusChange('OUVERT')}
            id="status-open-btn"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${espace.statut === 'OUVERT'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <CheckCircle size={16} />
            {t('mySpace.openTrack')}
          </button>
          <button
            onClick={() => handleStatusChange('MAINTENANCE')}
            id="status-maintenance-btn"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${espace.statut === 'MAINTENANCE'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <Wrench size={16} />
            {t('mySpace.maintenance')}
          </button>
          <button
            onClick={() => handleStatusChange('FERME')}
            id="status-close-btn"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${espace.statut === 'FERME'
                ? 'bg-red-500 text-white shadow-md shadow-red-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            <XOctagon size={16} />
            {t('mySpace.emergencyClose')}
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: donneesSpecifiques form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-5">{t('mySpace.dailyReport')}</h2>
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder={t('mySpace.keyLabel')}
                  value={field.key}
                  onChange={(e) => updateField(i, 'key', e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  id={`field-key-${i}`}
                />
                <input
                  type="text"
                  placeholder={t('mySpace.valueLabel')}
                  value={field.value}
                  onChange={(e) => updateField(i, 'value', e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                  id={`field-value-${i}`}
                />
                <button
                  onClick={() => removeField(i)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('mySpace.removeField')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={addField}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors"
              id="add-field-btn"
            >
              <Plus size={16} />
              {t('mySpace.addField')}
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            id="save-espace-btn"
            className="w-full mt-5 bg-navy text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2
              hover:bg-navy/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('mySpace.saveUpdate')}
          </button>
        </div>

        {/* Right: Quick stats */}
        <div className="space-y-4">
          {/* Current status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Statut Actuel
            </h3>
            <StatusBadge status={espace.statut} size="lg" />
          </div>

          {/* Staff info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {t('mySpace.quickStats')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Staff assigné</span>
                <span className="font-semibold text-slate-800">{espace.employes?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Catégorie</span>
                <span className="font-semibold text-slate-800">{espace.categorie}</span>
              </div>
              {/* Dynamic donneesSpecifiques preview */}
              {Object.entries(espace.donneesSpecifiques || {}).slice(0, 4).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-500 capitalize">{k}</span>
                  <span className="font-semibold text-slate-800">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
