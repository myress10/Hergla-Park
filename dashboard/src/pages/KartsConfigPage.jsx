import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getEspaces, getEspace } from '../api/espacesApi';
import { getKarts, createKart, updateKart, deleteKart, reorderKarts } from '../api/kartsApi';
import KartList from '../components/karts/KartList';
import KartPreviewCanvas from '../components/karts/KartPreviewCanvas';
import { PRESET_COLORS } from '../components/karts/KartFormRow';
import { Flag, Save, Loader2, Layers, AlertCircle, ChevronDown, CheckCircle, Lock, Sparkles, ArrowRight } from 'lucide-react';
import RootVerificationModal from '../components/RootVerificationModal';
import FeatureLockModal from '../components/subscription/FeatureLockModal';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function KartsConfigPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { espaceId: paramEspaceId } = useParams();
  const navigate = useNavigate();

  // Space selection
  const [espaces, setEspaces] = useState([]);
  const [selectedEspaceId, setSelectedEspaceId] = useState(
    paramEspaceId || user?.assignedSpaceId || ''
  );
  const [espace, setEspace] = useState(null);
  const [espaceLoading, setEspaceLoading] = useState(true);

  // Karts state
  const [karts, setKarts] = useState([]);
  const [deletedKartIds, setDeletedKartIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lockedBySubscription, setLockedBySubscription] = useState(false);
  const [featureLockModalOpen, setFeatureLockModalOpen] = useState(false);

  // Warn before leaving with unsaved changes
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Load all spaces for SUPERADMIN dropdown selector
  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      getEspaces()
        .then((res) => {
          const list = res.data.data || [];
          setEspaces(list);
          // If no selected space ID set yet, default to first karting space or first space
          if (!selectedEspaceId && list.length > 0) {
            const kartingSpace = list.find((s) => (s.categorie || '').toLowerCase().includes('kart'));
            setSelectedEspaceId(kartingSpace ? kartingSpace.id : list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [user, selectedEspaceId]);

  // Load space details and karts when selectedEspaceId changes
  const loadKartsData = useCallback(async (id) => {
    if (!id) {
      setLoading(false);
      setEspaceLoading(false);
      return;
    }
    setLoading(true);
    setEspaceLoading(true);
    setIsDirty(false);
    setDeletedKartIds([]);
    setLockedBySubscription(false);

    try {
      // 1. Fetch space info
      const spaceRes = await getEspace(id);
      const spaceData = spaceRes.data.data;
      setEspace(spaceData);

      // 2. Fetch karts list
      const kartsRes = await getKarts(id);
      const kartsList = kartsRes.data.data || kartsRes.data || [];

      setKarts(
        kartsList.map((k, idx) => ({
          ...k,
          ordre: k.ordre !== undefined ? k.ordre : idx,
        }))
      );
    } catch (err) {
      if (err.response?.status === 403 && (err.response?.data?.code === 'MODULE_LOCKED_KARTS' || err.response?.data?.message?.includes('Pack Avancé'))) {
        setLockedBySubscription(true);
      } else {
        toast.error(err.response?.data?.message || 'Impossible de charger la configuration des karts');
      }
    } finally {
      setLoading(false);
      setEspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEspaceId) {
      loadKartsData(selectedEspaceId);
    }
  }, [selectedEspaceId, loadKartsData]);

  // Validation rules (uniqueness & non-empty numbers)
  const validationErrors = useMemo(() => {
    const errors = {};
    const seenNumbers = new Map();

    karts.forEach((k, idx) => {
      const numStr = (k.numero || '').trim();
      if (!numStr) {
        errors[idx] = t('karts.validation.emptyNumber');
        return;
      }
      if (numStr.length < 1 || numStr.length > 3) {
        errors[idx] = t('karts.validation.lengthNumber');
        return;
      }
      const lower = numStr.toLowerCase();
      if (seenNumbers.has(lower)) {
        errors[idx] = t('karts.validation.duplicateNumber', { other: seenNumbers.get(lower) + 1 });
        errors[seenNumbers.get(lower)] = t('karts.validation.duplicateNumber', { other: idx + 1 });
      } else {
        seenNumbers.set(lower, idx);
      }
    });

    return errors;
  }, [karts]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  // Header Counters
  const totalCount = karts.length;
  const activeCount = useMemo(() => karts.filter((k) => k.actif !== false).length, [karts]);

  // Add new kart with suggested free number
  const handleAddKart = () => {
    // Generate next free number (e.g. "01", "02", "03"...)
    const existingNums = new Set(karts.map((k) => (k.numero || '').trim()));
    let nextNum = '01';
    for (let i = 1; i <= 99; i++) {
      const candidate = i < 10 ? `0${i}` : `${i}`;
      if (!existingNums.has(candidate)) {
        nextNum = candidate;
        break;
      }
    }

    // Pick next color from preset palette
    const nextColor = PRESET_COLORS[karts.length % PRESET_COLORS.length].hex;

    const newKart = {
      tempId: uuidv4(),
      numero: nextNum,
      couleur: nextColor,
      actif: true,
      ordre: karts.length,
      isNew: true,
    };

    setKarts((prev) => [...prev, newKart]);
    setIsDirty(true);
  };

  // Update a kart row
  const handleUpdateKart = (index, updatedFields) => {
    setKarts((prev) =>
      prev.map((k, idx) => (idx === index ? { ...k, ...updatedFields } : k))
    );
    setIsDirty(true);
  };

  // Delete a kart row
  const handleDeleteKart = (index) => {
    const kartToDelete = karts[index];
    if (kartToDelete.id) {
      setDeletedKartIds((prev) => [...prev, kartToDelete.id]);
    }
    setKarts((prev) => prev.filter((_, idx) => idx !== index));
    setIsDirty(true);
  };

  // Reorder kart rows up / down
  const handleMoveUp = (index) => {
    if (index === 0) return;
    setKarts((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      // Reassign order
      return copy.map((k, idx) => ({ ...k, ordre: idx }));
    });
    setIsDirty(true);
  };

  const handleMoveDown = (index) => {
    if (index === karts.length - 1) return;
    setKarts((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      // Reassign order
      return copy.map((k, idx) => ({ ...k, ordre: idx }));
    });
    setIsDirty(true);
  };

  const [rootKartModalOpen, setRootKartModalOpen] = useState(false);

  // Save changes to backend
  const performSave = async (reason) => {
    if (!selectedEspaceId) return;
    if (hasValidationErrors) {
      toast.error(t('karts.saveError'));
      return;
    }

    setSaving(true);
    try {
      // 1. Delete removed karts
      for (const id of deletedKartIds) {
        await deleteKart(selectedEspaceId, id, reason);
      }

      // 2. Create or update karts
      for (let i = 0; i < karts.length; i++) {
        const kart = karts[i];
        const payload = {
          numero: kart.numero.trim(),
          couleur: kart.couleur,
          actif: kart.actif !== false,
          ordre: i,
        };

        if (kart.isNew || !kart.id) {
          await createKart(selectedEspaceId, payload);
        } else {
          await updateKart(selectedEspaceId, kart.id, payload);
        }
      }

      // 3. Batch reorder
      const currentKartsRes = await getKarts(selectedEspaceId);
      const updatedList = currentKartsRes.data.data || [];
      if (updatedList.length > 0) {
        const reorderItems = updatedList.map((k, idx) => ({
          id: k.id,
          ordre: idx,
        }));
        await reorderKarts(selectedEspaceId, reorderItems);
      }

      toast.success(t('karts.saveSuccess'));
      await loadKartsData(selectedEspaceId);
    } catch (err) {
      toast.error(err.response?.data?.message || t('karts.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (user?.role === 'ROOT') {
      setRootKartModalOpen(true);
      return;
    }
    performSave();
  };

  const handleRootKartConfirm = ({ passcode, reason }) => {
    performSave(`${reason} [Validé avec code ${passcode}]`);
  };

  const isKartingCategory =
    !espace || (espace.categorie || '').toLowerCase().includes('kart');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Space Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center">
              <Flag size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {t('karts.title')} {espace?.nom ? `— ${espace.nom}` : ''}
              </h1>
              <p className="text-xs text-slate-500">
                {t('karts.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Space Selector for SUPERADMIN */}
        {user?.role === 'SUPERADMIN' && espaces.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('karts.selectSpace')}
            </span>
            <div className="relative">
              <select
                value={selectedEspaceId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedEspaceId(newId);
                  navigate(`/espaces/${newId}/karts`);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pe-8 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy/20 cursor-pointer"
                id="kart-space-selector"
              >
                {espaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom} ({s.categorie})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs (Éditeur 3D <-> Configuration Karts) */}
      {selectedEspaceId && (
        <div className="flex border-b border-slate-200 space-x-2">
          <Link
            to={`/espaces/${selectedEspaceId}/editeur-3d`}
            className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-2 border-b-2 border-transparent transition-colors"
          >
            <Layers size={16} />
            <span>{t('nav.editor3d')}</span>
          </Link>
          <button
            type="button"
            className="px-4 py-2.5 text-sm font-semibold text-navy border-b-2 border-navy flex items-center gap-2"
          >
            <Flag size={16} />
            <span>{t('nav.kartsConfig')}</span>
          </button>
        </div>
      )}

      {/* Locked by subscription state */}
      {lockedBySubscription ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center text-indigo-600 shadow-inner">
            <Lock size={30} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('subscription.featureLockedTitle', 'Module Karts Verrouillé')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              La gestion dynamique de flotte de karts, numéros et carrosseries nécessite le pack <strong>🥈 Avancé</strong> ou <strong>🥇 Premium</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setFeatureLockModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
            >
              <Sparkles size={16} />
              <span>{t('subscription.requestUpgradeBtn', 'Débloquer avec le Pack Avancé')}</span>
            </button>
            <Link
              to="/abonnement"
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              {t('subscription.title', 'Voir tous les packs')}
            </Link>
          </div>
        </div>
      ) : (
        /* Main Content Grid: Editor (Left) & Live 3D Preview (Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Karts Form List */}
        <div className="lg:col-span-6 space-y-4">
          {/* Summary & Save Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('karts.totalKarts')}
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="text-navy">{t('karts.saveFleet', { defaultValue: `${totalCount} karts` })}</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600">{activeCount} {t('karts.activeKarts').toLowerCase()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || hasValidationErrors || !isDirty}
              id="save-karts-btn"
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${
                hasValidationErrors
                  ? 'bg-red-100 text-red-500 cursor-not-allowed opacity-75'
                  : isDirty
                  ? 'bg-navy text-white hover:bg-navy/90 shadow-navy/20 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{saving ? t('karts.saving') : t('karts.saveFleet')}</span>
            </button>
          </div>

          {/* Validation Warning Alert */}
          {hasValidationErrors && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{t('karts.validation.emptyNumber')}</span>
            </div>
          )}

          {/* Kart Form Rows List */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Loader2 size={24} className="animate-spin text-navy mx-auto" />
              <p className="text-sm font-medium text-slate-500">{t('common.loading')}</p>
            </div>
          ) : (
            <KartList
              karts={karts}
              errors={validationErrors}
              onUpdateKart={handleUpdateKart}
              onDeleteKart={handleDeleteKart}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onAddKart={handleAddKart}
            />
          )}
        </div>

        {/* Right Column: Live 3D Preview Canvas */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="sticky top-20 space-y-3">
            <KartPreviewCanvas karts={karts} />
            <p className="text-xs text-slate-500 text-center">
              💡 {t('karts.subtitle')}
            </p>
          </div>
        </div>
      </div>
      )}

      {/* ROOT Verification Security Modal */}
      <RootVerificationModal
        isOpen={rootKartModalOpen}
        onClose={() => setRootKartModalOpen(false)}
        onConfirm={handleRootKartConfirm}
        title={t('rootModal.title')}
        actionName={t('karts.saveFleet')}
      />

      {/* Feature Lock Modal */}
      <FeatureLockModal
        isOpen={featureLockModalOpen}
        onClose={() => setFeatureLockModalOpen(false)}
        title={t('subscription.featureLockedTitle', 'Module Karts Verrouillé')}
        message="Le module Karts & Pistes nécessite le pack Avancé ou Premium. Contactez votre administrateur ou demandez un upgrade."
        targetPack="AVANCE"
      />
    </div>
  );
}
