import { Package, Trash2, MousePointerClick } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Text-based list of all placed objects for easy selection and deletion.
 *
 * @param {object[]} placements  - array of placed objects with metadata
 * @param {string}   selectedId  - instanceId of currently selected object
 * @param {function} onSelect    - called with instanceId when row is clicked
 * @param {function} onRemove    - called with instanceId to remove object
 */
export default function PlacedObjectsList({ placements, selectedId, onSelect, onRemove }) {
  const getThumbnail = (p) => {
    if (!p.thumbnail) return null;
    return p.thumbnail.startsWith('http') ? p.thumbnail : `${BACKEND_URL}/${p.thumbnail}`;
  };

  if (placements.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400" id="placed-objects-list-empty">
        <Package size={28} className="mx-auto mb-2 opacity-40" />
        <p className="text-xs">Glissez des objets depuis le catalogue dans la scène</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100" id="placed-objects-list">
      {placements.map((p, idx) => {
        const thumb = getThumbnail(p);
        const isSelected = p.instanceId === selectedId;
        return (
          <div
            key={p.instanceId}
            id={`placed-obj-${p.instanceId}`}
            onClick={() => onSelect(p.instanceId)}
            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
              ${isSelected ? 'bg-indigo-50 border-s-2 border-indigo-500' : 'hover:bg-slate-50'}`}
          >
            {/* Thumbnail */}
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
              {thumb ? (
                <img src={thumb} alt={p.nom} className="w-full h-full object-cover" />
              ) : (
                <Package size={14} className="text-slate-400 m-auto mt-1.5" />
              )}
            </div>

            {/* Name + index */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{p.nom}</p>
              <p className="text-xs text-slate-400">#{idx + 1}</p>
            </div>

            {/* Select indicator */}
            {isSelected && (
              <MousePointerClick size={13} className="text-indigo-500 flex-shrink-0" />
            )}

            {/* Remove */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(p.instanceId); }}
              id={`remove-placed-${p.instanceId}`}
              title="Retirer de la scène"
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
