import { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, Lock, Eye, EyeOff, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const VALIDATION_WORD = 'hergla000';

/**
 * RootVerificationModal Component
 * Prompts ROOT users for security passcode ('hergla000') and an audit reason
 * before executing any sensitive write action.
 */
export default function RootVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Validation Sécurité ROOT Required",
  actionName = "Intervention d'écriture",
}) {
  const [passcode, setPasscode] = useState('');
  const [reason, setReason] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setReason('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Verify Passcode
    if (passcode.trim() !== VALIDATION_WORD) {
      setErrorMsg(`Code de validation incorrect ! Tapez le mot de passe requis ('${VALIDATION_WORD}').`);
      toast.error(`Code de validation incorrect. Intervention refusée.`);
      return;
    }

    // 2. Verify Reason
    const finalReason = reason.trim() || `Intervention ROOT autorisée [Code: ${VALIDATION_WORD}]`;

    setIsSubmitting(true);
    try {
      onConfirm({ passcode: passcode.trim(), reason: finalReason });
      onClose();
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'exécution de l'intervention");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-slate-100">{title}</h3>
              <p className="text-xs text-amber-400 font-medium">Contrôle d'accès & Audit ROOT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Action ciblée : <strong className="font-semibold text-amber-900">{actionName}</strong>. 
              Pour valider cette intervention ROOT, veuillez saisir le code de validation (<strong>hergla000</strong>) et préciser le motif.
            </p>
          </div>

          {/* Validation Word Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <KeyRound size={14} className="text-slate-500" />
              Mot de passe de validation <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setErrorMsg(''); }}
                placeholder="Saisissez le code (ex: hergla000)"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((p) => !p)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Lock size={14} className="text-slate-500" />
              Motif d'intervention / Observations
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ex: Maintenance d'urgence effectuée par le SuperAdmin ROOT"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Validation Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              ❌ {errorMsg}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md flex items-center gap-2"
            >
              <KeyRound size={14} />
              Valider &amp; Exécuter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
