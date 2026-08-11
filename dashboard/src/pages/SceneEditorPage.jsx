import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEspaces } from '../api/espacesApi';
import { getObjects3D, getSpaceScene, updateSpaceScene, resetSpaceScene, setAsOriginalSpaceScene } from '../api/objects3dApi';
import SceneCanvas from '../components/scene-editor/SceneCanvas';
import ObjectCatalogPanel from '../components/scene-editor/ObjectCatalogPanel';
import ObjectUploadModal from '../components/scene-editor/ObjectUploadModal';
import PlacedObjectsList from '../components/scene-editor/PlacedObjectsList';
import SceneToolbar from '../components/scene-editor/SceneToolbar';
import { Loader2, ChevronDown, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import RootVerificationModal from '../components/RootVerificationModal';

/**
 * Main scene editor page.
 * - SUPERADMIN: can select which space to edit via a dropdown
 * - ADMIN/EMPLOYE: their assigned space is loaded automatically
 */
export default function SceneEditorPage() {
  const { espaceId: paramId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Space selection
  const [espaces, setEspaces] = useState([]);
  const [selectedEspaceId, setSelectedEspaceId] = useState(paramId || user?.assignedSpaceId || '');
  const [espaceName, setEspaceName] = useState('');

  // Catalog
  const [objects, setObjects] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Scene state
  const [placements, setPlacements] = useState([]);
  const [baseSceneUrl, setBaseSceneUrl] = useState(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingOriginal, setSettingOriginal] = useState(false);

  // History for undo
  const historyRef = useRef([]);

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);

  // ROOT verification modal
  const [rootSceneModalOpen, setRootSceneModalOpen] = useState(false);
  const [pendingSceneAction, setPendingSceneAction] = useState(null); // { type: 'reset'|'set-original' }

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Load catalog once
  useEffect(() => {
    setCatalogLoading(true);
    getObjects3D()
      .then((res) => setObjects(res.data.data || res.data || []))
      .catch(() => toast.error('Impossible de charger le catalogue'))
      .finally(() => setCatalogLoading(false));
  }, []);

  // Load espaces list for SUPERADMIN selector
  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      getEspaces()
        .then((res) => setEspaces(res.data.data || []))
        .catch(() => {});
    }
  }, [user]);

  // Load scene for selected space
  const loadScene = useCallback(async (id) => {
    if (!id) return;
    setSceneLoading(true);
    setIsDirty(false);
    historyRef.current = [];
    try {
      const res = await getSpaceScene(id);
      const data = res.data.data || res.data;
      setPlacements(
        (data.placements || []).map((p) => {
          const obj = objects.find((o) => o.id === p.object3DId || o.id === p.object3dId) || p.object3D;
          return {
            ...p,
            instanceId: p.instanceId || p.id || uuidv4(),
            object3dId: p.object3DId || p.object3dId,
            nom: obj?.nom || 'Objet',
            object3dUrl: obj?.modelUrl || obj?.url || p.object3dUrl,
            thumbnail: obj?.thumbnailUrl || obj?.thumbnail || null,
            position: p.position || [p.positionX ?? 0, p.positionY ?? 0, p.positionZ ?? 0],
            rotation: p.rotation || [p.rotationX ?? 0, p.rotationY ?? 0, p.rotationZ ?? 0],
            scale: p.scale || [p.scaleX ?? 1, p.scaleY ?? 1, p.scaleZ ?? 1],
          };
        })
      );
      setBaseSceneUrl(data.baseSceneUrl || null);
      const espace = espaces.find((e) => e.id === id);
      setEspaceName(espace?.nom || '');
    } catch {
      toast.error('Impossible de charger la scène');
    } finally {
      setSceneLoading(false);
    }
  }, [objects, espaces]);

  useEffect(() => {
    if (selectedEspaceId) loadScene(selectedEspaceId);
  }, [selectedEspaceId, loadScene]);

  // ── Drop: add object from catalog ─────────────────────────────────────────
  const handleDropPoint = useCallback((point) => {
    const dataStr = sessionStorage.getItem('draggingObject');
    if (!dataStr) return;
    const obj = JSON.parse(dataStr);
    sessionStorage.removeItem('draggingObject');

    historyRef.current.push([...placements]);
    const instance = {
      instanceId: uuidv4(),
      object3dId: obj.id,
      object3dUrl: obj.url,
      nom: obj.nom,
      thumbnail: obj.thumbnail || null,
      position: [point.x, point.y, point.z],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
    setPlacements((p) => [...p, instance]);
    setIsDirty(true);
  }, [placements]);

  // ── Transform: update position/rotation/scale ─────────────────────────────
  const handleTransform = useCallback((instanceId, transform) => {
    setPlacements((prev) =>
      prev.map((p) => (p.instanceId === instanceId ? { ...p, ...transform } : p))
    );
    setIsDirty(true);
  }, []);

  // ── Remove placement ──────────────────────────────────────────────────────
  const handleRemove = useCallback((instanceId) => {
    historyRef.current.push([...placements]);
    setPlacements((p) => p.filter((item) => item.instanceId !== instanceId));
    if (selectedId === instanceId) setSelectedId(null);
    setIsDirty(true);
  }, [placements, selectedId]);

  // ── Undo ──────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) { setPlacements(prev); setIsDirty(true); }
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selectedEspaceId) return;
    setSaving(true);
    try {
      const payload = placements.map(({ instanceId, object3dId, position, rotation, scale }) => ({
        instanceId, object3dId, position, rotation, scale,
      }));
      await updateSpaceScene(selectedEspaceId, payload);
      setIsDirty(false);
      historyRef.current = [];
      toast.success('Scène enregistrée avec succès');
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }, [selectedEspaceId, placements]);

  // ── Reset ────────────────────────────────────────────────────────────────────────────
  const performReset = useCallback(async (reason) => {
    if (!selectedEspaceId) return;
    try {
      const res = await resetSpaceScene(selectedEspaceId, reason);
      const data = res.data.data || res.data;
      setPlacements(
        (data.placements || []).map((p) => {
          const obj = objects.find((o) => o.id === p.object3DId || o.id === p.object3dId) || p.object3D;
          return {
            ...p,
            instanceId: p.instanceId || p.id || uuidv4(),
            object3dId: p.object3DId || p.object3dId,
            nom: obj?.nom || 'Objet',
            object3dUrl: obj?.modelUrl || obj?.url || p.object3dUrl,
            thumbnail: obj?.thumbnailUrl || obj?.thumbnail || null,
            position: p.position || [p.positionX ?? 0, p.positionY ?? 0, p.positionZ ?? 0],
            rotation: p.rotation || [p.rotationX ?? 0, p.rotationY ?? 0, p.rotationZ ?? 0],
            scale: p.scale || [p.scaleX ?? 1, p.scaleY ?? 1, p.scaleZ ?? 1],
          };
        })
      );
      setIsDirty(false);
      historyRef.current = [];
      toast.success('Scène réinitialisée');
    } catch {
      toast.error('Erreur lors de la réinitialisation');
    }
  }, [selectedEspaceId, objects]);

  const handleReset = useCallback(() => {
    if (user?.role === 'ROOT') {
      setPendingSceneAction({ type: 'reset' });
      setRootSceneModalOpen(true);
      return;
    }
    performReset();
  }, [user, performReset]);

  // ── Set as Original ────────────────────────────────────────────────────────────────────
  const performSetAsOriginal = useCallback(async (reason) => {
    if (!selectedEspaceId) return;
    setSettingOriginal(true);
    try {
      await setAsOriginalSpaceScene(selectedEspaceId, reason);
      toast.success('Disposition actuelle définie comme version officielle');
    } catch {
      toast.error('Erreur lors de la définition de la version originale');
    } finally {
      setSettingOriginal(false);
    }
  }, [selectedEspaceId]);

  const handleSetAsOriginal = useCallback(() => {
    if (user?.role === 'ROOT') {
      setPendingSceneAction({ type: 'set-original' });
      setRootSceneModalOpen(true);
      return;
    }
    performSetAsOriginal();
  }, [user, performSetAsOriginal]);

  // ROOT scene action confirmation
  const handleRootSceneConfirm = ({ passcode, reason }) => {
    const auditReason = `${reason} [Validé avec code ${passcode}]`;
    if (pendingSceneAction?.type === 'reset') {
      performReset(auditReason);
    } else if (pendingSceneAction?.type === 'set-original') {
      performSetAsOriginal(auditReason);
    }
    setPendingSceneAction(null);
  };

  // ── Catalog drag start (store in sessionStorage to bridge HTML5 drag ↔ R3F)
  const handleCatalogDragStart = useCallback((obj) => {
    sessionStorage.setItem('draggingObject', JSON.stringify(obj));
  }, []);

  // ── Upload callback ───────────────────────────────────────────────────────
  const handleUploaded = useCallback((newObj) => {
    setObjects((p) => [...p, newObj]);
    setUploadOpen(false);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" id="scene-editor-page">
      {/* Toolbar */}
      <SceneToolbar
        isDirty={isDirty}
        saving={saving}
        onSave={handleSave}
        onReset={handleReset}
        onUndo={handleUndo}
        canUndo={historyRef.current.length > 0}
        espaceName={espaceName}
        onSetAsOriginal={user?.role === 'SUPERADMIN' ? handleSetAsOriginal : undefined}
        settingOriginal={settingOriginal}
      />

      {/* SUPERADMIN space selector */}
      {user?.role === 'SUPERADMIN' && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Espace :</label>
          <div className="relative">
            <select
              id="space-selector"
              value={selectedEspaceId}
              onChange={(e) => {
                if (isDirty && !window.confirm('Quitter la scène actuelle sans enregistrer ?')) return;
                setSelectedEspaceId(e.target.value);
              }}
              className="appearance-none pe-8 ps-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              <option value="">— Sélectionner un espace —</option>
              {espaces.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
            <ChevronDown size={14} className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Editor layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: catalog panel */}
        <div className="w-56 flex-shrink-0 overflow-hidden border-e border-slate-200">
          <ObjectCatalogPanel
            objects={objects}
            loading={catalogLoading}
            onUploadClick={() => setUploadOpen(true)}
            onDragStart={handleCatalogDragStart}
          />
        </div>

        {/* Center: 3D Canvas */}
        <div className="flex-1 relative bg-slate-900 overflow-hidden">
          {!selectedEspaceId ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
              Sélectionnez un espace pour commencer l'édition
            </div>
          ) : sceneLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <SceneCanvas
              placements={placements}
              selectedId={selectedId}
              baseSceneUrl={baseSceneUrl}
              onSelect={setSelectedId}
              onTransform={handleTransform}
              onDropPoint={handleDropPoint}
            />
          )}
        </div>

        {/* Right: placed objects list */}
        <div className="w-52 flex-shrink-0 overflow-hidden border-s border-slate-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Layers size={14} className="text-indigo-500" />
            <h3 className="text-xs font-semibold text-slate-700">Objets placés</h3>
            <span className="ms-auto text-xs text-slate-400">{placements.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PlacedObjectsList
              placements={placements}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={handleRemove}
            />
          </div>
        </div>
      </div>

      {/* Upload modal */}
      <ObjectUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />

      {/* ROOT Security Verification Modal */}
      <RootVerificationModal
        isOpen={rootSceneModalOpen}
        onClose={() => { setRootSceneModalOpen(false); setPendingSceneAction(null); }}
        onConfirm={handleRootSceneConfirm}
        title="Validation Sécurité ROOT — Scène 3D"
        actionName={
          pendingSceneAction?.type === 'reset'
            ? "Réinitialisation irréversible de la scène (retour état initial)"
            : "Définition de la disposition actuelle comme version originale officielle"
        }
      />
    </div>
  );
}
