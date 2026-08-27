import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Building,
  User,
  Phone,
  MessageSquare,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Zap,
  CreditCard,
  Mail,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import {
  getRootUpgradeRequests,
  getRootCompanies,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  updateCompanyPackDirectly,
} from '../api/subscriptionsApi';
import { toast } from 'react-hot-toast';

const PACKS = [
  { value: 'STANDARD', label: 'Standard', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  { value: 'AVANCE', label: 'Avancé', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  { value: 'PREMIUM', label: 'Premium', color: 'bg-amber-100 text-amber-900 border-amber-200', dot: 'bg-amber-500' },
];

function PackBadge({ pack }) {
  const cfg = PACKS.find((p) => p.value === pack) || PACKS[0];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  switch (status) {
    case 'APPROUVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle size={13} /> Approuvée
        </span>
      );
    case 'REFUSE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={13} /> Refusée
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
          <Clock size={13} /> En attente
        </span>
      );
  }
}

// ── Direct company pack override modal ──────────────────────────────────────
function DirectOverrideModal({ company, onClose, onSuccess }) {
  const [selectedPack, setSelectedPack] = useState(company.pack);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selectedPack === company.pack) {
      toast('Aucun changement détecté.', { icon: '⚠️' });
      return;
    }
    setSaving(true);
    try {
      await updateCompanyPackDirectly(company.id, selectedPack, reason || `Pack mis à jour vers ${selectedPack} par ROOT.`);
      toast.success(`Pack de ${company.nom} mis à jour vers ${selectedPack} !`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du pack.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-violet-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-black text-base">Modifier le Pack</h3>
              <p className="text-xs text-white/80">{company.nom}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/20">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Current pack display */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pack actuel</span>
            <PackBadge pack={company.pack} />
          </div>

          {/* Pack selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Nouveau pack</label>
            <div className="grid grid-cols-3 gap-2">
              {PACKS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setSelectedPack(p.value)}
                  className={`relative p-3 rounded-2xl border-2 text-center transition-all ${
                    selectedPack === p.value
                      ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-600/10'
                      : 'border-slate-200 hover:border-indigo-300 bg-white'
                  }`}
                >
                  {selectedPack === p.value && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </span>
                  )}
                  <span className={`w-2.5 h-2.5 rounded-full ${p.dot} mx-auto mb-1.5 block`} />
                  <span className="text-xs font-bold text-slate-800">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Raison / Note d'audit <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex : Accord commercial signé, période d'essai premium..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
            />
          </div>

          {/* Confirm */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
              Annuler
            </button>
            <button
              type="button"
              disabled={saving || selectedPack === company.pack}
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {saving ? 'Application...' : `Appliquer ${selectedPack}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Companies Tab ────────────────────────────────────────────────────────────
function CompaniesTab() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [overrideTarget, setOverrideTarget] = useState(null); // company to override

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await getRootCompanies();
      setCompanies(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du chargement des entreprises.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCompanies(); }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.pack.toLowerCase().includes(q) ||
        c.superadmins?.some((sa) => sa.nom.toLowerCase().includes(q) || sa.email.toLowerCase().includes(q))
    );
  }, [companies, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">
          {companies.length} entreprise{companies.length !== 1 ? 's' : ''} enregistrée{companies.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher entreprise, superadmin..."
              className="ps-9 pe-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm w-64 transition-all"
            />
          </div>
          <button
            onClick={loadCompanies}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors shadow-sm"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Chargement des entreprises...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Building size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Aucune entreprise trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((company) => (
              <div
                key={company.id}
                className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Company info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                    <Building size={20} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900">{company.nom}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{company.slug}</span>
                      <PackBadge pack={company.pack} />
                      {company.counts?.pendingUpgrades > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={11} />
                          {company.counts.pendingUpgrades} demande{company.counts.pendingUpgrades > 1 ? 's' : ''} en attente
                        </span>
                      )}
                    </div>

                    {/* Superadmins */}
                    {company.superadmins?.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {company.superadmins.map((sa) => (
                          <div key={sa.id} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <User size={12} className="text-slate-400" />
                            <span className="font-semibold">{sa.nom}</span>
                            <span className="text-slate-400">·</span>
                            <span>{sa.email}</span>
                            {sa.telephone && (
                              <>
                                <span className="text-slate-400">·</span>
                                <Phone size={11} className="text-slate-400" />
                                <span>{sa.telephone}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Aucun superadmin assigné</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                      <span>{company.counts?.espaces ?? 0} espace{(company.counts?.espaces ?? 0) !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{company.counts?.users ?? 0} utilisateur{(company.counts?.users ?? 0) !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{company.counts?.customObjects ?? 0} objets 3D custom</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button
                  type="button"
                  onClick={() => setOverrideTarget(company)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex-shrink-0"
                >
                  <Zap size={14} />
                  Modifier le Pack
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Override Modal */}
      {overrideTarget && (
        <DirectOverrideModal
          company={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onSuccess={loadCompanies}
        />
      )}
    </div>
  );
}

// ── Upgrade Requests Tab ─────────────────────────────────────────────────────
function RequestsTab() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: 'APPROVE',
    request: null,
    adminResponse: '',
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await getRootUpgradeRequests();
      setRequests(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || t('rootUpgrade.loadError', 'Erreur lors du chargement des demandes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchTab = filterTab === 'ALL' || r.status === filterTab;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        r.company?.nom?.toLowerCase().includes(query) ||
        r.requestedBy?.nom?.toLowerCase().includes(query) ||
        r.requestedBy?.email?.toLowerCase().includes(query) ||
        r.targetPack?.toLowerCase().includes(query);
      return matchTab && matchSearch;
    });
  }, [requests, filterTab, searchQuery]);

  const pendingCount = requests.filter((r) => r.status === 'EN_ATTENTE').length;

  const handleOpenActionModal = (request, type) => {
    setActionModal({
      isOpen: true,
      type,
      request,
      adminResponse:
        type === 'APPROVE'
          ? `Mise à niveau validée vers le pack ${request.targetPack}.`
          : 'Demande refusée pour le moment.',
    });
  };

  const handleConfirmAction = async () => {
    const { request, type, adminResponse } = actionModal;
    if (!request) return;
    setProcessingId(request.id);
    try {
      if (type === 'APPROVE') {
        await approveUpgradeRequest(request.id, adminResponse);
        toast.success(`Upgrade validé pour ${request.company?.nom} !`);
      } else {
        await rejectUpgradeRequest(request.id, adminResponse);
        toast.success('Demande refusée.');
      }
      setActionModal({ isOpen: false, type: 'APPROVE', request: null, adminResponse: '' });
      await loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || t('rootUpgrade.actionError', 'Erreur lors du traitement.'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter + Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl">
          {[
            { key: 'ALL', label: `Toutes (${requests.length})` },
            { key: 'EN_ATTENTE', label: 'En attente', badge: pendingCount },
            { key: 'APPROUVE', label: 'Approuvées' },
            { key: 'REFUSE', label: 'Refusées' },
          ].map(({ key, label, badge }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
              {badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher entreprise, demandeur..."
            className="w-full sm:w-80 ps-10 pe-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Chargement des demandes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Sparkles size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Aucune demande trouvée</p>
            <p className="text-xs text-slate-400">Toutes les demandes de mise à niveau ont été traitées.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                      <Building size={15} className="text-slate-400" />
                      {req.company?.nom}
                    </span>
                    <StatusBadge status={req.status} />
                    <span className="text-[11px] text-slate-400">
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 font-medium">Actuel :</span>
                    <PackBadge pack={req.currentPack} />
                    <ArrowRight size={14} className="text-indigo-600" />
                    <span className="text-xs text-slate-500 font-medium">Demandé :</span>
                    <PackBadge pack={req.targetPack} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      {req.requestedBy?.nom} ({req.requestedBy?.email})
                    </span>
                    {req.contactPhone && (
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Phone size={13} className="text-slate-400" />
                        {req.contactPhone}
                      </span>
                    )}
                  </div>

                  {req.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium flex items-start gap-2 mt-2">
                      <MessageSquare size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="italic leading-relaxed">"{req.notes}"</p>
                    </div>
                  )}

                  {req.adminResponse && (
                    <p className="text-[11px] text-slate-400">
                      <strong>Réponse Admin :</strong> {req.adminResponse}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {req.status === 'EN_ATTENTE' ? (
                    <>
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleOpenActionModal(req, 'APPROVE')}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <Check size={14} />
                        Approuver & Activer
                      </button>
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleOpenActionModal(req, 'REJECT')}
                        className="px-3.5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <X size={14} />
                        Refuser
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      {req.status === 'APPROUVE' ? 'Traité & Actif' : 'Demande Clôturée'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div
              className={`p-6 text-white flex items-center justify-between ${
                actionModal.type === 'APPROVE'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
                  : 'bg-gradient-to-r from-red-600 to-red-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  {actionModal.type === 'APPROVE' ? <Check size={20} /> : <X size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {actionModal.type === 'APPROVE' ? "Confirmer l'Approbation" : 'Confirmer le Refus'}
                  </h3>
                  <p className="text-xs text-white/80">{actionModal.request?.company?.nom}</p>
                </div>
              </div>
              <button
                onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', request: null, adminResponse: '' })}
                className="p-1.5 rounded-xl hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {actionModal.type === 'APPROVE'
                  ? `L'entreprise passera immédiatement au pack ${actionModal.request?.targetPack}. Tous les nouveaux quotas seront appliqués.`
                  : "La demande sera marquée comme refusée et l'action sera consignée dans les logs d'audit."}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message ou note pour le client / logs
                </label>
                <textarea
                  rows={2}
                  value={actionModal.adminResponse}
                  onChange={(e) => setActionModal((prev) => ({ ...prev, adminResponse: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', request: null, adminResponse: '' })}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={processingId !== null}
                  onClick={handleConfirmAction}
                  className={`px-5 py-2.5 text-xs font-extrabold text-white rounded-xl shadow-lg transition-all ${
                    actionModal.type === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                      : 'bg-red-600 hover:bg-red-500 shadow-red-600/25'
                  }`}
                >
                  {actionModal.type === 'APPROVE' ? "Valider l'Upgrade" : 'Confirmer le Refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function RootUpgradeRequestsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'companies'

  const tabs = [
    { key: 'requests', label: "Demandes d'Upgrade", icon: Clock },
    { key: 'companies', label: 'Gérer les Entreprises', icon: Building },
  ];

  return (
    <div className="flex-1 p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Administration ROOT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <ShieldCheck size={28} className="text-emerald-400" />
            <span>Gestion des Abonnements</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Validez les demandes d'upgrade ou modifiez directement le pack de n'importe quelle entreprise.
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === key
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      {activeTab === 'requests' ? <RequestsTab /> : <CompaniesTab />}
    </div>
  );
}
