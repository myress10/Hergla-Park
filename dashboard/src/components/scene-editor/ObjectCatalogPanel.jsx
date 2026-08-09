import { useState, useMemo } from 'react';
import { Search, Upload, Package, ChevronDown, ChevronRight } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Sidebar panel showing the catalog of available 3D objects.
 * Objects can be dragged onto the SceneCanvas.
 *
 * @param {object[]} objects       - list of Object3D from API
 * @param {boolean}  loading       - whether catalog is loading
 * @param {function} onUploadClick - callback to open the upload modal
 */
export default function ObjectCatalogPanel({ objects, loading, onUploadClick, onDragStart }) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const filtered = useMemo(
    () =>
      objects.filter(
        (o) =>
          !search ||
          o.nom.toLowerCase().includes(search.toLowerCase()) ||
          o.categorie.toLowerCase().includes(search.toLowerCase())
      ),
    [objects, search]
  );

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach((o) => {
      if (!map[o.categorie]) map[o.categorie] = [];
      map[o.categorie].push(o);
    });
    return map;
  }, [filtered]);

  const toggleCategory = (cat) =>
    setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  const handleDragStart = (e, object) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(object));
    if (onDragStart) onDragStart(object);
  };

  const getThumbnail = (obj) => {
    if (!obj.thumbnail) return null;
    return obj.thumbnail.startsWith('http') ? obj.thumbnail : `${BACKEND_URL}/${obj.thumbnail}`;
  };

  return (
    <div className="flex flex-col h-full bg-white border-e border-slate-200" id="object-catalog-panel">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Package size={15} className="text-indigo-500" />
            Catalogue d'objets
          </h2>
          <button
            onClick={onUploadClick}
            id="upload-object-btn"
            title="Importer un objet 3D"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Upload size={15} />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="catalog-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full ps-8 pe-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Catalog list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="space-y-2 px-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : Object.keys(byCategory).length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs px-4">
            {search ? 'Aucun objet trouvé' : 'Aucun objet dans le catalogue. Importez un fichier .glb.'}
          </div>
        ) : (
          Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                {collapsed[cat] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                {cat}
                <span className="ms-auto font-normal text-slate-400">{items.length}</span>
              </button>

              {/* Category items */}
              {!collapsed[cat] && (
                <div className="grid grid-cols-2 gap-2 px-3 pb-2">
                  {items.map((obj) => {
                    const thumb = getThumbnail(obj);
                    return (
                      <div
                        key={obj.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, obj)}
                        id={`catalog-item-${obj.id}`}
                        className="relative group border border-slate-200 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all duration-150"
                        title={`Glisser "${obj.nom}" dans la scène`}
                      >
                        {/* Thumbnail */}
                        <div className="h-16 bg-slate-100 flex items-center justify-center overflow-hidden">
                          {thumb ? (
                            <img src={thumb} alt={obj.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                          ) : (
                            <Package size={24} className="text-slate-300" />
                          )}
                        </div>
                        {/* Label */}
                        <p className="text-xs font-medium text-slate-700 px-2 py-1.5 truncate">{obj.nom}</p>

                        {/* Drag indicator */}
                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
        {objects.length} objet{objects.length !== 1 ? 's' : ''} disponible{objects.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
