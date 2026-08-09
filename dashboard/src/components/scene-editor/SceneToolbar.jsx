import { useState } from 'react';
import { Save, RotateCcw, Undo2, Loader2, AlertTriangle, BookmarkCheck } from 'lucide-react';
import Modal from '../Modal';

/**
 * Top toolbar for the 3D scene editor.
 *
 * @param {boolean}  isDirty       - whether there are unsaved changes
 * @param {boolean}  saving        - whether save is in progress
 * @param {function} onSave        - callback to save current placements
 * @param {function} onReset       - callback to reset to originalPlacements
 * @param {function} onUndo        - callback to undo last placement
 * @param {boolean}  canUndo       - whether undo is available
 * @param {string}   espaceName    - name of the current space
 */
export default function SceneToolbar({
  isDirty,
  saving,
  onSave,
  onReset,
  onUndo,
  canUndo,
  espaceName,
  onSetAsOriginal,
  settingOriginal,
}) {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [setOriginalConfirmOpen, setSetOriginalConfirmOpen] = useState(false);

  const handleReset = () => {
    setResetConfirmOpen(false);
    onReset();
  };

  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200 shadow-sm"
        id="scene-editor-toolbar"
      >
        {/* Space name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {espaceName || 'Éditeur de scène 3D'}
          </p>
          {isDirty && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Modifications non enregistrées
            </p>
          )}
        </div>

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo || saving}
          id="scene-undo-btn"
          title="Annuler le dernier ajout"
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 size={15} />
          <span className="hidden sm:inline">Annuler</span>
        </button>

        {/* Reset to original */}
        <button
          onClick={() => setResetConfirmOpen(true)}
          disabled={saving}
          id="scene-reset-btn"
          title="Réinitialiser à la disposition originale"
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 disabled:opacity-40 transition-colors"
        >
          <RotateCcw size={15} />
          <span className="hidden sm:inline">Réinitialiser</span>
        </button>

        {/* Set as Original – SUPERADMIN only */}
        {onSetAsOriginal && (
          <button
            onClick={() => setSetOriginalConfirmOpen(true)}
            disabled={saving || settingOriginal || isDirty}
            id="scene-set-original-btn"
            title={isDirty ? 'Enregistrez d\'abord avant de définir comme original' : 'Définir disposition actuelle comme version originale'}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 disabled:opacity-40 transition-colors"
          >
            {settingOriginal ? <Loader2 size={15} className="animate-spin" /> : <BookmarkCheck size={15} />}
            <span className="hidden sm:inline">Définir original</span>
          </button>
        )}

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving || !isDirty}
          id="scene-save-btn"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      {/* Reset confirmation modal */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Réinitialiser la scène"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">
              Toutes les modifications non enregistrées seront perdues et la scène sera restaurée
              à sa <strong>disposition originale</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              id="confirm-reset-btn"
              className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setResetConfirmOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>
      {/* Set as Original confirmation modal */}
      {onSetAsOriginal && (
        <Modal
          isOpen={setOriginalConfirmOpen}
          onClose={() => setSetOriginalConfirmOpen(false)}
          title="Définir comme version originale"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <BookmarkCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-800 text-sm">
                La disposition actuelle des objets deviendra la nouvelle{' '}
                <strong>version originale de référence</strong> pour les réinitialisations futures.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSetOriginalConfirmOpen(false); onSetAsOriginal(); }}
                id="confirm-set-original-btn"
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Confirmer
              </button>
              <button
                onClick={() => setSetOriginalConfirmOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
