import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FeatureLockModal({
  isOpen,
  onClose,
  title,
  message,
  targetPack = 'AVANCE',
  onOpenUpgradeRequest,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isSuperadminOrRoot = user?.role === 'SUPERADMIN' || user?.role === 'ROOT';

  const handleAction = () => {
    onClose();
    if (onOpenUpgradeRequest) {
      onOpenUpgradeRequest();
    } else {
      navigate('/abonnement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header gradient banner */}
        <div className="bg-gradient-to-tr from-amber-500 via-indigo-600 to-indigo-800 p-6 text-white text-center relative overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 mx-auto flex items-center justify-center shadow-lg mb-3">
            <Lock size={26} className="text-white" />
          </div>

          <h3 className="text-lg font-black tracking-tight">
            {title || t('subscription.featureLockedTitle', 'Fonctionnalité Verrouillée')}
          </h3>
          <p className="text-xs text-indigo-100 mt-1 max-w-xs mx-auto">
            {t('subscription.featureLockedSub', 'Une mise à niveau de pack est nécessaire pour débloquer cette option.')}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-center">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {message ||
              t(
                'subscription.defaultLockedMsg',
                'Votre entreprise a atteint la limite autorisée par son pack actuel. Passez au pack supérieur pour continuer.'
              )}
          </p>

          <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between text-start">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-indigo-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {targetPack === 'PREMIUM' ? 'Pack 🥇 Premium' : 'Pack 🥈 Avancé'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {targetPack === 'PREMIUM'
                    ? 'Espaces & utilisateurs illimités, personnalisation complète'
                    : '6 espaces, 7 utilisateurs, karts & 3D custom inclus'}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons based on role */}
          <div className="pt-2">
            {isSuperadminOrRoot ? (
              <button
                type="button"
                onClick={handleAction}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>{t('subscription.requestUpgradeBtn', 'Demander une Mise à Niveau')}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-start flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 leading-tight">
                  {t(
                    'subscription.contactAdminNotice',
                    'Veuillez contacter l\'administrateur ou Superadmin de votre entreprise pour demander le déblocage.'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
