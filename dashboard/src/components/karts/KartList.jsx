import React from 'react';
import { Flag, Trash2, ArrowUp, ArrowDown, Edit3, Plus, CheckCircle, AlertTriangle } from 'lucide-react';

export default function KartList({
  karts,
  onSelectEdit,
  onDeleteKart,
  onMoveUp,
  onMoveDown,
  onAddKart,
}) {
  if (karts.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-navy/10 text-navy mx-auto flex items-center justify-center">
          <Flag size={28} />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-800">Aucun kart configuré sur cette piste</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Ajoutez votre premier kart pour personnaliser les couleurs de carrosserie et le numéro de plaque d’immatriculation.
          </p>
        </div>
        <div className="pt-2 max-w-xs mx-auto">
          <button
            type="button"
            onClick={onAddKart}
            className="w-full py-3 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-md shadow-navy/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Ajouter un premier kart</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Karts Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {karts.map((kart, index) => {
          const mainColor = kart.couleurs?.piece_carrosserie || kart.couleur || '#E53935';
          const aileronColor = kart.couleurs?.piece_aileron || '#1A1A1A';
          const isActif = kart.actif !== false;
          const plate = kart.numeroPlaque || kart.numero || '??';

          return (
            <div
              key={kart.id || kart.tempId || index}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm p-4 flex flex-col justify-between gap-3 transition-all group"
            >
              {/* Header: Plate & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Plate Badge */}
                  <div
                    className="w-12 h-8 rounded-lg border-2 border-slate-800 bg-white flex items-center justify-center shadow-inner"
                    style={{ borderLeftColor: mainColor, borderLeftWidth: '5px' }}
                  >
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {plate}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-black text-slate-800 block">
                      Kart #{plate}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Position {index + 1}
                    </span>
                  </div>
                </div>

                {/* Status indicator */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isActif
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActif ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isActif ? 'Actif' : 'Maint.'}</span>
                </span>
              </div>

              {/* Color swatches preview */}
              <div className="bg-slate-50 rounded-xl p-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-md border border-black/20 shadow-sm"
                    style={{ backgroundColor: mainColor }}
                    title="Carrosserie"
                  />
                  <span className="text-[11px] font-semibold text-slate-600">Carrosserie</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-md border border-black/20 shadow-sm"
                    style={{ backgroundColor: aileronColor }}
                    title="Aileron"
                  />
                  <span className="text-[11px] font-semibold text-slate-600">Aileron</span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                {/* Reorder buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMoveUp(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Monter"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={index === karts.length - 1}
                    onClick={() => onMoveDown(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Descendre"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                {/* Edit & Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectEdit(index)}
                    className="px-3 py-1.5 bg-navy/10 hover:bg-navy text-navy hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Personnaliser</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteKart(index)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Supprimer ce kart"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Kart Button */}
      <button
        type="button"
        onClick={onAddKart}
        className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Plus size={16} />
        <span>Ajouter un nouveau kart à la flotte</span>
      </button>
    </div>
  );
}
