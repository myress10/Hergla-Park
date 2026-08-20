import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateEspace } from '../api/espacesApi';
import { ChevronDown, CheckCircle, XCircle, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import RootVerificationModal from './RootVerificationModal';

const STATUS_CONFIGS = {
  OUVERT: { Icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  FERME: { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-500' },
  MAINTENANCE: { Icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
};

export default function StatusToggle({ espaceId, currentStatus, onUpdate, disabled = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [optimistic, setOptimistic] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [rootModalOpen, setRootModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const ref = useRef(null);

  const statusList = [
    { value: 'OUVERT', label: t('spaces.statuses.OUVERT'), ...STATUS_CONFIGS.OUVERT },
    { value: 'FERME', label: t('spaces.statuses.FERME'), ...STATUS_CONFIGS.FERME },
    { value: 'MAINTENANCE', label: t('spaces.statuses.MAINTENANCE'), ...STATUS_CONFIGS.MAINTENANCE },
  ];

  // Sync if parent updates the status externally
  useEffect(() => {
    setOptimistic(currentStatus);
  }, [currentStatus]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = statusList.find((o) => o.value === optimistic) || statusList[0];

  const performUpdate = async (newStatus, reason) => {
    const previous = optimistic;
    setOptimistic(newStatus);
    setLoading(true);
    try {
      const response = await updateEspace(espaceId, { statut: newStatus }, reason);
      if (onUpdate) onUpdate(response.data.data || response.data);
      toast.success(t('spaces.statusUpdated', { status: t('spaces.statuses.' + newStatus) }));
    } catch (error) {
      setOptimistic(previous);
      toast.error(error.response?.data?.message || t('spaces.statusUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (newStatus) => {
    if (loading || disabled || newStatus === optimistic) { setOpen(false); return; }
    setOpen(false);
    if (user?.role === 'ROOT') {
      setPendingStatus(newStatus);
      setRootModalOpen(true);
      return;
    }
    performUpdate(newStatus);
  };

  const handleRootConfirm = ({ passcode, reason }) => {
    if (!pendingStatus) return;
    performUpdate(pendingStatus, `${reason} [Validé avec code ${passcode}]`);
    setPendingStatus(null);
  };

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        id={`status-toggle-${espaceId}`}
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setOpen((p) => !p)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all
          ${current.bg} ${current.color} border-current/20
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
          ${loading ? 'opacity-60' : ''}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot} ${loading ? 'animate-pulse' : ''}`} />
        {current.label}
        {!disabled && <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="absolute end-0 bottom-full mb-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[145px] backdrop-blur-sm">
          {statusList.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              id={`status-opt-${espaceId}-${opt.value.toLowerCase()}`}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50
                ${opt.value === optimistic ? `${opt.color} font-bold bg-slate-50/70` : 'text-slate-600'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
              {opt.label}
              {opt.value === optimistic && <span className="ms-auto text-emerald-500 font-bold">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* ROOT Security Verification Modal */}
      <RootVerificationModal
        isOpen={rootModalOpen}
        onClose={() => { setRootModalOpen(false); setPendingStatus(null); }}
        onConfirm={handleRootConfirm}
        title={t('rootModal.title')}
        actionName={`${t('spaces.card.status')} (➔ ${t('spaces.statuses.' + pendingStatus)})`}
      />
    </div>
  );
}
