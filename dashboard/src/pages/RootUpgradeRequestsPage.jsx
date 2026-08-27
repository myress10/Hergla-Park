import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Building,
  User,
  Phone,
  MessageSquare,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import {
  getRootUpgradeRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  updateCompanyPackDirectly,
} from '../api/subscriptionsApi';
import { toast } from 'react-hot-toast';

export default function RootUpgradeRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE'
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Modal response state for approval/rejection
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: 'APPROVE', // 'APPROVE' | 'REJECT'
    request: null,
    adminResponse: '',
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await getRootUpgradeRequests();
      setRequests(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || t('rootUpgrade.loadError', 'Erreur lors du chargement des demandes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

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
        toast.success(
          t('rootUpgrade.approveSuccess', {
            defaultValue: `Upgrade validé avec succès pour ${request.company?.nom} !`,
            company: request.company?.nom,
          })
        );
      } else {
        await rejectUpgradeRequest(request.id, adminResponse);
        toast.success(t('rootUpgrade.rejectSuccess', 'Demande refusée.'));
      }
      setActionModal({ isOpen: false, type: 'APPROVE', request: null, adminResponse: '' });
      await loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || t('rootUpgrade.actionError', 'Erreur lors du traitement.'));
    } finally {
      setProcessingId(null);
    }
  };

  const getPackBadge = (pack) => {
    switch (pack) {
      case 'PREMIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200">🥇 Premium</span>;
      case 'AVANCE':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200">🥈 Avancé</span>;
      case 'STANDARD':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">🥉 Standard</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROUVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={13} />
            Approuvée
          </span>
        );
      case 'REFUSE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle size={13} />
            Refusée
          </span>
        );
      case 'EN_ATTENTE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
            <Clock size={13} />
            En attente
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {t('rootUpgrade.rootBadge', 'Administration ROOT')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <ShieldCheck size={28} className="text-emerald-400" />
            <span>{t('rootUpgrade.title', 'Gestion des Demandes d\'Upgrade')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {t('rootUpgrade.subtitle', 'Validez ou refusez les demandes de passage aux packs supérieurs pour toutes les entreprises.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRequests}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-colors"
            title="Rafraîchir"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* ── Filter Bar & Search ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('common.all', 'Toutes')} ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('EN_ATTENTE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'EN_ATTENTE' ? 'bg-white text-amber-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t('rootUpgrade.tabPending', 'En attente')}</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('APPROUVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'APPROUVE' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('rootUpgrade.tabApproved', 'Approuvées')}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('REFUSE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'REFUSE' ? 'bg-white text-red-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('rootUpgrade.tabRejected', 'Refusées')}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('rootUpgrade.searchPlaceholder', 'Rechercher entreprise, demandeur...')}
            className="w-full sm:w-80 ps-10 pe-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* ── Table / Cards List ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">{t('common.loading', 'Chargement des demandes...')}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Sparkles size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">{t('rootUpgrade.emptyTitle', 'Aucune demande trouvée')}</p>
            <p className="text-xs text-slate-400">{t('rootUpgrade.emptySub', 'Toutes les demandes de mise à niveau ont été traitées.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Company & Requester Info */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                      <Building size={15} className="text-slate-400" />
                      {req.company?.nom}
                    </span>
                    {getStatusBadge(req.status)}
                    <span className="text-[11px] text-slate-400">
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Pack Transition Indicator */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 font-medium">{t('rootUpgrade.current', 'Actuel :')}</span>
                    {getPackBadge(req.currentPack)}
                    <ArrowRight size={14} className="text-indigo-600" />
                    <span className="text-xs text-slate-500 font-medium">{t('rootUpgrade.requested', 'Demandé :')}</span>
                    {getPackBadge(req.targetPack)}
                  </div>

                  {/* Requester Contact Info */}
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

                  {/* Client Notes / Requirements */}
                  {req.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium flex items-start gap-2 mt-2">
                      <MessageSquare size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="italic leading-relaxed">"{req.notes}"</p>
                    </div>
                  )}

                  {/* Admin response log if processed */}
                  {req.adminResponse && (
                    <p className="text-[11px] text-slate-400">
                      <strong>Réponse Admin :</strong> {req.adminResponse}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
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
                        <span>{t('rootUpgrade.approveBtn', 'Approuver & Activer')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => handleOpenActionModal(req, 'REJECT')}
                        className="px-3.5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        <X size={14} />
                        <span>{t('rootUpgrade.rejectBtn', 'Refuser')}</span>
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

      {/* ── Action Confirmation Modal ──────────────────────────────────────── */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
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
                    {actionModal.type === 'APPROVE' ? 'Confirmer l\'Approbation' : 'Confirmer le Refus'}
                  </h3>
                  <p className="text-xs text-white/80">{actionModal.request?.company?.nom}</p>
                </div>
              </div>
              <button
                onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', request: null, adminResponse: '' })}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {actionModal.type === 'APPROVE'
                  ? `L'entreprise passera immédiatement au pack ${actionModal.request?.targetPack}. Tous les nouveaux quotas seront appliqués.`
                  : 'La demande sera marquée comme refusée et l\'action sera consignée dans les logs d\'audit.'}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message ou note pour le client / logs
                </label>
                <textarea
                  rows={2}
                  value={actionModal.adminResponse}
                  onChange={(e) =>
                    setActionModal((prev) => ({ ...prev, adminResponse: e.target.value }))
                  }
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
                  {actionModal.type === 'APPROVE' ? 'Valider l\'Upgrade' : 'Confirmer le Refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
