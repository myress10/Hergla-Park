import { Plus } from 'lucide-react';

export default function AddKartButton({ onAdd, disabled }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      id="add-kart-btn"
      className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-navy/50 bg-slate-50/50 hover:bg-slate-100/80 text-slate-600 hover:text-navy font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow"
    >
      <div className="w-6 h-6 rounded-full bg-navy/10 text-navy flex items-center justify-center">
        <Plus size={16} />
      </div>
      <span>Ajouter un kart sur la piste</span>
    </button>
  );
}
