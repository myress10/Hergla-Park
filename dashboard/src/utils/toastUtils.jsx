import React from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Copy,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

/**
 * Get current user role from localStorage safely
 */
export function getCurrentUserRole() {
  try {
    const userStr = localStorage.getItem('hergla_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.role || 'EMPLOYE';
    }
  } catch (_) {}
  return 'EMPLOYE';
}

/**
 * Clean & friendly non-technical error extractor for standard users
 */
export function getFriendlyErrorMessage(err) {
  if (!err) return 'Une erreur inattendue est survenue. Veuillez réessayer ultérieurement.';
  if (typeof err === 'string') return err;

  const status = err.response?.status;
  const data = err.response?.data;
  const backendMsg = data?.message;

  // If specific business message from backend, check if it's clean and safe
  if (backendMsg && typeof backendMsg === 'string') {
    // Hide raw database errors / stack traces / prisma errors from non-root users
    const isTechnical =
      backendMsg.includes('Prisma') ||
      backendMsg.includes('foreign key') ||
      backendMsg.includes('unique constraint') ||
      backendMsg.includes('syntax error') ||
      backendMsg.includes('Cannot POST') ||
      backendMsg.includes('Cannot GET') ||
      backendMsg.includes('stack trace');

    if (!isTechnical) {
      return backendMsg;
    }
  }

  switch (status) {
    case 400:
      return 'Données non valides. Veuillez vérifier les informations saisies.';
    case 401:
      return 'Session expirée ou non autorisée. Veuillez vous reconnecter.';
    case 403:
      return 'Accès restreint. Vous ne disposez pas des autorisations nécessaires pour effectuer cette action.';
    case 404:
      return 'L\'élément demandé est introuvable ou n\'existe plus.';
    case 409:
      return 'Conflit détecté. Un élément avec les mêmes caractéristiques existe déjà.';
    case 429:
      return 'Trop de requêtes effectuées. Veuillez patienter un instant.';
    case 500:
    case 502:
    case 503:
      return 'Le service est temporairement indisponible. Nos équipes ont été notifiées.';
    default:
      return 'L\'action n\'a pas pu être finalisée. Veuillez réessayer plus tard.';
  }
}

/**
 * Role-Based Error Toast
 */
export function notifyError(err, customTitle) {
  const role = getCurrentUserRole();
  const isRoot = role === 'ROOT';

  const friendlyMsg = getFriendlyErrorMessage(err);
  const rawStatus = err?.response?.status;
  const rawData = err?.response?.data;
  const rawCode = rawData?.code || rawData?.error || `HTTP ${rawStatus || 500}`;
  const rawDetails = typeof rawData?.message === 'string' ? rawData.message : JSON.stringify(rawData || {});

  if (isRoot) {
    // ROOT gets rich debugging telemetry + copy button
    toast.custom(
      (t) => (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl bg-slate-900 border border-red-500/40 text-white shadow-2xl max-w-md w-full transition-all ${
            t.visible ? 'animate-in zoom-in-95' : 'animate-out zoom-out-95'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldAlert size={18} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal size={12} />
                ROOT DEBUG · {rawCode}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {err?.config?.method?.toUpperCase() || 'REQ'} {err?.config?.url?.split('?')[0] || ''}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-200 leading-snug">
              {customTitle || friendlyMsg}
            </p>
            {rawDetails && (
              <p className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg break-all border border-slate-800">
                {rawDetails.slice(0, 160)}{rawDetails.length > 160 ? '...' : ''}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Error: ${rawCode}\nRoute: ${err?.config?.url}\nMessage: ${rawDetails}`
                  );
                  toast.success('Trace d\'erreur copiée !', { duration: 2000 });
                }}
                className="text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded flex items-center gap-1 transition-colors"
              >
                <Copy size={11} />
                Copier Trace
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  } else {
    // Non-ROOT: clean, sanitized friendly message
    toast.error(customTitle || friendlyMsg, {
      duration: 4000,
      style: {
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
      },
    });
  }
}

/**
 * Role-Based Success Toast
 */
export function notifySuccess(message) {
  toast.success(message, {
    duration: 4000,
    style: {
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: '600',
    },
  });
}

/**
 * Role-Based Warning Toast
 */
export function notifyWarning(message) {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: '600',
    },
  });
}

/**
 * Translate entity name based on active i18n
 */
export function getLocalizedEntityName(entityType, t) {
  if (!entityType) return t ? t('audit.entities.System', 'Système') : 'Système';
  if (t) {
    const key = `audit.entities.${entityType}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
  }
  switch (entityType) {
    case 'UpgradeRequest':
      return t ? t('audit.entities.UpgradeRequest', 'Demande d\'Upgrade') : 'Demande d\'Upgrade';
    case 'Company':
      return t ? t('audit.entities.Company', 'Entreprise') : 'Entreprise';
    case 'Espace':
      return t ? t('audit.entities.Espace', 'Espace 3D') : 'Espace 3D';
    case 'Kart':
      return t ? t('audit.entities.Kart', 'Flotte Karting') : 'Flotte Karting';
    case 'User':
      return t ? t('audit.entities.User', 'Utilisateur') : 'Utilisateur';
    case 'Role':
      return t ? t('audit.entities.Role', 'Droits & Rôles') : 'Droits & Rôles';
    case 'Object3D':
    case 'SceneObject':
      return t ? t('audit.entities.Object3D', 'Objet 3D') : 'Objet 3D';
    default:
      return entityType;
  }
}

/**
 * Generate fully localized human-readable summary
 */
export function getLocalizedLogSummary(log, t) {
  if (!log) return '';
  const action = (log.action || '').toLowerCase();
  const entityType = log.entityType || '';
  const meta = log.metadata || {};
  const actor = log.actor?.nom || (t ? t('common.user', 'Utilisateur') : 'Utilisateur');

  if (!t) return log.summary || `${actor} a effectué une opération.`;

  const localizedEntity = getLocalizedEntityName(entityType, t);

  // Upgrade requests
  if (action.includes('upgrade_request.create') || (entityType === 'UpgradeRequest' && action.includes('create'))) {
    return t('audit.summaries.upgradeRequestCreated', { actor, pack: meta.targetPack || 'Avancé' });
  }
  if (action.includes('upgrade_approved') || (entityType === 'UpgradeRequest' && action.includes('approve'))) {
    return t('audit.summaries.upgradeRequestApproved', { pack: meta.newPack || meta.targetPack || 'Avancé' });
  }
  if (action.includes('upgrade_rejected') || (entityType === 'UpgradeRequest' && action.includes('reject'))) {
    return t('audit.summaries.upgradeRequestRejected');
  }
  if (
    entityType === 'UpgradeRequest' ||
    action.includes('upgrade_request') ||
    action.includes('pack_override') ||
    action.includes('pack_upgraded')
  ) {
    if (meta.targetPack || meta.newPack) {
      return t('audit.summaries.companyPackUpdated', { pack: meta.newPack || meta.targetPack });
    }
    return t('audit.summaries.upgradeRequestUpdated', { actor });
  }

  // Espaces
  if (action.includes('espace.create') || (entityType === 'Espace' && action.includes('create'))) {
    return t('audit.summaries.espaceCreated', { actor, name: meta.nom || 'Espace' });
  }
  if (action.includes('espace.update') || (entityType === 'Espace' && action.includes('update'))) {
    return t('audit.summaries.espaceUpdated', { actor, name: meta.nom || 'Espace' });
  }
  if (action.includes('espace.delete') || (entityType === 'Espace' && action.includes('delete'))) {
    return t('audit.summaries.espaceDeleted', { actor });
  }

  // Karts
  if (action.includes('kart.create') || (entityType === 'Kart' && action.includes('create'))) {
    return t('audit.summaries.kartCreated', { actor, number: meta.numero || '01' });
  }
  if (action.includes('kart.update') || (entityType === 'Kart' && action.includes('update'))) {
    return t('audit.summaries.kartUpdated', { actor, number: meta.numero || '01' });
  }
  if (action.includes('kart.delete') || (entityType === 'Kart' && action.includes('delete'))) {
    return t('audit.summaries.kartDeleted', { actor, number: meta.numero || '01' });
  }
  if (action.includes('reorder') || action.includes('karts.reorder')) {
    return t('audit.summaries.kartsReordered', { actor });
  }

  // Users
  if (action.includes('user.create') || (entityType === 'User' && action.includes('create'))) {
    return t('audit.summaries.userCreated', { actor, name: meta.nom || meta.email || 'Utilisateur' });
  }
  if (action.includes('user.update') || (entityType === 'User' && action.includes('update'))) {
    return t('audit.summaries.userUpdated', { actor, name: meta.nom || meta.email || 'Utilisateur' });
  }
  if (action.includes('user.delete') || (entityType === 'User' && action.includes('delete'))) {
    return t('audit.summaries.userDeleted', { actor });
  }

  // Roles
  if (action.includes('role') || entityType === 'Role') {
    return t('audit.summaries.roleUpdated', { actor });
  }

  // 3D Scene
  if (action.includes('scene') || action.includes('placement') || entityType === 'SceneObject' || entityType === 'Object3D') {
    return t('audit.summaries.sceneSaved', { actor });
  }

  // Fallback localized summary
  return t('audit.summaries.generic', { actor, entity: localizedEntity });
}

/**
 * Helper to convert live activity bus events into clean, role-sanitized notification objects
 */
export function formatRoleNotification(log, isRoot = false, t = null) {
  const action = (log.action || '').toLowerCase();
  const meta = log.metadata || {};
  const actorNom = log.actor?.nom || 'Admin';

  let title = t ? t('audit.entities.System', 'Action Système') : 'Action Système';
  let message = getLocalizedLogSummary(log, t) || log.summary || `${actorNom} a effectué une modification.`;
  let type = 'info';
  let targetRoute = '/audit-logs';
  let isPriority = false;

  if (action.includes('delete') || action.includes('reject') || action.includes('locked')) {
    type = 'warning';
  } else if (action.includes('create') || action.includes('approved') || action.includes('pack_upgraded')) {
    type = 'success';
  }

  if (action.includes('kart')) {
    title = t ? t('audit.entities.Kart', 'Flotte de Karts') : 'Flotte de Karts';
    targetRoute = '/configuration-karts';
  } else if (action.includes('espace')) {
    title = t ? t('audit.entities.Espace', 'Espaces 3D') : 'Espaces & Visites 3D';
    targetRoute = '/espaces';
  } else if (action.includes('user') || action.includes('role')) {
    title = t ? t('audit.entities.User', 'Équipe & Utilisateurs') : 'Équipe & Utilisateurs';
    targetRoute = '/utilisateurs';
  } else if (action.includes('scene') || action.includes('placement')) {
    title = t ? t('audit.entities.Object3D', 'Studio 3D') : 'Studio 3D';
    targetRoute = '/editeur-3d';
  } else if (action.includes('upgrade') || action.includes('pack')) {
    title = t ? t('audit.entities.UpgradeRequest', 'Abonnement & Pack') : 'Abonnement & Pack';
    targetRoute = isRoot ? '/root/demandes-upgrade' : '/abonnement';
    if (action.includes('requested')) {
      isPriority = true;
    }
  }

  if (isRoot) {
    return {
      id: log.id || `notif-${Date.now()}-${Math.random()}`,
      type,
      title: isPriority ? `🚨 [ROOT] ${title}` : `[ROOT] ${title}`,
      message: `${message} · ${log.company?.nom || 'Global'}`,
      createdAt: log.createdAt || new Date().toISOString(),
      targetRoute,
      read: false,
      isRootOnly: true,
      telemetry: {
        ip: log.ip,
        subsystem: log.subsystem,
        transactionId: log.transactionId,
      },
    };
  }

  return {
    id: log.id || `notif-${Date.now()}-${Math.random()}`,
    type,
    title,
    message,
    createdAt: log.createdAt || new Date().toISOString(),
    targetRoute,
    read: false,
  };
}
