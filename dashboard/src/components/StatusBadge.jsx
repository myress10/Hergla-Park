import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
  OUVERT: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
    labelKey: 'spaces.statuses.OUVERT',
  },
  FERME: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
    border: 'border-red-200',
    labelKey: 'spaces.statuses.FERME',
  },
  MAINTENANCE: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
    labelKey: 'spaces.statuses.MAINTENANCE',
  },
};

/**
 * Generic colored badge for espace status.
 * @param {string} status - 'OUVERT' | 'FERME' | 'MAINTENANCE'
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export default function StatusBadge({ status, size = 'md' }) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FERME;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border
        ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {t(config.labelKey)}
    </span>
  );
}
