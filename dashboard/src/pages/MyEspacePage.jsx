import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEspace, getEspaces, updateEspace } from '../api/espacesApi';
import { getEspaceImage, handleImageError } from '../utils/imageUtils';
import {
  CheckCircle,
  Wrench,
  Ban,
  Save,
  Loader2,
  LayoutDashboard,
  ArrowRight,
  ChevronDown,
  Layers,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';
import RootVerificationModal from '../components/RootVerificationModal';
import toast from 'react-hot-toast';

// Helper to determine space configurations & preset metadata
function getSpacePresets(espace, t) {
  const name = (espace?.nom || '').toLowerCase();
  const cat = (espace?.categorie || '').toLowerCase();

  const tr = (k, fallback) => (t ? t(k, { defaultValue: fallback }) : fallback);

  if (name.includes('kart') || cat.includes('kart') || cat.includes('sport')) {
    return {
      type: 'karting',
      heroSubtitle: tr('mySpace.presets.karting.subtitle', 'Piste technique 1.2km • Asphalte haute adhérence'),
      openLabel: tr('mySpace.presets.karting.openLabel', 'Ouvrir la Piste'),
      maintLabel: tr('mySpace.presets.karting.maintLabel', 'Maintenance'),
      closeLabel: tr('mySpace.presets.karting.closeLabel', 'Fermeture d\'urgence'),
      reportTitle: tr('mySpace.presets.karting.reportTitle', 'Rapport Journalier Piste'),
      field1Label: tr('mySpace.presets.karting.recordHolder', 'Détenteur du Record'),
      field1Default: 'Sami Ben Ali',
      field1Key: 'recordHolder',
      field2Label: tr('mySpace.presets.karting.fastestLap', 'Meilleur Tour (s)'),
      field2Default: '54.230',
      field2Key: 'fastestLap',
      field3Label: tr('mySpace.presets.karting.trackTemp', 'Température Piste (°C)'),
      field3Default: '28',
      field3Key: 'trackTemp',
      field4Label: tr('mySpace.presets.karting.gripConditions', 'Conditions d\'Adhérence'),
      field4Key: 'gripConditions',
      field4Options: [
        tr('mySpace.presets.karting.gripOptimal', 'Optimale (Sec)'),
        tr('mySpace.presets.karting.gripDamp', 'Humide'),
        tr('mySpace.presets.karting.gripWet', 'Mouillé'),
        tr('mySpace.presets.karting.gripGreasy', 'Glissant'),
        tr('mySpace.presets.karting.gripRubbered', 'Gommée'),
      ],
      safetyNotesKey: 'safetyNotes',
      safetyPlaceholder: tr('mySpace.observationsPlaceholder', 'Saisissez les observations techniques ou consignes...'),
      submitLabel: tr('mySpace.saveUpdate', 'Enregistrer la mise à jour'),
      metric1Label: tr('mySpace.presets.karting.activeKarts', 'Karts en Piste'),
      metric1Value: '8 / 12',
      metric1Percent: 66,
      metric2Label: tr('mySpace.presets.karting.avgWait', 'Temps d\'Attente Moyen'),
      metric2Value: '15 mins',
      metric2Percent: 35,
      stat1Label: tr('mySpace.presets.karting.todaySessions', 'Sessions du Jour'),
      stat1Value: '42',
      stat2Label: tr('mySpace.presets.karting.fuelConsumption', 'Consommation Essence'),
      stat2Value: '120L',
      stat3Label: tr('mySpace.presets.karting.staffDuty', 'Staff en Service'),
      stat3Default: '4',
    };
  }

  if (name.includes('resto') || cat.includes('resto')) {
    return {
      type: 'restaurant',
      heroSubtitle: tr('mySpace.presets.restaurant.subtitle', 'Terrasse panoramique • Cuisine méditerranéenne & Grill'),
      openLabel: tr('mySpace.presets.restaurant.openLabel', 'Ouvrir le Service'),
      maintLabel: tr('mySpace.presets.restaurant.maintLabel', 'Nettoyage / Préparation'),
      closeLabel: tr('mySpace.presets.restaurant.closeLabel', 'Fermeture d\'urgence'),
      reportTitle: tr('mySpace.presets.restaurant.reportTitle', 'Rapport Journalier Restaurant'),
      field1Label: tr('mySpace.presets.restaurant.chefDuty', 'Chef de Cuisine'),
      field1Default: 'Chef Karim',
      field1Key: 'chefOnDuty',
      field2Label: tr('mySpace.presets.restaurant.specialMenu', 'Plat du Jour'),
      field2Default: 'Couscous de poissons',
      field2Key: 'menuOfTheDay',
      field3Label: tr('mySpace.presets.restaurant.kitchenTemp', 'Température Cuisine (°C)'),
      field3Default: '22',
      field3Key: 'kitchenTemp',
      field4Label: tr('mySpace.presets.restaurant.hygieneStatus', 'Hygiène & Stocks'),
      field4Key: 'hygieneStatus',
      field4Options: [
        tr('mySpace.presets.restaurant.hygieneOptimal', 'Optimal (Grade A)'),
        tr('mySpace.presets.restaurant.hygienePassed', 'Contrôle Validé'),
        tr('mySpace.presets.restaurant.hygieneRestock', 'Réapprovisionnement requis'),
        tr('mySpace.presets.restaurant.hygieneClean', 'Grand Nettoyage Programmé'),
      ],
      safetyNotesKey: 'safetyNotes',
      safetyPlaceholder: tr('mySpace.observationsPlaceholder', 'Saisissez les observations de cuisine...'),
      submitLabel: tr('mySpace.saveUpdate', 'Enregistrer la mise à jour'),
      metric1Label: tr('mySpace.presets.restaurant.occupiedTables', 'Tables Occupées'),
      metric1Value: '18 / 25',
      metric1Percent: 72,
      metric2Label: tr('mySpace.presets.restaurant.avgMeal', 'Durée Moyenne Repas'),
      metric2Value: '45 mins',
      metric2Percent: 50,
      stat1Label: tr('mySpace.presets.restaurant.todayCovers', 'Couverts du Jour'),
      stat1Value: '110',
      stat2Label: tr('mySpace.presets.restaurant.specialOrders', 'Commandes Spéciales'),
      stat2Value: '38',
      stat3Label: tr('mySpace.presets.restaurant.staffDuty', 'Staff en Service'),
      stat3Default: '6',
    };
  }

  // General fallback preset
  return {
    type: 'general',
    heroSubtitle: tr('mySpace.presets.general.subtitle', 'Espace d\'attraction et de loisirs opérationnel'),
    openLabel: tr('mySpace.presets.general.openLabel', 'Ouvrir l\'Espace'),
    maintLabel: tr('mySpace.presets.general.maintLabel', 'Maintenance'),
    closeLabel: tr('mySpace.presets.general.closeLabel', 'Fermer l\'Espace'),
    reportTitle: tr('mySpace.presets.general.reportTitle', 'Rapport d\'Activité Journalier'),
    field1Label: tr('mySpace.presets.general.managerDuty', 'Responsable de Zone'),
    field1Default: 'Superviseur',
    field1Key: 'supervisorName',
    field2Label: tr('mySpace.presets.general.currentAffluence', 'Affluence Actuelle'),
    field2Default: 'Normale',
    field2Key: 'affluenceLevel',
    field3Label: tr('mySpace.presets.general.operationalTemp', 'Température Ambiante (°C)'),
    field3Default: '24',
    field3Key: 'ambientTemp',
    field4Label: tr('mySpace.presets.general.safetyCondition', 'Condition de Sécurité'),
    field4Key: 'facilityConditions',
    field4Options: [
      tr('mySpace.presets.general.safetyOptimal', '100% Conforme'),
      tr('mySpace.presets.general.safetyCheck', 'Inspection en cours'),
    ],
    safetyNotesKey: 'safetyNotes',
    safetyPlaceholder: tr('mySpace.observationsPlaceholder', 'Saisissez les observations techniques...'),
    submitLabel: tr('mySpace.saveUpdate', 'Enregistrer la mise à jour'),
    metric1Label: tr('mySpace.presets.general.activeVisitors', 'Visiteurs Présents'),
    metric1Value: '80%',
    metric1Percent: 80,
    metric2Label: tr('mySpace.presets.general.avgVisitDuration', 'Temps Moyen de Visite'),
    metric2Value: '25 mins',
    metric2Percent: 40,
    stat1Label: tr('mySpace.presets.general.todayVisitors', 'Entrées du Jour'),
    stat1Value: '120',
    stat2Label: tr('mySpace.presets.general.incidents', 'Incidents Signalés'),
    stat2Value: '0',
    stat3Label: tr('mySpace.presets.general.staffDuty', 'Personnel en Service'),
    stat3Default: '4',
  };
}

export default function MyEspacePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { espaceId } = useParams();
  const navigate = useNavigate();

  const [espace, setEspace] = useState(null);
  const [allEspaces, setAllEspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    safetyNotes: '',
  });

  // Dynamic custom key-values
  const [customFields, setCustomFields] = useState([]);
  const [showCustomFields, setShowCustomFields] = useState(false);

  const presets = useMemo(() => getSpacePresets(espace, t), [espace, t]);

  // Target space ID resolution: route param > user assigned space
  const targetSpaceId = espaceId || user?.assignedSpaceId;

  // Fetch the target space
  const fetchSpaceData = useCallback(async () => {
    setLoading(true);
    try {
      if (targetSpaceId) {
        const res = await getEspace(targetSpaceId);
        const data = res.data.data || res.data;
        setEspace(data);

        // Populate form data from donneesSpecifiques
        const ds = data.donneesSpecifiques || {};
        const p = getSpacePresets(data, t);

        setFormData({
          field1: ds[p.field1Key] !== undefined ? String(ds[p.field1Key]) : p.field1Default,
          field2: ds[p.field2Key] !== undefined ? String(ds[p.field2Key]) : p.field2Default,
          field3: ds[p.field3Key] !== undefined ? String(ds[p.field3Key]) : p.field3Default,
          field4: ds[p.field4Key] !== undefined ? String(ds[p.field4Key]) : p.field4Options[0],
          safetyNotes: ds[p.safetyNotesKey] !== undefined ? String(ds[p.safetyNotesKey]) : '',
        });

        // Extra custom fields
        const standardKeys = [p.field1Key, p.field2Key, p.field3Key, p.field4Key, p.safetyNotesKey];
        const extra = Object.entries(ds)
          .filter(([k]) => !standardKeys.includes(k))
          .map(([key, value]) => ({ key, value: String(value) }));
        setCustomFields(extra);
      } else {
        // If Superadmin has no direct space, fetch all spaces for quick selection
        const resAll = await getEspaces();
        const list = resAll.data.data || [];
        setAllEspaces(list);
        if (list.length > 0) {
          // Default to the first space (e.g. Piste Karting or first available)
          const first = list.find((e) => e.nom.toLowerCase().includes('kart')) || list[0];
          setEspace(first);
          const p = getSpacePresets(first, t);
          const ds = first.donneesSpecifiques || {};
          setFormData({
            field1: ds[p.field1Key] !== undefined ? String(ds[p.field1Key]) : p.field1Default,
            field2: ds[p.field2Key] !== undefined ? String(ds[p.field2Key]) : p.field2Default,
            field3: ds[p.field3Key] !== undefined ? String(ds[p.field3Key]) : p.field3Default,
            field4: ds[p.field4Key] !== undefined ? String(ds[p.field4Key]) : p.field4Options[0],
            safetyNotes: ds[p.safetyNotesKey] !== undefined ? String(ds[p.safetyNotesKey]) : '',
          });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [targetSpaceId, t]);

  useEffect(() => {
    fetchSpaceData();
  }, [fetchSpaceData]);

  // ROOT Security Modal State
  const [rootModalOpen, setRootModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Execute space status update
  const performStatusUpdate = async (newStatus, reason) => {
    if (!espace) return;
    const previous = espace.statut;
    setEspace((prev) => ({ ...prev, statut: newStatus }));
    try {
      const res = await updateEspace(espace.id, { statut: newStatus }, reason);
      setEspace(res.data.data || res.data);
      toast.success(t('spaces.statusUpdated', { status: t('spaces.statuses.' + newStatus) }));
    } catch (err) {
      setEspace((prev) => ({ ...prev, statut: previous }));
      toast.error(err.response?.data?.message || t('mySpace.updateError'));
    }
  };

  // Operational Status Change handler
  const handleStatusChange = (newStatus) => {
    if (!espace) return;
    if (user?.role === 'ROOT') {
      setPendingAction({
        type: 'status',
        newStatus,
        label: `${t('spaces.card.status')} (${t('spaces.statuses.' + espace.statut)} ➔ ${t('spaces.statuses.' + newStatus)})`,
      });
      setRootModalOpen(true);
      return;
    }
    performStatusUpdate(newStatus);
  };

  // Execute daily report form submit
  const performReportSubmit = async (mergedDonnees, reason) => {
    if (!espace) return;
    setSaving(true);
    try {
      const res = await updateEspace(espace.id, { donneesSpecifiques: mergedDonnees }, reason);
      setEspace(res.data.data || res.data);
      toast.success(t('mySpace.updateSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('mySpace.updateError'));
    } finally {
      setSaving(false);
    }
  };

  // Submit Daily Report Form handler
  const handleSubmitReport = (e) => {
    if (e) e.preventDefault();
    if (!espace) return;

    const mergedDonnees = {
      ...(espace.donneesSpecifiques || {}),
      [presets.field1Key]: formData.field1,
      [presets.field2Key]: formData.field2,
      [presets.field3Key]: formData.field3,
      [presets.field4Key]: formData.field4,
      [presets.safetyNotesKey]: formData.safetyNotes,
    };

    // Append custom fields
    customFields.forEach((cf) => {
      if (cf.key.trim()) {
        mergedDonnees[cf.key.trim()] = cf.value;
      }
    });

    if (user?.role === 'ROOT') {
      setPendingAction({
        type: 'report',
        mergedDonnees,
        label: `${t('mySpace.dailyReport')} (${espace.nom})`,
      });
      setRootModalOpen(true);
      return;
    }

    performReportSubmit(mergedDonnees);
  };

  // Handle ROOT confirmation with passcode and audit reason
  const handleRootConfirm = ({ passcode, reason }) => {
    if (!pendingAction) return;
    const auditReason = `${reason} [Validé avec code ${passcode}]`;

    if (pendingAction.type === 'status') {
      performStatusUpdate(pendingAction.newStatus, auditReason);
    } else if (pendingAction.type === 'report') {
      performReportSubmit(pendingAction.mergedDonnees, auditReason);
    }
    setPendingAction(null);
  };

  const handleFieldChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const addCustomField = () => setCustomFields((p) => [...p, { key: '', value: '' }]);
  const removeCustomField = (i) => setCustomFields((p) => p.filter((_, idx) => idx !== i));
  const updateCustomField = (i, prop, val) =>
    setCustomFields((p) => p.map((f, idx) => (idx === i ? { ...f, [prop]: val } : f)));

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-72 bg-slate-200 rounded-3xl" />
        <div className="h-20 bg-slate-200 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl" />
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!espace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 gap-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-navy/10 text-navy flex items-center justify-center">
          <LayoutDashboard size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('notFound.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('notFound.subtitle')}
          </p>
        </div>
        <Link
          to="/espaces"
          className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:bg-navy/90 transition-colors"
        >
          <span>{t('notFound.back')}</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // Live status badge styling
  const isCurrentlyOpen = espace.statut === 'OUVERT';
  const isMaintenance = espace.statut === 'MAINTENANCE';
  const isClosed = espace.statut === 'FERME';

  const statusBadgeText = t('spaces.statuses.' + espace.statut);

  const statusDotClass = isCurrentlyOpen
    ? 'bg-emerald-400 animate-pulse'
    : isMaintenance
    ? 'bg-amber-400'
    : 'bg-red-400';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Superadmin Space Selector (when multiple spaces exist) */}
      {allEspaces.length > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-navy">
              <Layers size={18} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('spaces.title')}</p>
              <p className="text-sm font-bold text-slate-800">{t('spaces.subtitle')}</p>
            </div>
          </div>
          <select
            value={espace.id}
            onChange={(e) => {
              const selected = allEspaces.find((esp) => esp.id === e.target.value);
              if (selected) {
                setEspace(selected);
                navigate(`/espaces/${selected.id}`);
              }
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20 cursor-pointer"
            id="space-quick-switch-select"
          >
            {allEspaces.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nom} ({esp.categorie})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 1. HERO BANNER SECTION */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg h-72 sm:h-80 w-full group">
        <img
          src={getEspaceImage(espace)}
          alt={espace.nom}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => handleImageError(e)}
        />
        {/* Sleek dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-slate-950/10" />

        {/* Hero Content Overlay */}
        <div className="absolute bottom-6 start-6 sm:bottom-8 sm:start-8 z-10 space-y-2 max-w-2xl">
          {/* Status Badge Overlay */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/70 border border-white/20 backdrop-blur-md text-white text-xs font-semibold shadow-inner">
            <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
            <span>{statusBadgeText}</span>
          </div>

          {/* Dynamic Bold Title */}
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow-md">
            {espace.nom}
          </h1>

          {/* Sub-details */}
          <p className="text-slate-200 text-xs sm:text-sm font-medium drop-shadow">
            {presets.heroSubtitle}
          </p>
        </div>
      </div>

      {/* 2. OPERATIONAL STATUS CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            {t('mySpace.operationalStatus')}
          </p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {t('mySpace.updateAccessibility')}
          </p>
        </div>

        {/* 3 Quick-Action Status Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Open Track */}
          <button
            type="button"
            onClick={() => handleStatusChange('OUVERT')}
            id="status-open-btn"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm
              ${
                isCurrentlyOpen
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-500 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <CheckCircle size={17} />
            <span>{presets.openLabel}</span>
          </button>

          {/* Maintenance */}
          <button
            type="button"
            onClick={() => handleStatusChange('MAINTENANCE')}
            id="status-maintenance-btn"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
              ${
                isMaintenance
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 ring-2 ring-amber-500 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Wrench size={17} />
            <span>{presets.maintLabel}</span>
          </button>

          {/* Emergency Close */}
          <button
            type="button"
            onClick={() => handleStatusChange('FERME')}
            id="status-close-btn"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
              ${
                isClosed
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200 ring-2 ring-red-500 ring-offset-1'
                  : 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
              }`}
          >
            <Ban size={17} />
            <span>{presets.closeLabel}</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Daily Report Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {presets.reportTitle}
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              ID: {espace.id}
            </span>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-5">
            {/* 2x2 Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Field 1 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {presets.field1Label}
                </label>
                <input
                  type="text"
                  value={formData.field1}
                  onChange={(e) => handleFieldChange('field1', e.target.value)}
                  placeholder={presets.field1Default}
                  id="report-field-1"
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-navy/30 transition-colors"
                />
              </div>

              {/* Field 2 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {presets.field2Label}
                </label>
                <input
                  type="text"
                  value={formData.field2}
                  onChange={(e) => handleFieldChange('field2', e.target.value)}
                  placeholder={presets.field2Default}
                  id="report-field-2"
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-navy/30 transition-colors"
                />
              </div>

              {/* Field 3 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {presets.field3Label}
                </label>
                <input
                  type="text"
                  value={formData.field3}
                  onChange={(e) => handleFieldChange('field3', e.target.value)}
                  placeholder={presets.field3Default}
                  id="report-field-3"
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-navy/30 transition-colors"
                />
              </div>

              {/* Field 4 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {presets.field4Label}
                </label>
                <div className="relative">
                  <select
                    value={formData.field4}
                    onChange={(e) => handleFieldChange('field4', e.target.value)}
                    id="report-field-4"
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-navy/30 transition-colors cursor-pointer pe-10"
                  >
                    {presets.field4Options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Full Width Textarea: Safety Notes / Incidents */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('mySpace.observations')}
              </label>
              <textarea
                rows={4}
                value={formData.safetyNotes}
                onChange={(e) => handleFieldChange('safetyNotes', e.target.value)}
                placeholder={presets.safetyPlaceholder}
                id="report-safety-notes"
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-navy/30 transition-colors resize-none"
              />
            </div>

            {/* Optional Custom Key-Value Expansion */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCustomFields(!showCustomFields)}
                className="text-xs font-bold text-slate-500 hover:text-navy transition-colors flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>{showCustomFields ? t('common.close') : `+ ${t('mySpace.specificData')}`}</span>
              </button>

              {showCustomFields && (
                <div className="mt-3 space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">{t('mySpace.specificData')}</span>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="text-xs font-bold text-navy hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} />
                      {t('mySpace.addField')}
                    </button>
                  </div>
                  {customFields.map((cf, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={t('mySpace.keyLabel')}
                        value={cf.key}
                        onChange={(e) => updateCustomField(i, 'key', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-navy focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder={t('mySpace.valueLabel')}
                        value={cf.value}
                        onChange={(e) => updateCustomField(i, 'value', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-navy focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(i)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title={t('mySpace.removeField')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                id="save-espace-btn"
                className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60 cursor-pointer"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{presets.submitLabel}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Real-time Metrics Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              {t('mySpace.metrics')}
            </h2>

            {/* Metric 1 */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-700">{presets.metric1Label}</span>
                <span className="text-emerald-600 font-extrabold text-sm">{presets.metric1Value}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${presets.metric1Percent}%` }}
                />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-700">{presets.metric2Label}</span>
                <span className="text-slate-900 font-extrabold text-sm">{presets.metric2Value}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1e293b] rounded-full transition-all duration-500"
                  style={{ width: `${presets.metric2Percent}%` }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                {t('mySpace.quickStats')}
              </p>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{presets.stat1Label}</span>
                  <span className="font-extrabold text-slate-900">{presets.stat1Value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{presets.stat2Label}</span>
                  <span className="font-extrabold text-slate-900">{presets.stat2Value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{presets.stat3Label}</span>
                  <span className="font-extrabold text-slate-900">
                    {espace.employes?.length || presets.stat3Default}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROOT Verification Security Modal */}
      <RootVerificationModal
        isOpen={rootModalOpen}
        onClose={() => { setRootModalOpen(false); setPendingAction(null); }}
        onConfirm={handleRootConfirm}
        title={t('rootModal.title')}
        actionName={pendingAction?.label || t('spaces.card.status')}
      />
    </div>
  );
}
