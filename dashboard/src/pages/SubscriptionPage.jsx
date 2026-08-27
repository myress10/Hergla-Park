import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Layers,
  Users,
  Box,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Send,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { getMyPlan } from '../api/subscriptionsApi';
import UpgradeRequestModal from '../components/subscription/UpgradeRequestModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedTargetPack, setSelectedTargetPack] = useState('AVANCE');

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await getMyPlan();
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || t('subscription.loadError', 'Impossible de charger les données du plan.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const openUpgrade = (target) => {
    setSelectedTargetPack(target);
    setUpgradeModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">{t('common.loading', 'Chargement de votre abonnement...')}</p>
        </div>
      </div>
    );
  }

  const currentPack = data?.company?.pack || 'STANDARD';
  const usage = data?.usage || {};
  const pending = data?.pendingUpgradeRequest;

  return (
    <div className="flex-1 p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -end-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-indigo-300 border border-white/10">
              {t('subscription.activeCompany', 'Entreprise :')} {data?.company?.nom}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('subscription.title', 'Mon Abonnement & Quotas')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {t('subscription.subtitle', 'Gérez les capacités de votre plateforme virtuelle, suivez l\'utilisation des ressources et évoluez sans interruption.')}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {currentPack !== 'PREMIUM' && (
            <button
              onClick={() => openUpgrade(currentPack === 'STANDARD' ? 'AVANCE' : 'PREMIUM')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all"
            >
              <Zap size={16} />
              <span>{t('subscription.upgradeHeaderBtn', 'Demander une mise à niveau')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Pending Upgrade Notice Banner ──────────────────────────────────── */}
      {pending && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-800">
                {t('subscription.pendingBannerTitle', 'Demande de mise à niveau en cours de traitement')}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {t('subscription.pendingBannerSub', 'Votre demande pour passer au pack')} <strong>{pending.targetPack}</strong> {t('subscription.pendingBannerSub2', 'a été transmise à l\'équipe plateforme le')} {new Date(pending.createdAt).toLocaleDateString()}.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-extrabold px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full">
            {t('subscription.pendingStatus', 'En attente de validation ROOT')}
          </span>
        </div>
      )}

      {/* ── Quota Usage Metrics Cards ───────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers size={16} className="text-indigo-600" />
          <span>{t('subscription.usageSectionTitle', 'Utilisation des Quotas Actuels')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Espaces */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{t('subscription.spacesQuota', 'Espaces 3D')}</p>
                  <p className="text-[11px] text-slate-400">{t('subscription.spacesQuotaSub', 'Visites virtuelles actives')}</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-700">
                {usage.espaces?.current} / {usage.espaces?.isUnlimited ? '∞' : usage.espaces?.max}
              </span>
            </div>

            {/* Progress bar */}
            {!usage.espaces?.isUnlimited ? (
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.espaces?.isExceeded
                        ? 'bg-red-500'
                        : (usage.espaces?.percent || 0) > 80
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(usage.espaces?.percent || 0, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{usage.espaces?.percent || 0}% utilisé</span>
                  {usage.espaces?.isExceeded && (
                    <span className="text-red-500 font-bold">{t('subscription.quotaExceeded', 'Limite atteinte')}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-2 px-3 bg-emerald-50 rounded-xl text-[11px] font-bold text-emerald-700 flex items-center gap-2">
                <ShieldCheck size={14} />
                <span>{t('subscription.unlimitedSpaceQuota', 'Espaces illimités (Pack Premium)')}</span>
              </div>
            )}
          </div>

          {/* 2. Utilisateurs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{t('subscription.usersQuota', 'Collaborateurs')}</p>
                  <p className="text-[11px] text-slate-400">{t('subscription.usersQuotaSub', 'Comptes actifs sur l\'entreprise')}</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-700">
                {usage.users?.current} / {usage.users?.isUnlimited ? '∞' : usage.users?.max}
              </span>
            </div>

            {/* Progress bar */}
            {!usage.users?.isUnlimited ? (
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usage.users?.isExceeded
                        ? 'bg-red-500'
                        : (usage.users?.percent || 0) > 80
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(usage.users?.percent || 0, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{usage.users?.percent || 0}% utilisé</span>
                  {usage.users?.isExceeded && (
                    <span className="text-red-500 font-bold">{t('subscription.quotaExceeded', 'Limite atteinte')}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-2 px-3 bg-emerald-50 rounded-xl text-[11px] font-bold text-emerald-700 flex items-center gap-2">
                <ShieldCheck size={14} />
                <span>{t('subscription.unlimitedUsersQuota', 'Membres illimités (Pack Premium)')}</span>
              </div>
            )}
          </div>

          {/* 3. Custom 3D Objects */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Box size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{t('subscription.customObjectsQuota', 'Modèles 3D Custom')}</p>
                  <p className="text-[11px] text-slate-400">{t('subscription.customObjectsQuotaSub', 'Uploads .glb personnalisés')}</p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-700">
                {usage.customObjects?.isAllowed
                  ? `${usage.customObjects?.current} / ${usage.customObjects?.isUnlimited ? '∞' : usage.customObjects?.max}`
                  : 'Catalogue Seul'}
              </span>
            </div>

            {usage.customObjects?.isAllowed ? (
              !usage.customObjects?.isUnlimited ? (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usage.customObjects?.isExceeded
                          ? 'bg-red-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(usage.customObjects?.percent || 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{usage.customObjects?.percent || 0}% utilisé</span>
                  </div>
                </div>
              ) : (
                <div className="py-2 px-3 bg-emerald-50 rounded-xl text-[11px] font-bold text-emerald-700 flex items-center gap-2">
                  <ShieldCheck size={14} />
                  <span>{t('subscription.unlimited3dQuota', 'Uploads 3D illimités (Pack Premium)')}</span>
                </div>
              )
            ) : (
              <div className="py-2 px-3 bg-slate-100 rounded-xl text-[11px] font-medium text-slate-500 flex items-center justify-between">
                <span>{t('subscription.catalogOnly', 'Catalogue standard uniquement')}</span>
                <span className="text-indigo-600 font-bold text-[10px]">Upgrade requis</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3-Tier Plans Matrix ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600" />
            <span>{t('subscription.packsComparisonTitle', 'Comparatif des Offres')}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('subscription.packsComparisonSub', 'Choisissez l\'offre la mieux adaptée aux ambitions et dimensions de vos espaces.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* 🥉 Pack STANDARD */}
          <div
            className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between ${
              currentPack === 'STANDARD'
                ? 'border-indigo-600 shadow-xl ring-4 ring-indigo-500/10'
                : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                  🥉 Standard
                </span>
                {currentPack === 'STANDARD' && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                    {t('subscription.currentPlanBadge', 'Pack Actuel')}
                  </span>
                )}
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900">
                  190 <span className="text-xs font-bold text-slate-500">TND / mois</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  À partir de 190 TND. Idéal pour débuter votre digitalisation.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                {[
                  'Jusqu\'à 3 espaces de visite 3D',
                  'Jusqu\'à 3 collaborateurs',
                  'Catalogue 3D de base complet',
                  'Éditeur interactif de scènes 3D',
                  'Support par email standard',
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <Check size={14} className="text-emerald-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              {currentPack === 'STANDARD' ? (
                <div className="w-full py-2.5 text-center text-xs font-bold text-slate-500 bg-slate-100 rounded-xl">
                  {t('subscription.planActiveBtn', 'Actif pour votre entreprise')}
                </div>
              ) : (
                <div className="w-full py-2.5 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-xl">
                  {t('subscription.standardPlanBase', 'Pack Initial')}
                </div>
              )}
            </div>
          </div>

          {/* 🥈 Pack AVANCÉ (Featured / Most Popular) */}
          <div
            className={`bg-white rounded-3xl p-6 border-2 relative transition-all flex flex-col justify-between ${
              currentPack === 'AVANCE'
                ? 'border-indigo-600 shadow-2xl ring-4 ring-indigo-500/10'
                : 'border-indigo-200 hover:border-indigo-300 shadow-md'
            }`}
          >
            {/* Pop badge */}
            <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                Recommandé
              </span>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                  🥈 Avancé
                </span>
                {currentPack === 'AVANCE' && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                    {t('subscription.currentPlanBadge', 'Pack Actuel')}
                  </span>
                )}
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900">
                  450 <span className="text-xs font-bold text-slate-500">TND / mois</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  À partir de 450 TND. Pour parcs et structures en forte croissance.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                {[
                  'Jusqu\'à 6 espaces de visite 3D',
                  'Jusqu\'à 7 collaborateurs',
                  'Upload de 10 modèles 3D custom (.glb)',
                  'Module spécifique Karts & Circuits inclus',
                  'Journal d\'audit d\'activité (30 jours)',
                  'Support prioritaire',
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <Check size={14} className="text-indigo-600 flex-shrink-0" />
                    <span className="font-semibold">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              {currentPack === 'AVANCE' ? (
                <div className="w-full py-2.5 text-center text-xs font-bold text-indigo-700 bg-indigo-50 rounded-xl">
                  {t('subscription.planActiveBtn', 'Actif pour votre entreprise')}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openUpgrade('AVANCE')}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send size={13} />
                  <span>{t('subscription.requestUpgradeBtn', 'Demander ce pack')}</span>
                </button>
              )}
            </div>
          </div>

          {/* 🥇 Pack PREMIUM (Enterprise) */}
          <div
            className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between ${
              currentPack === 'PREMIUM'
                ? 'border-indigo-600 shadow-2xl ring-4 ring-indigo-500/10'
                : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-50 text-amber-800">
                  🥇 Premium
                </span>
                {currentPack === 'PREMIUM' && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                    {t('subscription.currentPlanBadge', 'Pack Actuel')}
                  </span>
                )}
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900">
                  Sur Devis <span className="text-xs font-bold text-slate-500">Entreprise</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Infrastructure illimitée et sur-mesure pour parcs d'envergure.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                {[
                  'Espaces de visite 3D ILLIMITÉS (∞)',
                  'Collaborateurs ILLIMITÉS (∞)',
                  'Uploads 3D personnalisés ILLIMITÉS (∞)',
                  'Tous les modules métier & extensions',
                  'Rôles et permissions 100% sur-mesure',
                  'Historique complet des logs d\'audit',
                  'Account Manager & assistance dédiée',
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <Check size={14} className="text-emerald-600 flex-shrink-0" />
                    <span className="font-bold">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              {currentPack === 'PREMIUM' ? (
                <div className="w-full py-2.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl">
                  {t('subscription.planActiveBtn', 'Actif pour votre entreprise')}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openUpgrade('PREMIUM')}
                  className="w-full py-2.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send size={13} />
                  <span>{t('subscription.requestQuoteBtn', 'Demander un Devis Entreprise')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Upgrade Request Modal ──────────────────────────────────────────── */}
      <UpgradeRequestModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPack={currentPack}
        targetPackDefault={selectedTargetPack}
        companyId={data?.company?.id}
        onSuccess={fetchPlan}
      />
    </div>
  );
}
