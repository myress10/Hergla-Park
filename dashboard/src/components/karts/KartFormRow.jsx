import { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, Power, Palette, AlertCircle } from 'lucide-react';

export const PRESET_COLORS = [
  { name: 'Rouge Hergla', hex: '#E53935' },
  { name: 'Bleu Racing', hex: '#1E88E5' },
  { name: 'Vert Piste', hex: '#4CAF50' },
  { name: 'Jaune Jaillissant', hex: '#FBC02D' },
  { name: 'Orange Nitro', hex: '#FB8C00' },
  { name: 'Violet Speed', hex: '#8E24AA' },
  { name: 'Cyan Turbo', hex: '#00ACC1' },
  { name: 'Noir Carbone', hex: '#263238' },
];

export default function KartFormRow({
  kart,
  index,
  totalCount,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  error,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div
      className={`group relative flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${
        error
          ? 'bg-red-50/50 border-red-300 shadow-sm'
          : kart.actif === false
          ? 'bg-slate-50/80 border-slate-200 opacity-75'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'
      }`}
      id={`kart-row-${index}`}
    >
      {/* Reorder Up / Down Controls */}
      <div className="flex flex-col gap-0.5 text-slate-400">
        <button
          type="button"
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="p-1 rounded hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          title="Monter"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMoveDown(index)}
          disabled={index === totalCount - 1}
          className="p-1 rounded hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
          title="Descendre"
        >
          <ArrowDown size={14} />
        </button>
      </div>

      {/* Index Order Badge */}
      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
        #{index + 1}
      </div>

      {/* Race Number Input */}
      <div className="w-28 flex-shrink-0">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          N° Course
        </label>
        <div className="relative">
          <input
            type="text"
            value={kart.numero}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 3);
              onUpdate(index, { numero: val });
            }}
            placeholder="ex: 07"
            maxLength={3}
            className={`w-full px-3 py-2 rounded-xl border text-sm font-bold text-center font-mono focus:outline-none transition-all ${
              error
                ? 'border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-300'
                : 'border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 focus:ring-2 focus:ring-navy/20'
            }`}
          />
        </div>
      </div>

      {/* Color Selection */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Couleur Carrosserie
        </label>
        <div className="flex items-center gap-2">
          {/* Main Color Indicator Pill */}
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
          >
            <span
              className="w-4 h-4 rounded-full border border-black/10 shadow-inner flex-shrink-0"
              style={{ backgroundColor: kart.couleur || '#E53935' }}
            />
            <span className="font-mono">{kart.couleur || '#E53935'}</span>
            <Palette size={14} className="text-slate-400 ms-1" />
          </button>

          {/* Quick Palette Swatches */}
          <div className="hidden md:flex items-center gap-1.5 ms-1">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => onUpdate(index, { couleur: preset.hex })}
                title={preset.name}
                className={`w-6 h-6 rounded-lg transition-transform hover:scale-110 border border-black/10 flex items-center justify-center ${
                  kart.couleur?.toLowerCase() === preset.hex.toLowerCase()
                    ? 'ring-2 ring-navy ring-offset-1 scale-110'
                    : ''
                }`}
                style={{ backgroundColor: preset.hex }}
              />
            ))}
          </div>
        </div>

        {/* Extended Color Picker Dropdown */}
        {showColorPicker && (
          <div className="absolute z-30 mt-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-200 space-y-2 animate-in fade-in zoom-in-95">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Palette Héritage Hergla Park
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => {
                    onUpdate(index, { couleur: preset.hex });
                    setShowColorPicker(false);
                  }}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-[11px] text-slate-700 font-medium"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="truncate">{preset.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-500">Couleur Personnalisée :</span>
              <input
                type="color"
                value={kart.couleur || '#E53935'}
                onChange={(e) => onUpdate(index, { couleur: e.target.value.toUpperCase() })}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Active Toggle Switch */}
      <div className="flex flex-col items-center">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Statut Piste
        </label>
        <button
          type="button"
          onClick={() => onUpdate(index, { actif: !kart.actif })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            kart.actif !== false
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
          title={kart.actif !== false ? 'Actif sur la piste' : 'En maintenance (masqué)'}
        >
          <Power size={13} />
          <span>{kart.actif !== false ? 'Actif' : 'Maintenance'}</span>
        </button>
      </div>

      {/* Delete Button */}
      <div className="ms-auto flex items-center">
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Supprimer ce kart"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Error Message display */}
      {error && (
        <div className="w-full flex items-center gap-1.5 text-xs font-medium text-red-600 mt-1">
          <AlertCircle size={13} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
