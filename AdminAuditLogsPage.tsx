import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, pages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Inspector modal
  const [inspectedLog, setInspectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(actionFilter && { action: actionFilter })
      });
      const res = await apiFetch(`/api/admin/audit-logs?${queryParams.toString()}`);
      setLogs(res.logs || []);
      setPagination(res.pagination || { page: 1, limit: 30, total: 0, pages: 1 });
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, actionFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Immutable Platform Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident record of all administrative, authentication, and security modifications across the platform.
          </p>
        </div>

        <a
          href="/api/admin/export/audit-logs"
          download
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition w-fit"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Audit Trail (JSON)</span>
        </a>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-2xl glass-panel-elevated border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Filter by Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Actions</option>
            <option value="AUTH_LOGIN">AUTH_LOGIN</option>
            <option value="AUTH_REGISTER">AUTH_REGISTER</option>
            <option value="USER_SUSPENDED">USER_SUSPENDED</option>
            <option value="USER_ACTIVATED">USER_ACTIVATED</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            <option value="PLAN_CHANGED">PLAN_CHANGED</option>
            <option value="SESSION_REVOKED">SESSION_REVOKED</option>
            <option value="FILE_DELETED">FILE_DELETED</option>
            <option value="CONVERSATION_DELETED">CONVERSATION_DELETED</option>
            <option value="FEATURE_FLAG_TOGGLED">FEATURE_FLAG_TOGGLED</option>
            <option value="SECURITY_EVENT_RESOLVED">SECURITY_EVENT_RESOLVED</option>
          </select>
        </div>

        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
          Append-Only Audit Enforced
        </span>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Resource</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition">
                <td className="py-3 px-4 font-bold text-cyan-300">{log.action}</td>
                <td className="py-3 px-4 text-white">
                  <div>{log.user_name || 'System / Guest'}</div>
                  <div className="text-[10px] text-slate-400">{log.user_email || log.user_id || 'system'}</div>
                </td>
                <td className="py-3 px-4 text-slate-300">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 uppercase text-[10px]">
                    {log.resource_type || 'platform'}
                  </span>
                  {log.resource_id && <span className="ml-1.5 text-slate-400 text-[10px]">{log.resource_id.slice(0, 12)}...</span>}
                </td>
                <td className="py-3 px-4 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                <td className="py-3 px-4 text-slate-400 text-[11px]">{log.created_at}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setInspectedLog(log)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition"
                    title="Inspect Audit Metadata"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                  Zero audit log records match the selected query.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} audit entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {pagination.page} of {pagination.pages || 1}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(pagination.pages, p.page + 1) }))}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Inspector Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl glass-panel-elevated border border-white/15 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Audit Event: {inspectedLog.action}</span>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div><strong className="text-slate-400">Log ID:</strong> {inspectedLog.id}</div>
              <div><strong className="text-slate-400">Actor:</strong> {inspectedLog.user_name || 'System'} ({inspectedLog.user_email || 'n/a'})</div>
              <div><strong className="text-slate-400">IP Address:</strong> {inspectedLog.ip_address || '127.0.0.1'}</div>
              <div><strong className="text-slate-400">Timestamp:</strong> {inspectedLog.created_at}</div>
              <div className="pt-2">
                <strong className="text-slate-400">Event Details Payload:</strong>
                <pre className="mt-1 p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] text-cyan-300 overflow-x-auto">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(inspectedLog.details_json || '{}'), null, 2);
                    } catch {
                      return inspectedLog.details_json || '{}';
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
