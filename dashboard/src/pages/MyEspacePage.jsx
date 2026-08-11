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
import toast from 'react-hot-toast';

// Helper to determine space configurations & preset metadata
function getSpacePresets(espace) {
  const name = (espace?.nom || '').toLowerCase();
  const cat = (espace?.categorie || '').toLowerCase();

  if (name.includes('kart') || cat.includes('kart') || cat.includes('sport')) {
    return {
      type: 'karting',
      heroSubtitle: '1.2km Technical Track • Professional Grade Asphalt',
      openLabel: 'Open Track',
      maintLabel: 'Maintenance',
      closeLabel: 'Emergency Close',
      reportTitle: 'Daily Track Report',
      field1Label: 'Record Holder Name',
      field1Default: 'Sami Ben Ali',
      field1Key: 'recordHolder',
      field2Label: 'Fastest Lap Time (s)',
      field2Default: '54.230',
      field2Key: 'fastestLap',
      field3Label: 'Track Temperature (°C)',
      field3Default: '28',
      field3Key: 'trackTemp',
      field4Label: 'Grip Conditions',
      field4Key: 'gripConditions',
      field4Options: ['Optimal (Dry)', 'Damp (Humide)', 'Wet (Mouillé)', 'Greasy (Glissant)', 'Rubbered In'],
      safetyNotesKey: 'safetyNotes',
      safetyPlaceholder: 'Enter any technical observations...',
      submitLabel: 'Save Track Update',
      metric1Label: 'Active Karts',
      metric1Value: '8 / 12',
      metric1Percent: 66,
      metric2Label: 'Average Wait Time',
      metric2Value: '15 mins',
      metric2Percent: 35,
      stat1Label: "Today's Sessions",
      stat1Value: '42',
      stat2Label: 'Fuel Consumption',
      stat2Value: '120L',
      stat3Label: 'Staff on Duty',
      stat3Default: '4',
    };
  }

  if (name.includes('resto') || cat.includes('resto')) {
    return {
      type: 'restaurant',
      heroSubtitle: 'Panoramic Terrace • Mediterranean Cuisine & Grill',
      openLabel: 'Open Service',
      maintLabel: 'Cleaning / Prep',
      closeLabel: 'Emergency Close',
      reportTitle: 'Daily Restaurant Report',
      field1Label: 'Chef on Duty',
      field1Default: 'Chef Karim',
      field1Key: 'chefOnDuty',
      field2Label: 'Daily Special Menu',
      field2Default: 'Couscous de poissons',
      field2Key: 'menuOfTheDay',
      field3Label: 'Kitchen Temperature (°C)',
      field3Default: '22',
      field3Key: 'kitchenTemp',
      field4Label: 'Hygiene & Stock Status',
      field4Key: 'hygieneStatus',
      field4Options: ['Optimal (Grade A)', 'Inspection Passed', 'Restock Needed', 'Deep Clean Scheduled'],
      safetyNotesKey: 'safetyNotes',
      safetyPlaceholder: 'Enter kitchen observations, food safety or incident notes...',
      submitLabel: 'Save Restaurant Update',
      metric1Label: 'Occupied Tables',
      metric1Value: '18 / 25',
      metric1Percent: 72,
      metric2Label: 'Average Meal Duration',
      metric2Value: '45 mins',
      metric2Percent: 50,
      stat1Label: "Today's Covers",
      stat1Value: '110',
      stat2Label: 'Special Orders',
      stat2Value: '38',
      stat3Label: 'Staff on Duty',
      stat3Default: '6',
    };
  }

  if (name.includes('caf') || cat.includes('caf')) {
    return {
      type: 'cafe',
      heroSubtitle: 'Artisanal Roasts • Garden Terrace & Espresso Lounge',
      openLabel: 'Open Café',
      maintLabel: 'Maintenance',
      closeLabel: 'Emergency Close',
      reportTitle: 'Daily Café Report',
      field1Label: 'Barista on Duty',
      field1Default: 'Mariem Trabelsi',
      field1Key: 'baristaOnDuty',
      field2Label: 'Roast Blend of the Day',
      field2Default: 'Tunisian Dark Roast',
      field2Key: 'roastBlend',
      field3Label: 'Espresso Pressure (bar)',
      field3Default: '9.2',
      field3Key: 'boilerPressure',
      field4Label: 'Milk & Inventory Status',
      field4Key: 'inventoryStatus',
      field4Options: ['Fresh & Stocked (Optimal)', 'Low Milk Stock', 'Restocked', 'Machine Descaling Needed'],
      safetyNotesKey: 'safetyNotes',
      safetyPlaceholder: 'Enter coffee grind calibration & order notes...',
      submitLabel: 'Save Café Update',
      metric1Label: 'Active Tables',
      metric1Value: '12 / 15',
      metric1Percent: 80,
      metric2Label: 'Average Service Time',
      metric2Value: '4 mins',
      metric2Percent: 20,
      stat1Label: "Today's Orders",
      stat1Value: '92',
      stat2Label: 'Coffee Consumed',
      stat2Value: '14kg',
      stat3Label: 'Staff on Duty',
      stat3Default: '3',
    };
  }

  if (name.includes('arcade') || cat.includes('arcade') || name.includes('jeux')) {
    return {
      type: 'arcade',
      heroSubtitle: '45+ Next-Gen Cabinets • Simulators & VR Stations',
      openLabel: 'Open Arcade',
      maintLabel: 'Maintenance',
      closeLabel: 'Emergency Close',
      reportTitle: 'Daily Arcade Report',
      field1Label: 'High Score Champion',
      field1Default: 'Youssef M.',
      field1Key: 'championName',
      field2Label: 'Top Game Played',
      field2Default: 'Tekken 8 / Daytona USA',
      field2Key: 'topGame',
      field3Label: 'Server Latency (ms)',
      field3Default: '12ms',
      field3Key: 'networkLatency',
      field4Label: 'Cabinet Calibration',
      field4Key: 'calibrationStatus',
      field4Options: ['Optimal (100% Operational)', 'Minor Recalibration', 'Cabinet #4 Offline', 'Token Dispenser Restocked'],
      safetyNotesKey: 'safetyNotes',
      safetyPlaceholder: 'Enter machine calibration or safety observations...',
      submitLabel: 'Save Arcade Update',
      metric1Label: 'Active Cabinets',
      metric1Value: '38 / 45',
      metric1Percent: 84,
      metric2Label: 'Average Queue Time',
      metric2Value: '5 mins',
      metric2Percent: 15,
      stat1Label: "Daily Players",
      stat1Value: '180',
      stat2Label: 'Tokens Dispensed',
      stat2Value: '1420',
      stat3Label: 'Staff on Duty',
      stat3Default: '3',
    };
  }

  if (name.includes('vr') || cat.includes('vr') || name.includes('virtuel')) {
    return {
      type: 'vr',
      heroSubtitle: '6-DOF Motion Platforms • 4K Wireless VR Headsets',
      openLabel: 'Open VR Zone',
      maintLabel: 'Sensor Calibration',
      closeLabel: 'Emergency Close',
      reportTitle: 'Daily VR Zone Report',
      field1Label: 'VR Lead Supervisor',
      field1Default: 'Ahmed Z.',
      field1Key: 'vrSupervisor',
      field2Label: 'Top Experience',
      field2Default: 'Space Odyssey VR',
      field2Key: 'topExperience',
      field3Label: 'Headset Battery Average (%)',
      field3Default: '94%',
      field3Key: 'batteryHealth',
      field4Label: 'Tracking Sensor Sync',
      field4Key: 'sensorStatus',
      field4Options: ['Optimal (Zero Drift)', 'Lighthouse Recalibrated', 'Minor Latency', 'Headset #2 Charging'],
      safetyNotesKey: 'safetyNotes',
      safetyPlaceholder: 'Enter VR hygiene, sensor sync or tracking notes...',
      submitLabel: 'Save VR Zone Update',
      metric1Label: 'Active Headsets',
      metric1Value: '10 / 12',
      metric1Percent: 83,
      metric2Label: 'Average Session Duration',
      metric2Value: '12 mins',
      metric2Percent: 40,
      stat1Label: "Today's Sessions",
      stat1Value: '64',
      stat2Label: 'Battery Cycles',
      stat2Value: '28',
      stat3Label: 'Staff on Duty',
      stat3Default: '3',
    };
  }

  if (name.includes('enfant') || cat.includes('enfant') || name.includes('kid')) {
    return {
      type: 'kids',
      heroSubtitle: 'Inflatable Castles • Safety Monitored Trampoline Zone',
      openLabel: 'Open Playground',
      maintLabel: 'Safety Inspection',
      closeLabel: 'Emergency Close',
      reportTitle: 'Daily Kids Area Report',
      field1Label: 'Head Safety Monitor',
      field1Default: 'Salma K.',
      field1Key: 'safetyMonitor',
      field2Label: 'Peak Capacity Allowed',
      field2Default: '40 Kids',
      field2Key: 'peakCapacity',
      field3Label: 'Inflatable Pressure (PSI)',
      field3Default: '1.8 PSI',
      field3Key: 'pressurePsi',
      field4Label: 'Sanitization Status',
      field4Key: 'sanitizationStatus',
      field4Options: ['Fully Sanitized (Optimal)', 'Sanitization In Progress', 'Perimeter Checked', 'Ball Pit Cleaned'],
      safetyNotesKey: 'safetyNotes',
      safetyPlaceholder: 'Enter perimeter checks, hygiene notes or observations...',
      submitLabel: 'Save Kids Area Update',
      metric1Label: 'Active Kids Inside',
      metric1Value: '24 / 35',
      metric1Percent: 68,
      metric2Label: 'Average Play Time',
      metric2Value: '45 mins',
      metric2Percent: 55,
      stat1Label: "Today's Families",
      stat1Value: '85',
      stat2Label: 'Sanitization Rounds',
      stat2Value: '6',
      stat3Label: 'Staff on Duty',
      stat3Default: '5',
    };
  }

  // Generic Default Preset
  return {
    type: 'generic',
    heroSubtitle: 'Facility Space Management & Operational Control',
    openLabel: 'Open Space',
    maintLabel: 'Maintenance',
    closeLabel: 'Emergency Close',
    reportTitle: 'Daily Space Report',
    field1Label: 'Manager on Duty',
    field1Default: 'Responsable Opérationnel',
    field1Key: 'managerOnDuty',
    field2Label: 'Operating Capacity',
    field2Default: 'Standard',
    field2Key: 'operatingCapacity',
    field3Label: 'Space Temperature (°C)',
    field3Default: '24',
    field3Key: 'spaceTemp',
    field4Label: 'Facility Conditions',
    field4Key: 'facilityConditions',
    field4Options: ['Optimal (Normal)', 'Maintenance Required', 'Restocking Needed', 'Supervised'],
    safetyNotesKey: 'safetyNotes',
    safetyPlaceholder: 'Enter any operational observations...',
    submitLabel: 'Save Space Update',
    metric1Label: 'Operational Load',
    metric1Value: '80%',
    metric1Percent: 80,
    metric2Label: 'Average Wait Time',
    metric2Value: '10 mins',
    metric2Percent: 25,
    stat1Label: "Today's Activity",
    stat1Value: '58',
    stat2Label: 'Resource Units',
    stat2Value: '12',
    stat3Label: 'Staff on Duty',
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

  const presets = useMemo(() => getSpacePresets(espace), [espace]);

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
        const p = getSpacePresets(data);

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
          const p = getSpacePresets(first);
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

  // Operational Status Change handler
  const handleStatusChange = async (newStatus) => {
    if (!espace) return;
    const previous = espace.statut;
    setEspace((prev) => ({ ...prev, statut: newStatus })); // optimistic update
    try {
      const res = await updateEspace(espace.id, { statut: newStatus });
      setEspace(res.data.data || res.data);
      toast.success(
        newStatus === 'OUVERT'
          ? 'Espace ouvert avec succès'
          : newStatus === 'MAINTENANCE'
          ? 'Espace basculé en maintenance'
          : 'Fermeture d\'urgence activée'
      );
    } catch (err) {
      setEspace((prev) => ({ ...prev, statut: previous })); // rollback
      toast.error(err.response?.data?.message || t('mySpace.updateError'));
    }
  };

  // Submit Daily Report Form handler
  const handleSubmitReport = async (e) => {
    if (e) e.preventDefault();
    if (!espace) return;
    setSaving(true);

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

    try {
      const res = await updateEspace(espace.id, { donneesSpecifiques: mergedDonnees });
      setEspace(res.data.data || res.data);
      toast.success('Rapport journalier enregistré avec succès !');
    } catch (err) {
      toast.error(err.response?.data?.message || t('mySpace.updateError'));
    } finally {
      setSaving(false);
    }
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
          <h2 className="text-xl font-bold text-slate-800">Aucun espace sélectionné</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sélectionnez un espace dans le tableau de bord pour accéder à son panneau de contrôle opérationnel.
          </p>
        </div>
        <Link
          to="/espaces"
          className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:bg-navy/90 transition-colors"
        >
          <span>Accéder aux Espaces</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // Live status badge styling
  const isCurrentlyOpen = espace.statut === 'OUVERT';
  const isMaintenance = espace.statut === 'MAINTENANCE';
  const isClosed = espace.statut === 'FERME';

  const statusBadgeText = isCurrentlyOpen
    ? 'Currently Open'
    : isMaintenance
    ? 'Under Maintenance'
    : 'Currently Closed';

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
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sélecteur d'Espace</p>
              <p className="text-sm font-bold text-slate-800">Changer d'attraction en direct</p>
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

      {/* 1. HERO BANNER SECTION (Exact Benchmark Match) */}
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
            {espace.nom === 'Piste Karting' ? 'Circuit Principal - Hergla Kart' : espace.nom}
          </h1>

          {/* Sub-details */}
          <p className="text-slate-200 text-xs sm:text-sm font-medium drop-shadow">
            {presets.heroSubtitle}
          </p>
        </div>
      </div>

      {/* 2. OPERATIONAL STATUS CONTROL BAR (Exact Benchmark Match) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            OPERATIONAL STATUS
          </p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            Update Track Accessibility
          </p>
        </div>

        {/* 3 Quick-Action Status Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Open Track (Emerald Green Active) */}
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

          {/* Maintenance (Neutral Gray / Amber Active) */}
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

          {/* Emergency Close (Light Red / Danger) */}
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

      {/* 3. MAIN CONTENT 2-COLUMN GRID (Exact Benchmark Match) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Daily Track / Space Report Form (2/3 width) */}
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
              {/* Field 1: Record Holder Name */}
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

              {/* Field 2: Fastest Lap Time (s) */}
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

              {/* Field 3: Track Temperature (°C) */}
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

              {/* Field 4: Grip Conditions Dropdown */}
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
                Safety Notes / Incidents
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
                <span>{showCustomFields ? 'Masquer paramètres avancés' : '+ Paramètres opérationnels supplémentaires'}</span>
              </button>

              {showCustomFields && (
                <div className="mt-3 space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">Paramètres JSON personnalisés</span>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="text-xs font-bold text-navy hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Ajouter
                    </button>
                  </div>
                  {customFields.map((cf, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Clé"
                        value={cf.key}
                        onChange={(e) => updateCustomField(i, 'key', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-navy focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Valeur"
                        value={cf.value}
                        onChange={(e) => updateCustomField(i, 'value', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-navy focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(i)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Submit Button (Anchored Dark Navy Full-Width Button) */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                id="save-espace-btn"
                className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all duration-150 disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>{presets.submitLabel}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Real-time Metrics Sidebar (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">
              Real-time Metrics
            </h2>

            {/* Metric 1: Active Karts / Units Count + Green Progress Bar */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-700">{presets.metric1Label}</span>
                <span className="text-emerald-600 font-extrabold text-sm">{presets.metric1Value}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${presets.metric1Percent}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Average Wait Time Gauge + Dark Slate Progress Bar */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-700">{presets.metric2Label}</span>
                <span className="text-slate-900 font-extrabold text-sm">{presets.metric2Value}</span>
              </div>
              {/* Progress bar */}
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
                QUICK STATS
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
    </div>
  );
}
