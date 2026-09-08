import React, { useState, useCallback } from 'react';
import KartPreviewCanvas from './KartPreviewCanvas';
import PieceColorPicker from './PieceColorPicker';
import PlateNumberInput from './PlateNumberInput';
import { Save, ArrowLeft, Loader2, Sparkles, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

export default function KartCustomizer({
  kart,
  onSave,
  onCancel,
  saving,
  existingPlates = [],
}) {
  const [numeroPlaque, setNumeroPlaque] = useState(kart.numeroPlaque || '07');
  const [couleurs, setCouleurs] = useState(
    kart.couleurs && typeof kart.couleurs === 'object'
      ? { ...kart.couleurs }
      : {}
  );
  const [actif, setActif] = useState(kart.actif !== false);
  const [piecesList, setPiecesList] = useState([
    'piece_carrosserie',
    'piece_aileron',
    'piece_capot',
    'piece_pontons',
  ]);

  const handlePiecesDiscovered = useCallback((pieces) => {
    if (pieces && pieces.length > 0) {
      setPiecesList(pieces);
    }
  }, []);

  const handleColorChange = (pieceName, colorHex) => {
    setCouleurs((prev) => ({
      ...prev,
      [pieceName]: colorHex,
    }));
  };

  // Validation
  const trimmedPlate = (numeroPlaque || '').trim().toUpperCase();
  let error = null;
  if (!trimmedPlate) {
    error = 'Le numéro de plaque ne peut pas être vide';
  } else if (trimmedPlate.length > 3) {
    error = 'Maximum 3 caractères';
  } else if (
    existingPlates.some(
      (p) => p.toUpperCase() === trimmedPlate && p.toUpperCase() !== (kart.numeroPlaque || '').toUpperCase()
    )
  ) {
    error = `Le numéro de plaque "${trimmedPlate}" est déjà utilisé dans cet espace`;
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (error) return;
    onSave({
      ...kart,
      numeroPlaque: trimmedPlate,
      couleurs,
      actif,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Retour à la liste"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>Personnaliser Kart N° {trimmedPlate || '??'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-navy/10 text-navy font-mono">
                {kart.isNew ? 'Nouveau' : 'Édition'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Modifiez la couleur de chaque élément de carrosserie et le numéro de course
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {/* Active status switch */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <input
              type="checkbox"
              checked={actif}
              onChange={(e) => setActif(e.target.checked)}
              className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700">
              {actif ? 'Actif en piste' : 'En maintenance'}
            </span>
          </label>

          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={saving || !!error}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all ${
              error
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-navy hover:bg-navy/90 text-white cursor-pointer shadow-navy/20'
            }`}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Enregistrement...' : 'Valider ce kart'}</span>
          </button>
        </div>
      </div>

      {/* Grid: 3D Preview (Left) & Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Canvas */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <KartPreviewCanvas
            couleurs={couleurs}
            numeroPlaque={trimmedPlate}
            onPiecesDiscovered={handlePiecesDiscovered}
            isEditing={true}
          />
        </div>

        {/* Controls sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <PlateNumberInput
              value={numeroPlaque}
              onChange={setNumeroPlaque}
              error={error}
            />

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-navy" />
                  <span>Couleurs par pièce</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCouleurs({})}
                    className="text-[11px] font-bold text-navy hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
                    title="Restaurer le modèle original avec textures d'usine"
                  >
                    <RotateCcw size={11} />
                    <span>Format d'origine</span>
                  </button>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {piecesList.length} pièces
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pe-1">
                {piecesList.map((piece) => (
                  <PieceColorPicker
                    key={piece}
                    pieceName={piece}
                    color={couleurs[piece] || '#E53935'}
                    onChange={handleColorChange}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
