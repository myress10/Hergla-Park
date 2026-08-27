import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Sparkles, Phone, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { requestUpgrade } from '../../api/subscriptionsApi';
import { toast } from 'react-hot-toast';

export default function UpgradeRequestModal({
  isOpen,
  onClose,
  currentPack,
  targetPackDefault = 'AVANCE',
  companyId,
  onSuccess,
}) {
  const { t } = useTranslation();
  const [targetPack, setTargetPack] = useState(targetPackDefault || 'AVANCE');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await requestUpgrade({
        targetPack,
        notes,
        contactPhone,
        companyId,
      });

      toast.success(t('subscription.requestSuccess', 'Demande de mise à niveau envoyée avec succès !'));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t('subscription.requestError', 'Erreur lors de l\'envoi de la demande.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/20">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {t('subscription.modalTitle', 'Demande de Mise à Niveau')}
              </h3>
              <p className="text-xs text-slate-300">
                {t('subscription.modalSubtitle', 'Faites évoluer votre infrastructure virtuelle SaaS')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Pack Choice */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
              {t('subscription.chooseTargetPack', 'Pack Souhaité')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option Avancé */}
              <div
                onClick={() => setTargetPack('AVANCE')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  targetPack === 'AVANCE'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-900">🥈 Avancé</span>
                  {targetPack === 'AVANCE' && <CheckCircle2 size={16} className="text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">6 Espaces • 7 Utilisateurs • 10 Objets 3D</p>
                <p className="text-xs font-bold text-indigo-700 mt-2">Dès 450 TND / mois</p>
              </div>

              {/* Option Premium */}
              <div
                onClick={() => setTargetPack('PREMIUM')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  targetPack === 'PREMIUM'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-900">🥇 Premium</span>
                  {targetPack === 'PREMIUM' && <CheckCircle2 size={16} className="text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Illimité (∞) • Rôles sur-mesure • Audit</p>
                <p className="text-xs font-bold text-indigo-700 mt-2">Sur Devis Entreprise</p>
              </div>
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" />
                {t('subscription.phoneLabel', 'Téléphone de contact')}
              </span>
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+216 99 000 000"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Needs / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-slate-400" />
                {t('subscription.notesLabel', 'Précisez vos besoins ou questions')}
              </span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('subscription.notesPlaceholder', 'Ex: Nous souhaitons ajouter 4 nouveaux espaces et intégrer notre catalogue de karts...')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
            />
          </div>

          {/* Notice info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {t('subscription.modalNotice', 'Un responsable de l\'équipe plateforme examinera votre demande et confirmera l\'activation directe de votre nouveau pack.')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('common.cancel', 'Annuler')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>{t('common.sending', 'Envoi en cours...')}</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>{t('subscription.submitRequest', 'Envoyer la Demande')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
