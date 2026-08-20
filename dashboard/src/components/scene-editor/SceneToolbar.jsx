import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, RotateCcw, Undo2, Loader2, AlertTriangle, BookmarkCheck } from 'lucide-react';
import Modal from '../Modal';

/**
 * Top toolbar for the 3D scene editor.
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
  const { t } = useTranslation();
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
            {espaceName || t('sceneEditor.title')}
          </p>
          {isDirty && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {t('sceneEditor.unsavedChanges')}
            </p>
          )}
        </div>

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo || saving}
          id="scene-undo-btn"
          title={t('sceneEditor.undoTooltip')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 size={15} />
          <span className="hidden sm:inline">{t('sceneEditor.undo')}</span>
        </button>

        {/* Reset to original */}
        <button
          onClick={() => setResetConfirmOpen(true)}
          disabled={saving}
          id="scene-reset-btn"
          title={t('sceneEditor.resetTooltip')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 disabled:opacity-40 transition-colors"
        >
          <RotateCcw size={15} />
          <span className="hidden sm:inline">{t('sceneEditor.reset')}</span>
        </button>

        {/* Set as Original – SUPERADMIN only */}
        {onSetAsOriginal && (
          <button
            onClick={() => setSetOriginalConfirmOpen(true)}
            disabled={saving || settingOriginal || isDirty}
            id="scene-set-original-btn"
            title={isDirty ? t('sceneEditor.setOriginalDirtyTooltip') : t('sceneEditor.setOriginalTooltip')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 disabled:opacity-40 transition-colors"
          >
            {settingOriginal ? <Loader2 size={15} className="animate-spin" /> : <BookmarkCheck size={15} />}
            <span className="hidden sm:inline">{t('sceneEditor.setOriginal')}</span>
          </button>
        )}

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving || !isDirty}
          id="scene-save-btn"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? t('sceneEditor.saving') : t('sceneEditor.save')}
        </button>
      </div>

      {/* Reset confirmation modal */}
      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title={t('sceneEditor.resetModal.title')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">
              {t('sceneEditor.resetModal.desc')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              id="confirm-reset-btn"
              className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
            >
              {t('sceneEditor.resetModal.confirm')}
            </button>
            <button
              onClick={() => setResetConfirmOpen(false)}
              className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 cursor-pointer"
            >
              {t('sceneEditor.resetModal.cancel')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Set as Original confirmation modal */}
      {onSetAsOriginal && (
        <Modal
          isOpen={setOriginalConfirmOpen}
          onClose={() => setSetOriginalConfirmOpen(false)}
          title={t('sceneEditor.setOriginalModal.title')}
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <BookmarkCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-800 text-sm">
                {t('sceneEditor.setOriginalModal.desc')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSetOriginalConfirmOpen(false); onSetAsOriginal(); }}
                id="confirm-set-original-btn"
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                {t('sceneEditor.setOriginalModal.confirm')}
              </button>
              <button
                onClick={() => setSetOriginalConfirmOpen(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 cursor-pointer"
              >
                {t('sceneEditor.setOriginalModal.cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
