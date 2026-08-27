import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getAuditLogs } from '../api/auditLogsApi';
import { subscribeActivity } from '../utils/activityBus';
import Modal from '../components/Modal';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Filter,
  User,
  Calendar,
  Code,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  Terminal,
  Activity,
  Layers,
  Flag,
  Map,
  Box,
  Users as UsersIcon,
  CreditCard,
  KeyRound,
  FileText,
  Copy,
  Check,
  Globe,
  ArrowRight,
  ShieldAlert,
  Server,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getLocalizedLogSummary, getLocalizedEntityName } from '../utils/toastUtils';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  UPDATE: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  DELETE: 'bg-red-500/10 text-red-700 border-red-500/30',
  LOGIN: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
  OVERRIDE: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
  DEFAULT: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
};

const SUBSYSTEM_BADGES = {
  karts: { label: 'Karts & Pistes', icon: Flag, color: 'bg-amber-100 text-amber-900 border-amber-200' },
  espaces: { label: 'Espaces 3D', icon: Map, color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  studio3d: { label: 'Studio 3D', icon: Box, color: 'bg-violet-100 text-violet-900 border-violet-200' },
  subscriptions: { label: 'Abonnements', icon: CreditCard, color: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
  users: { label: 'Utilisateurs', icon: UsersIcon, color: 'bg-blue-100 text-blue-900 border-blue-200' },
  roles: { label: 'Droits & Rôles', icon: KeyRound, color: 'bg-rose-100 text-rose-900 border-rose-200' },
  system: { label: 'Système', icon: Server, color: 'bg-slate-100 text-slate-900 border-slate-200' },
};

function getActionBadgeStyle(actionStr = '') {
  const upper = actionStr.toUpperCase();
  if (upper.includes('CREATE') || upper.includes('ADD') || upper.includes('APPROVED')) return ACTION_COLORS.CREATE;
  if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('STATUS')) return ACTION_COLORS.UPDATE;
  if (upper.includes('DELETE') || upper.includes('REMOVE') || upper.includes('REJECT')) return ACTION_COLORS.DELETE;
  if (upper.includes('LOGIN') || upper.includes('AUTH')) return ACTION_COLORS.LOGIN;
  if (upper.includes('OVERRIDE') || upper.includes('STEALTH')) return ACTION_COLORS.OVERRIDE;
  return ACTION_COLORS.DEFAULT;
}

export default function AuditLogsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRoot = user?.role === 'ROOT';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [subsystemFilter, setSubsystemFilter] = useState('ALL');
  const [ipFilter, setIpFilter] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

  // Modal & Inspector states
  const [selectedLog, setSelectedLog] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('network'); // 'network' | 'diff' | 'raw' | 'diagnostics'
  const [copiedPayload, setCopiedPayload] = useState(false);

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 15,
          search: search.trim() || undefined,
          action: actionFilter !== 'ALL' ? actionFilter : undefined,
          subsystem: isRoot && subsystemFilter !== 'ALL' ? subsystemFilter : undefined,
          ip: isRoot && ipFilter.trim() ? ipFilter.trim() : undefined,
        };
        const res = await getAuditLogs(params);
        setLogs(res.data || []);
        if (res.meta) {
          setMeta(res.meta);
        }
      } catch (err) {
        toast.error(t('common.error', 'Erreur lors du chargement des logs.'));
      } finally {
        setLoading(false);
      }
    },
    [search, actionFilter, subsystemFilter, ipFilter, isRoot, t]
  );

  const fetchLogsSilent = useCallback(async () => {
    try {
      const params = {
        page: 1,
        limit: 15,
        search: search.trim() || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        subsystem: isRoot && subsystemFilter !== 'ALL' ? subsystemFilter : undefined,
        ip: isRoot && ipFilter.trim() ? ipFilter.trim() : undefined,
      };
      const res = await getAuditLogs(params);
      const newLogs = res.data || [];
      setLogs((prev) => {
        const prevKey = prev.map((l) => l.id).join(',');
        const nextKey = newLogs.map((l) => l.id).join(',');
        return prevKey === nextKey ? prev : newLogs;
      });
      if (res.meta) setMeta(res.meta);
    } catch (_) {}
  }, [search, actionFilter, subsystemFilter, ipFilter, isRoot]);

  useEffect(() => {
    fetchLogs(1);

    const unsubscribe = subscribeActivity(() => {
      fetchLogsSilent();
    });

    const intervalId = setInterval(fetchLogsSilent, 10000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [fetchLogs, fetchLogsSilent]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleCopyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedPayload(true);
    toast.success(t('audit.copied', 'JSON copié dans le presse-papiers !'));
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const localeCode = i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'en' ? 'en-US' : 'fr-FR';

  // KPI calculations for ROOT view
  const rootStats = useMemo(() => {
    const total = meta.total || logs.length;
    const stealthCount = logs.filter((l) => l.isRootIntervention).length;
    const errorCount = logs.filter((l) => l.action?.toLowerCase().includes('delete') || l.stackTrace).length;
    const uniqueSubsystems = new Set(logs.map((l) => l.subsystem || 'system')).size;

    return {
      total,
      stealthCount,
      errorCount,
      subsystems: Math.max(1, uniqueSubsystems),
    };
  }, [logs, meta]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-10">
      {/* ── Top Header Card ────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                isRoot
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              {isRoot ? 'Administration ROOT · Télémétrie' : 'Journal d\'Activité Entreprise'}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            {isRoot ? (
              <>
                <Terminal size={28} className="text-amber-400" />
                <span>{t('audit.rootTitle', 'Télémétrie & Logs Système Global')}</span>
              </>
            ) : (
              <>
                <ShieldCheck size={28} className="text-indigo-400" />
                <span>{t('audit.tenantTitle', 'Historique des Activités')}</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {isRoot
              ? t('audit.rootSubtitle', 'Supervision bas niveau, télémétrie réseau, diffs d\'état et journalisation multi-tenant.')
              : t('audit.tenantSubtitle', 'Suivi simplifié et traçabilité des opérations de votre entreprise.')}
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => fetchLogs(meta.page)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl text-white font-bold text-xs transition-all active:scale-95"
            id="refresh-logs-btn"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{t('audit.refresh', 'Rafraîchir')}</span>
          </button>
        </div>
      </div>

      {/* ── ROOT KPI Stats Row ────────────────────────────────────────── */}
      {isRoot && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('audit.statsEvents')}</p>
              <p className="text-2xl font-black text-slate-900">{rootStats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('audit.statsSubsystems')}</p>
              <p className="text-2xl font-black text-slate-900">{rootStats.subsystems}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('audit.statsStealth')}</p>
              <p className="text-2xl font-black text-amber-700">{rootStats.stealthCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('audit.statsSecurity')}</p>
              <p className="text-2xl font-black text-slate-900">{rootStats.errorCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
          </div>
        </div>
      )}

      {/* ── Filters Toolbar ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRoot ? "Rechercher par route, acteur, action, ID..." : t('audit.searchPlaceholder')}
            className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            id="audit-logs-search-input"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subsystem Filter (ROOT Only) */}
          {isRoot && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Layers size={13} className="text-slate-400" />
              <span>{t('audit.subsystem')}</span>
              <select
                value={subsystemFilter}
                onChange={(e) => setSubsystemFilter(e.target.value)}
                className="bg-transparent font-bold focus:outline-none cursor-pointer text-slate-900 text-xs"
              >
                <option value="ALL">{t('audit.allSubsystems')}</option>
                <option value="karts">Karts & Pistes</option>
                <option value="espaces">Espaces 3D</option>
                <option value="studio3d">Studio 3D</option>
                <option value="subscriptions">Abonnements</option>
                <option value="users">Utilisateurs</option>
                <option value="roles">Droits & Rôles</option>
                <option value="system">Système</option>
              </select>
            </div>
          )}

          {/* IP Filter (ROOT Only) */}
          {isRoot && (
            <div className="relative">
              <input
                type="text"
                value={ipFilter}
                onChange={(e) => setIpFilter(e.target.value)}
                placeholder={t('audit.filterByIp')}
                className="w-36 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          )}

          {/* Action Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Filter size={13} className="text-slate-400" />
            <span>{t('audit.typeFilter')}</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-slate-900 text-xs"
              id="action-filter-select"
            >
              <option value="ALL">{t('audit.allTypes')}</option>
              <option value="CREATE">{t('audit.createType')}</option>
              <option value="UPDATE">{t('audit.updateType')}</option>
              <option value="DELETE">{t('audit.deleteType')}</option>
              <option value="LOGIN">{t('audit.loginType')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Data View ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">{t('common.loading', 'Chargement des données...')}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 text-center space-y-2">
            <FileText size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">{t('common.empty', 'Aucun enregistrement trouvé')}</p>
            <p className="text-xs text-slate-400">Aucune activité ne correspond aux filtres sélectionnés.</p>
          </div>
        ) : isRoot ? (
          /* ── ROOT Detailed Telemetry Table ── */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="bg-slate-900 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <th className="px-5 py-3.5">{t('audit.table.timestamp')}</th>
                  <th className="px-5 py-3.5">{t('audit.table.subsystem')}</th>
                  <th className="px-5 py-3.5">{t('audit.table.actor')} & IP</th>
                  <th className="px-5 py-3.5">{t('audit.table.action')}</th>
                  <th className="px-5 py-3.5">{t('audit.table.entity')}</th>
                  <th className="px-5 py-3.5">{t('audit.table.company')}</th>
                  <th className="px-5 py-3.5 text-center">{t('audit.table.telemetry')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString(localeCode, {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  });
                  const badgeStyle = getActionBadgeStyle(log.action);
                  const subCfg = SUBSYSTEM_BADGES[log.subsystem] || SUBSYSTEM_BADGES.system;
                  const SubIcon = subCfg.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Subsystem */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${subCfg.color}`}>
                          <SubIcon size={11} />
                          {subCfg.label}
                        </span>
                      </td>

                      {/* Actor & IP */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div>
                          <p className="font-sans font-bold text-slate-800">{log.actor?.nom || 'ROOT'}</p>
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Globe size={10} /> {log.ip || '127.0.0.1'}
                          </p>
                        </div>
                      </td>

                      {/* Action & Method */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-black text-[9px]">
                            {log.method || 'POST'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                            {log.action}
                          </span>
                        </div>
                      </td>

                      {/* Entity */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-sans text-slate-700 font-medium">
                        {getLocalizedEntityName(log.entityType, t)}
                      </td>

                      {/* Company & Stealth Indicator */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {log.isRootIntervention ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black flex items-center gap-1 w-fit">
                            <Zap size={10} className="text-amber-600" />
                            ROOT STEALTH
                          </span>
                        ) : (
                          <span className="font-sans text-slate-600 text-[11px]">
                            {log.company?.nom || 'Global'}
                          </span>
                        )}
                      </td>

                      {/* Telemetry Inspect */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(log);
                            setInspectorTab('network');
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[11px] font-sans font-bold flex items-center gap-1 mx-auto transition-colors shadow-2xs"
                        >
                          <Terminal size={12} />
                          <span>Inspecter</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Non-ROOT Sanitized Business Activity Stream ── */
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const dateStr = new Date(log.createdAt).toLocaleString(localeCode, {
                dateStyle: 'short',
                timeStyle: 'short',
              });
              const badgeStyle = getActionBadgeStyle(log.action);
              const initials = log.actor?.nom
                ? log.actor.nom.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                : 'U';

              return (
                <div
                  key={log.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {initials}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-black text-slate-900">
                          {getLocalizedLogSummary(log, t)}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                          {getLocalizedEntityName(log.entityType, t)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          {log.actor?.nom} ({log.actor?.email})
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="px-4 py-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
                  >
                    <Eye size={14} />
                    <span>{t('audit.table.viewDetails', 'Voir détails')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination Bar ────────────────────────────────────────── */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              {t('users.pagination.showing', {
                from: (meta.page - 1) * 15 + 1,
                to: Math.min(meta.page * 15, meta.total),
                total: meta.total,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </button>
              <button
                onClick={() => fetchLogs(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} className="rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ROOT Telemetry Inspector Modal ────────────────────────────── */}
      {selectedLog && isRoot && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={t('audit.modal.telemetryTitle', 'Inspecteur de Télémétrie & Logs (ROOT)')}
          size="xl"
        >
          <div className="space-y-5">
            {/* Top Quick Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-2xl text-xs font-mono">
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Transaction ID</p>
                <p className="font-bold text-amber-400 truncate">{selectedLog.transactionId || selectedLog.id}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Subsystem</p>
                <p className="font-bold text-emerald-400">{selectedLog.subsystem || 'system'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Client IP</p>
                <p className="font-bold text-sky-400">{selectedLog.ip || '127.0.0.1'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase">HTTP Route</p>
                <p className="font-bold text-slate-200 truncate">{selectedLog.method} {selectedLog.route}</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setInspectorTab('network')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  inspectorTab === 'network' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('audit.tabNetwork')}
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('diff')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  inspectorTab === 'diff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('audit.tabDiff')}
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('raw')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  inspectorTab === 'raw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('audit.tabRaw')}
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('diagnostics')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  inspectorTab === 'diagnostics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('audit.tabDiagnostics')}
              </button>
            </div>

            {/* Tab Contents */}
            {inspectorTab === 'network' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-sans font-bold">Acteur :</span>
                    <p className="font-semibold text-slate-800">{selectedLog.actor?.nom} ({selectedLog.actor?.email})</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans font-bold">Entreprise Tenant :</span>
                    <p className="font-semibold text-slate-800">{selectedLog.company?.nom || 'Système Global'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-sans font-bold">User-Agent :</span>
                  <p className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] text-slate-700 break-all">
                    {selectedLog.userAgent || 'Mozilla/5.0'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-sans font-bold">Action interne :</span>
                  <p className="font-bold text-indigo-700">{selectedLog.action}</p>
                </div>
              </div>
            )}

            {inspectorTab === 'diff' && (
              <div className="space-y-3 text-xs">
                {selectedLog.before || selectedLog.after || selectedLog.diff ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="font-bold text-rose-700 flex items-center gap-1">
                        <span>●</span> {t('audit.stateBefore')}
                      </p>
                      <pre className="bg-rose-950/90 text-rose-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 border border-rose-900">
                        {JSON.stringify(selectedLog.before || {}, null, 2)}
                      </pre>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-bold text-emerald-700 flex items-center gap-1">
                        <span>●</span> {t('audit.stateAfter')}
                      </p>
                      <pre className="bg-emerald-950/90 text-emerald-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 border border-emerald-900">
                        {JSON.stringify(selectedLog.after || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 border border-slate-200">
                    <Info size={24} className="mx-auto mb-1 text-slate-300" />
                    <p>{t('audit.noDiff')}</p>
                  </div>
                )}
              </div>
            )}

            {inspectorTab === 'raw' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">JSON Payload</span>
                  <button
                    type="button"
                    onClick={() => handleCopyJson(selectedLog.metadata || {})}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedPayload ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedPayload ? t('audit.copied') : t('audit.copyPayload')}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            )}

            {inspectorTab === 'diagnostics' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                {selectedLog.reason && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                    <p className="font-bold text-xs">Motif d'intervention ROOT :</p>
                    <p className="text-xs mt-0.5">{selectedLog.reason}</p>
                  </div>
                )}
                {selectedLog.stackTrace ? (
                  <div className="space-y-1">
                    <p className="font-bold text-red-700">Stack Trace :</p>
                    <pre className="bg-red-950 text-red-300 p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-red-900">
                      {selectedLog.stackTrace}
                    </pre>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Aucune anomalie ou erreur signalée sur cette opération.</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Non-ROOT Sanitized Activity Detail Modal ──────────────────── */}
      {selectedLog && !isRoot && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={t('audit.businessSummary', 'Détails de l\'Activité')}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
                {getLocalizedEntityName(selectedLog.entityType, t)}
              </span>
              <p className="text-sm font-black text-slate-900">
                {getLocalizedLogSummary(selectedLog, t)}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Date & Heure :</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedLog.createdAt).toLocaleString(localeCode)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Effectué par :</span>
                <span className="font-bold text-slate-800">
                  {selectedLog.actor?.nom} ({selectedLog.actor?.email})
                </span>
              </div>
              {selectedLog.metadata?.nom && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Nom de l'élément :</span>
                  <span className="font-bold text-slate-800">{selectedLog.metadata.nom}</span>
                </div>
              )}
              {selectedLog.metadata?.numero && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Numéro de kart :</span>
                  <span className="font-bold text-slate-800">#{selectedLog.metadata.numero}</span>
                </div>
              )}
              {selectedLog.metadata?.status && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Nouveau statut :</span>
                  <span className="font-bold text-emerald-700">{selectedLog.metadata.status}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center italic">
              {t('audit.sanitizedNotice', 'Vue activité simplifiée et sécurisée pour votre organisation.')}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
