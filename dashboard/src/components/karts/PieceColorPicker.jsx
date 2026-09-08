import React from 'react';
import { Palette } from 'lucide-react';

export const SUGGESTED_COLORS = [
  { name: 'Rouge Racing', hex: '#E53935' },
  { name: 'Bleu Vitesse', hex: '#1E88E5' },
  { name: 'Vert Émeraude', hex: '#43A047' },
  { name: 'Jaune Sprint', hex: '#FDD835' },
  { name: 'Orange Fluo', hex: '#FB8C00' },
  { name: 'Violet Nuit', hex: '#8E24AA' },
  { name: 'Blanc Pur', hex: '#F8FAFC' },
  { name: 'Noir Carbone', hex: '#1E293B' },
];

function formatPieceLabel(pieceKey) {
  const clean = pieceKey.replace(/^piece_/, '').toLowerCase();
  const labels = {
    carrosserie: 'Carrosserie Principale',
    aileron: 'Arceaux & Aileron',
    capot: 'Nez / Capot Avant',
    pontons: 'Pontons & Moteur',
    chassis: 'Châssis & Tubes',
    sieges: 'Siège Baquet',
    siege: 'Siège Baquet',
    volant: 'Volant & Colonne',
    jantes: 'Éléments Mécaniques & Châssis',
    plaque: 'Plaque Numéro de Course',
  };
  if (labels[clean]) {
    return labels[clean];
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1).replace(/_/g, ' ');
}

export default function PieceColorPicker({ pieceName, color, onChange }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 transition-all hover:border-slate-300">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full border border-black/20 shadow-sm flex-shrink-0"
            style={{ backgroundColor: color || '#E53935' }}
          />
          <span className="text-xs font-bold text-slate-800 tracking-wide">
            {formatPieceLabel(pieceName)}
          </span>
        </div>

        {/* Free color picker */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
          <input
            type="color"
            value={color || '#E53935'}
            onChange={(e) => onChange(pieceName, e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
            title="Choisir une couleur libre"
          />
          <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
            {color || '#E53935'}
          </span>
        </div>
      </div>

      {/* Suggested Quick Swatches */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {SUGGESTED_COLORS.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            onClick={() => onChange(pieceName, swatch.hex)}
            title={swatch.name}
            style={{ backgroundColor: swatch.hex }}
            className={`w-5 h-5 rounded-lg border transition-transform ${
              (color || '').toUpperCase() === swatch.hex.toUpperCase()
                ? 'scale-115 ring-2 ring-navy ring-offset-1 border-white'
                : 'border-black/15 hover:scale-110 opacity-90 hover:opacity-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
