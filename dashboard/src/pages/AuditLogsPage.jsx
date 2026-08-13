import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuditLogs } from '../api/auditLogsApi';
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
  KeyRound,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  UPDATED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
  LOGIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  DEFAULT: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

function getActionBadgeStyle(actionStr = '') {
  const upper = actionStr.toUpperCase();
  if (upper.includes('CREATE') || upper.includes('ADD') || upper.includes('PLACED')) return ACTION_COLORS.CREATE;
  if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('STATUS')) return ACTION_COLORS.UPDATE;
  if (upper.includes('DELETE') || upper.includes('REMOVE')) return ACTION_COLORS.DELETE;
  if (upper.includes('LOGIN') || upper.includes('AUTH')) return ACTION_COLORS.LOGIN;
  return ACTION_COLORS.DEFAULT;
}

export default function AuditLogsPage() {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
      };
      const res = await getAuditLogs(params);
      setLogs(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, t]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const localeCode = i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center shadow-md shadow-navy/20">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('audit.title')}</h1>
            <p className="text-sm text-slate-500">
              {t('audit.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs(meta.page)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
            id="refresh-logs-btn"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-navy' : ''} />
            <span>{t('audit.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] relative">
          <Search size={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('audit.searchPlaceholder')}
            className="w-full ps-10 pe-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            id="audit-logs-search-input"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600">
            <Filter size={14} className="text-slate-400" />
            <span>{t('audit.typeFilter')}</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-slate-800"
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

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">{t('audit.table.timestamp')}</th>
                <th className="px-6 py-4">{t('audit.table.actor')}</th>
                <th className="px-6 py-4">{t('audit.table.action')}</th>
                <th className="px-6 py-4">{t('audit.table.entity')}</th>
                <th className="px-6 py-4">{t('audit.table.company')}</th>
                <th className="px-6 py-4 text-center">{t('audit.table.details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl w-12 mx-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <FileText size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">{t('common.empty')}</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString(localeCode, {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  });
                  const badgeStyle = getActionBadgeStyle(log.action);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {log.actor?.nom ? log.actor.nom[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">
                              {log.actor?.nom || 'Utilisateur Système'}
                            </p>
                            <p className="text-xs text-slate-400">{log.actor?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                        {log.entityType || 'Général'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.isRootIntervention ? (
                          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-md border border-amber-200">
                            Intervention ROOT
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">
                            {log.company?.nom || 'Standard'}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-xl transition-colors"
                          title={t('audit.table.details')}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page <strong>{meta.page}</strong> sur <strong>{meta.totalPages}</strong> ({meta.total} entrées au total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </button>
              <button
                onClick={() => fetchLogs(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} className="rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Metadata Viewer Modal */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title={t('audit.table.details')} size="lg">
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <p className="text-slate-400 font-medium">ID :</p>
                <p className="font-mono text-slate-700 font-semibold">{selectedLog.id}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">{t('audit.table.action')} :</p>
                <p className="font-semibold text-slate-800">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">{t('audit.table.actor')} :</p>
                <p className="font-semibold text-slate-800">{selectedLog.actor?.nom} ({selectedLog.actor?.email})</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">{t('audit.table.timestamp')} :</p>
                <p className="font-mono text-slate-700">{new Date(selectedLog.createdAt).toLocaleString(localeCode)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Code size={14} />
                <span>JSON Payload</span>
              </p>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
