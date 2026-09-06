import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getEspaces, getEspace } from '../api/espacesApi';
import { getKarts, createKart, updateKart, deleteKart, reorderKarts } from '../api/kartsApi';
import KartList from '../components/karts/KartList';
import KartCustomizer from '../components/karts/KartCustomizer';
import KartPreviewCanvas from '../components/karts/KartPreviewCanvas';
import { SUGGESTED_COLORS } from '../components/karts/PieceColorPicker';
import { Flag, Save, Loader2, Layers, AlertCircle, ChevronDown, Lock, Sparkles, Plus } from 'lucide-react';
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
  const [editingKartIndex, setEditingKartIndex] = useState(null);
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
    setEditingKartIndex(null);
    setDeletedKartIds([]);
    setLockedBySubscription(false);

    try {
      const spaceRes = await getEspace(id);
      const spaceData = spaceRes.data.data;
      setEspace(spaceData);

      const kartsRes = await getKarts(id);
      const kartsList = kartsRes.data.data || kartsRes.data || [];

      setKarts(
        kartsList.map((k, idx) => ({
          ...k,
          numeroPlaque: k.numeroPlaque || k.numero || `${idx + 1}`.padStart(2, '0'),
          couleurs: k.couleurs && typeof k.couleurs === 'object'
            ? k.couleurs
            : {
                piece_carrosserie: k.couleur || '#E53935',
                piece_aileron: '#1A1A1A',
                piece_capot: k.couleur || '#E53935',
                piece_pontons: k.couleur || '#E53935',
              },
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

  // Validation rules (uniqueness & non-empty plate numbers)
  const validationErrors = useMemo(() => {
    const errors = {};
    const seenNumbers = new Map();

    karts.forEach((k, idx) => {
      const numStr = (k.numeroPlaque || k.numero || '').trim();
      if (!numStr) {
        errors[idx] = 'Le numéro de plaque est requis';
        return;
      }
      if (numStr.length < 1 || numStr.length > 3) {
        errors[idx] = 'Le numéro doit comporter entre 1 et 3 caractères';
        return;
      }
      const lower = numStr.toLowerCase();
      if (seenNumbers.has(lower)) {
        errors[idx] = `Numéro en double avec le kart #${seenNumbers.get(lower) + 1}`;
        errors[seenNumbers.get(lower)] = `Numéro en double avec le kart #${idx + 1}`;
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
    const existingNums = new Set(karts.map((k) => (k.numeroPlaque || k.numero || '').trim()));
    let nextNum = '01';
    for (let i = 1; i <= 99; i++) {
      const candidate = i < 10 ? `0${i}` : `${i}`;
      if (!existingNums.has(candidate)) {
        nextNum = candidate;
        break;
      }
    }

    const nextColor = SUGGESTED_COLORS[karts.length % SUGGESTED_COLORS.length].hex;

    const newKart = {
      tempId: uuidv4(),
      numeroPlaque: nextNum,
      couleurs: {
        piece_carrosserie: nextColor,
        piece_aileron: '#1A1A1A',
        piece_capot: nextColor,
        piece_pontons: nextColor,
      },
      actif: true,
      ordre: karts.length,
      isNew: true,
    };

    setKarts((prev) => [...prev, newKart]);
    setEditingKartIndex(karts.length); // Open customizer immediately
    setIsDirty(true);
  };

  // Update kart from Customizer
  const handleCustomizerSave = (updatedKart) => {
    setKarts((prev) =>
      prev.map((k, idx) => (idx === editingKartIndex ? updatedKart : k))
    );
    setEditingKartIndex(null);
    setIsDirty(true);
  };

  // Delete a kart
  const handleDeleteKart = (index) => {
    const kartToDelete = karts[index];
    if (kartToDelete.id) {
      setDeletedKartIds((prev) => [...prev, kartToDelete.id]);
    }
    setKarts((prev) => prev.filter((_, idx) => idx !== index));
    if (editingKartIndex === index) {
      setEditingKartIndex(null);
    }
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
      return copy.map((k, idx) => ({ ...k, ordre: idx }));
    });
    setIsDirty(true);
  };

  const [rootKartModalOpen, setRootKartModalOpen] = useState(false);

  // Save changes to backend
  const performSave = async (reason) => {
    if (!selectedEspaceId) return;
    if (hasValidationErrors) {
      toast.error('Corrigez les erreurs de validation avant d’enregistrer');
      return;
    }

    setSaving(true);
    try {
      // 1. Delete removed karts
      for (const id of deletedKartIds) {
        await deleteKart(selectedEspaceId, id, reason);
      }

      // 2. Create or update karts with v2 schema
      for (let i = 0; i < karts.length; i++) {
        const kart = karts[i];
        const payload = {
          numeroPlaque: (kart.numeroPlaque || kart.numero || '??').trim(),
          couleurs: kart.couleurs || { piece_carrosserie: '#E53935' },
          modeleBaseUrl: kart.modeleBaseUrl || null,
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

      toast.success('Flotte de karts sauvegardée avec succès !');
      await loadKartsData(selectedEspaceId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde de la flotte');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Space Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-navy text-white flex items-center justify-center shadow-md shadow-navy/20">
              <Flag size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">
                Personnalisation des Karts {espace?.nom ? `— ${espace.nom}` : ''}
              </h1>
              <p className="text-xs text-slate-500">
                Gestion des numéros de plaque, couleurs par pièce de carrosserie et synchronisation Unity
              </p>
            </div>
          </div>
        </div>

        {/* Space Selector for SUPERADMIN */}
        {user?.role === 'SUPERADMIN' && espaces.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('karts.selectSpace', 'Espace')} :
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
            <span>{t('nav.editor3d', 'Éditeur 3D')}</span>
          </Link>
          <button
            type="button"
            className="px-4 py-2.5 text-sm font-semibold text-navy border-b-2 border-navy flex items-center gap-2"
          >
            <Flag size={16} />
            <span>Personnalisation Karts</span>
          </button>
        </div>
      )}

      {/* Locked by subscription state */}
      {lockedBySubscription ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center text-indigo-600 shadow-inner">
            <Lock size={30} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">
              Module Karts Verrouillé
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              La gestion dynamique de flotte de karts, numéros et carrosseries nécessite le pack <strong>🥈 Avancé</strong> ou <strong>🥇 Premium</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setFeatureLockModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Débloquer avec le Pack Avancé</span>
            </button>
            <Link
              to="/abonnement"
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Voir tous les packs
            </Link>
          </div>
        </div>
      ) : editingKartIndex !== null && karts[editingKartIndex] ? (
        /* Single Kart Customizer Mode */
        <KartCustomizer
          kart={karts[editingKartIndex]}
          onSave={handleCustomizerSave}
          onCancel={() => setEditingKartIndex(null)}
          saving={saving}
          existingPlates={karts.map((k) => k.numeroPlaque || k.numero || '')}
        />
      ) : (
        /* Fleet Overview & List Mode */
        <div className="space-y-6">
          {/* Summary & Save Action Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Flotte de karts sur circuit
              </p>
              <div className="flex items-center gap-2 text-sm font-black text-slate-800 mt-0.5">
                <span className="text-navy">{totalCount} karts au total</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600">{activeCount} actifs sur la piste</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddKart}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Nouveau kart</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || hasValidationErrors || !isDirty}
                id="save-karts-btn"
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm ${
                  hasValidationErrors
                    ? 'bg-red-100 text-red-500 cursor-not-allowed opacity-75'
                    : isDirty
                    ? 'bg-navy text-white hover:bg-navy/90 shadow-navy/20 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{saving ? 'Enregistrement...' : 'Enregistrer la flotte'}</span>
              </button>
            </div>
          </div>

          {/* Validation Alert */}
          {hasValidationErrors && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>Certains karts comportent des numéros de plaque vides ou en double. Veuillez les corriger avant de sauvegarder.</span>
            </div>
          )}

          {/* Main Grid: Karts Cards & Live 3D Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Karts Cards Grid */}
            <div className="lg:col-span-7">
              {loading ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                  <Loader2 size={28} className="animate-spin text-navy mx-auto" />
                  <p className="text-sm font-medium text-slate-500">Chargement de la flotte...</p>
                </div>
              ) : (
                <KartList
                  karts={karts}
                  onSelectEdit={(index) => setEditingKartIndex(index)}
                  onDeleteKart={handleDeleteKart}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onAddKart={handleAddKart}
                />
              )}
            </div>

            {/* Right: Live 3D Preview of Selected / First Kart */}
            <div className="lg:col-span-5">
              <div className="sticky top-6 space-y-3">
                <KartPreviewCanvas
                  couleurs={karts[0]?.couleurs || { piece_carrosserie: '#E53935' }}
                  numeroPlaque={karts[0]?.numeroPlaque || '07'}
                />
                <p className="text-xs text-slate-400 text-center">
                  💡 Cliquez sur <strong>Personnaliser</strong> sur n’importe quel kart pour modifier ses pièces en direct.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROOT Verification Security Modal */}
      <RootVerificationModal
        isOpen={rootKartModalOpen}
        onClose={() => setRootKartModalOpen(false)}
        onConfirm={handleRootKartConfirm}
        title={t('rootModal.title', 'Confirmation ROOT requise')}
        actionName="Enregistrer la configuration des karts"
      />

      {/* Feature Lock Modal */}
      <FeatureLockModal
        isOpen={featureLockModalOpen}
        onClose={() => setFeatureLockModalOpen(false)}
        title="Module Karts Verrouillé"
        message="Le module Karts & Pistes nécessite le pack Avancé ou Premium. Contactez votre administrateur ou demandez un upgrade."
        targetPack="AVANCE"
      />
    </div>
  );
}
