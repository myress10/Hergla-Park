import { useState, useRef, useEffect } from 'react';
import { updateEspace } from '../api/espacesApi';
import { ChevronDown, CheckCircle, XCircle, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'OUVERT', label: 'Ouvert', Icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  { value: 'FERME', label: 'Fermé', Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-500' },
  { value: 'MAINTENANCE', label: 'Maintenance', Icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
];

/**
 * 3-state status dropdown for OUVERT / FERME / MAINTENANCE.
 * Optimistic UI update with rollback on error.
 */
export default function StatusToggle({ espaceId, currentStatus, onUpdate, disabled = false }) {
  const [optimistic, setOptimistic] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  const current = STATUS_OPTIONS.find((o) => o.value === optimistic) || STATUS_OPTIONS[0];

  const handleSelect = async (newStatus) => {
    if (loading || disabled || newStatus === optimistic) { setOpen(false); return; }
    const previous = optimistic;
    setOptimistic(newStatus);
    setOpen(false);
    setLoading(true);
    try {
      const response = await updateEspace(espaceId, { statut: newStatus });
      if (onUpdate) onUpdate(response.data.data || response.data);
    } catch (error) {
      setOptimistic(previous);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
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
        <div className="absolute end-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              id={`status-opt-${espaceId}-${opt.value.toLowerCase()}`}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50
                ${opt.value === optimistic ? `${opt.color} font-semibold` : 'text-slate-600'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
              {opt.label}
              {opt.value === optimistic && <span className="ms-auto text-emerald-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
