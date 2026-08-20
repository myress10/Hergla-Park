import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Upload, Package, ChevronDown, ChevronRight } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Sidebar panel showing the catalog of available 3D objects.
 */
export default function ObjectCatalogPanel({ objects, loading, onUploadClick, onDragStart }) {
  const { t } = useTranslation();
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
            {t('sceneEditor.catalogTitle')}
          </h2>
          <button
            onClick={onUploadClick}
            id="upload-object-btn"
            title={t('sceneEditor.importGlb')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
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
            placeholder={t('sceneEditor.searchPlaceholder')}
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
            {search ? t('sceneEditor.noObjectsFound') : t('sceneEditor.emptyCatalog')}
          </div>
        ) : (
          Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                <span>{cat}</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="text-[10px] font-normal">{items.length}</span>
                  {collapsed[cat] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </span>
              </button>

              {/* Category items */}
              {!collapsed[cat] && (
                <div className="grid grid-cols-2 gap-2 p-2">
                  {items.map((obj) => {
                    const thumb = getThumbnail(obj);
                    return (
                      <div
                        key={obj.id}
                        id={`catalog-obj-${obj.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, obj)}
                        className="group flex flex-col items-center p-2 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-grab active:cursor-grabbing transition-all select-none"
                      >
                        <div className="w-full aspect-square rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden mb-1.5 border border-slate-100">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={obj.nom}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <Package size={20} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 truncate w-full text-center">
                          {obj.nom}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
