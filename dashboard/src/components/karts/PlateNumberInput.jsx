import React from 'react';
import { Hash } from 'lucide-react';

export default function PlateNumberInput({ value, onChange, error }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <Hash size={14} className="text-navy" />
        <span>Numéro de plaque</span>
      </label>

      <div className="relative">
        <input
          type="text"
          maxLength={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="Ex: 07"
          className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm font-black font-mono tracking-widest text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:ring-red-200 bg-red-50/50'
              : 'border-slate-200 focus:ring-navy/20 focus:border-navy'
          }`}
        />
        <div className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
          {(value || '').length}/3
        </div>
      </div>

      {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}
    </div>
  );
}
