import { useTranslation } from 'react-i18next';
import StatusBadge from './StatusBadge';
import StatusToggle from './StatusToggle';
import { getEspaceImage, handleImageError } from '../utils/imageUtils';
import { Car, Utensils, Target, Smile, Coffee, Waves, Trees, Dices, Edit2, Trash2 } from 'lucide-react';

const CATEGORY_ICONS = {
  karting: Car,
  restaurant: Utensils,
  paintball: Target,
  'zone enfants': Smile,
  café: Coffee,
  cafe: Coffee,
  aquatique: Waves,
  jardin: Trees,
  default: Dices,
};

function getIcon(categorie) {
  const key = (categorie || '').toLowerCase();
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
}

function StaffAvatars({ employes }) {
  if (!employes || employes.length === 0) return null;
  const visible = employes.slice(0, 3);
  const extra = employes.length - 3;
  return (
    <div className="flex items-center">
      {visible.map((emp, i) => (
        <div
          key={emp.id || i}
          className="w-7 h-7 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-600 -ms-1 first:ms-0"
          title={emp.nom}
        >
          {(emp.nom || 'U').charAt(0).toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-500 -ms-1">
          +{extra}
        </div>
      )}
    </div>
  );
}

/**
 * Generic espace card used in the grid view.
 *
 * @param {object}   espace     - space data from API
 * @param {function} onUpdate   - callback when status is toggled
 * @param {function} onClick    - callback when card body is clicked
 * @param {function} onEdit     - callback for edit button
 * @param {function} onDelete   - callback for delete button
 * @param {boolean}  showToggle - whether to show the status toggle (default true)
 */
export default function EspaceCard({ espace, onUpdate, onClick, onEdit, onDelete, showToggle = true }) {
  const { t } = useTranslation();
  const Icon = getIcon(espace.categorie);
  const imageUrl = getEspaceImage(espace);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group relative"
      onClick={onClick}
      id={`espace-card-${espace.id}`}
    >
      {/* Image with status overlay + action buttons */}
      <div className="relative h-48 overflow-hidden rounded-t-2xl">
        <img
          src={imageUrl}
          alt={espace.nom}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => handleImageError(e)}
        />
        {/* Status badge top-right */}
        <div className="absolute top-3 end-3">
          <StatusBadge status={espace.statut} size="sm" />
        </div>

        {/* Action buttons top-left — visible on hover */}
        {(onEdit || onDelete) && (
          <div
            className="absolute top-3 start-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                onClick={onEdit}
                id={`edit-espace-${espace.id}`}
                title={t('spaces.card.edit')}
                className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-slate-600 hover:text-navy hover:bg-white transition-colors"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                id={`delete-espace-${espace.id}`}
                title={t('spaces.card.delete')}
                className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-slate-600 hover:text-red-500 hover:bg-white transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate text-base">{espace.nom}</h3>
            <p className="text-slate-500 text-sm truncate">{espace.categorie}</p>
          </div>
          <div className="ms-2 flex-shrink-0 text-slate-400">
            <Icon size={20} />
          </div>
        </div>

        {/* Footer: staff avatars + toggle */}
        <div
          className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50"
          onClick={(e) => e.stopPropagation()}
        >
          {espace.employes && espace.employes.length > 0 ? (
            <StaffAvatars employes={espace.employes} />
          ) : (
            <span className="text-xs text-slate-400">{t('spaces.card.noStaff')}</span>
          )}

          {showToggle && (
            <StatusToggle
              espaceId={espace.id}
              currentStatus={espace.statut}
              onUpdate={onUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
