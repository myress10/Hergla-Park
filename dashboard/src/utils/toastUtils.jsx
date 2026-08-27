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
 * Helper to convert live activity bus events into clean, role-sanitized notification objects
 */
export function formatRoleNotification(log, isRoot = false) {
  const action = (log.action || '').toLowerCase();
  const meta = log.metadata || {};
  const actorNom = log.actor?.nom || 'Admin';

  let title = 'Action Système';
  let message = log.summary || `${actorNom} a effectué une modification.`;
  let type = 'info';
  let targetRoute = '/audit-logs';
  let isPriority = false;

  if (action.includes('delete') || action.includes('reject') || action.includes('locked')) {
    type = 'warning';
  } else if (action.includes('create') || action.includes('approved') || action.includes('pack_upgraded')) {
    type = 'success';
  }

  if (action.includes('kart')) {
    title = 'Flotte de Karts';
    message = meta.numero
      ? `Mise à jour du kart #${meta.numero} par ${actorNom}`
      : `Configuration des karts mise à jour par ${actorNom}`;
    targetRoute = '/configuration-karts';
  } else if (action.includes('espace')) {
    title = 'Espaces & Visites 3D';
    message = meta.nom
      ? `L'espace "${meta.nom}" a été mis à jour par ${actorNom}`
      : `Modifications apportées aux espaces par ${actorNom}`;
    targetRoute = '/espaces';
  } else if (action.includes('user') || action.includes('role')) {
    title = 'Équipe & Utilisateurs';
    message = meta.nom
      ? `Profil de ${meta.nom} mis à jour par ${actorNom}`
      : `Gestion des accès d'équipe par ${actorNom}`;
    targetRoute = '/utilisateurs';
  } else if (action.includes('scene') || action.includes('placement')) {
    title = 'Studio 3D';
    message = `Nouvelle disposition 3D enregistrée par ${actorNom}`;
    targetRoute = '/editeur-3d';
  } else if (action.includes('upgrade') || action.includes('pack')) {
    title = 'Abonnement & Pack';
    if (action.includes('requested')) {
      title = 'Demande de Mise à Niveau';
      message = `${actorNom} a demandé le passage au pack ${meta.targetPack || 'supérieur'}`;
      targetRoute = isRoot ? '/root/demandes-upgrade' : '/abonnement';
      isPriority = true;
    } else if (action.includes('approved') || action.includes('pack_upgraded') || action.includes('override')) {
      title = 'Pack Activé';
      message = `Le pack de votre entreprise a été mis à jour vers ${meta.newPack || meta.targetPack || 'Supérieur'} !`;
      targetRoute = isRoot ? '/root/demandes-upgrade' : '/abonnement';
    }
  }

  if (isRoot) {
    return {
      id: log.id || `notif-${Date.now()}-${Math.random()}`,
      type,
      title: isPriority ? `🚨 [PRIORITÉ ROOT] ${title}` : `[ROOT] ${title}`,
      message: `${message} · Entreprise : ${log.company?.nom || 'Global'}`,
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
