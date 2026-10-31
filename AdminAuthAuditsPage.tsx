import React, { useState, useEffect } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  Search,
  Filter,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Globe,
  Monitor
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminAuthAuditsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logins' | 'registrations' | 'sessions'>('logins');

  // Logins state
  const [logins, setLogins] = useState<any[]>([]);
  const [loginPagination, setLoginPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loginFilter, setLoginFilter] = useState('');

  // Registrations state
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [regPagination, setRegPagination] = useState({ page: 1, limit: 25, total: 0 });

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchLogins = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: loginPagination.page.toString(),
        limit: loginPagination.limit.toString(),
        ...(loginFilter && { status: loginFilter })
      });
      const res = await apiFetch(`/api/admin/logins?${queryParams.toString()}`);
      setLogins(res.events || []);
      setLoginPagination(res.pagination || { page: 1, limit: 25, total: 0 });
    } catch (err) {
      console.warn('Failed to load logins:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: regPagination.page.toString(),
        limit: regPagination.limit.toString()
      });
      const res = await apiFetch(`/api/admin/registrations?${queryParams.toString()}`);
      setRegistrations(res.events || []);
      setRegPagination(res.pagination || { page: 1, limit: 25, total: 0 });
    } catch (err) {
      console.warn('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/sessions');
      setSessions(res.sessions || []);
    } catch (err) {
      console.warn('Failed to load active sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logins') fetchLogins();
    else if (activeTab === 'registrations') fetchRegistrations();
    else if (activeTab === 'sessions') fetchSessions();
  }, [activeTab, loginPagination.page, regPagination.page, loginFilter]);

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this active session? The user will be immediately logged out.')) return;
    try {
      await apiFetch(`/api/admin/sessions/${sessionId}`, { method: 'DELETE' });
      fetchSessions();
    } catch (err: any) {
      alert('Failed to revoke session: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <LogIn className="w-6 h-6 text-cyan-400" />
            <span>Authentication, Access & Session Audits</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verification of login events, sign-up records, and active device sessions. Zero plaintext passwords stored or exposed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/export/${activeTab === 'logins' ? 'logins' : 'registrations'}`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export {activeTab.toUpperCase()} (JSON)</span>
          </a>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('logins')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'logins'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Login & Logout History</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'registrations'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Registration History</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'sessions'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Active Sessions ({sessions.length})</span>
        </button>
      </div>

      {/* TAB 1: LOGIN HISTORY */}
      {activeTab === 'logins' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl glass-panel-elevated border border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Filter by Login Outcome:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLoginFilter('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono ${!loginFilter ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setLoginFilter('success')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono ${loginFilter === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'}`}
              >
                Success
              </button>
              <button
                onClick={() => setLoginFilter('failed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono ${loginFilter === 'failed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'}`}
              >
                Failed
              </button>
              <button
                onClick={() => setLoginFilter('logout')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono ${loginFilter === 'logout' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'}`}
              >
                Logout
              </button>
            </div>
          </div>

          <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
                  <th className="py-3 px-4">Attempted Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Device / Browser</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {logins.map((l) => (
                  <tr key={l.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4 text-white font-medium">{l.email_attempted}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                        l.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : l.status === 'logout'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {l.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {l.device || 'Desktop'} • {l.browser || 'Browser'} ({l.os || 'OS'})
                    </td>
                    <td className="py-3 px-4 text-slate-400">{l.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{l.created_at}</td>
                  </tr>
                ))}
                {logins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                      No login events recorded for this criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTRATION HISTORY */}
      {activeTab === 'registrations' && (
        <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {registrations.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition">
                  <td className="py-3 px-4 text-white font-medium">{r.user_name || 'New Account'}</td>
                  <td className="py-3 px-4 text-slate-300">{r.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {r.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{r.method}</td>
                  <td className="py-3 px-4 text-slate-400">{r.source}</td>
                  <td className="py-3 px-4 text-slate-400">{r.ip_address || '127.0.0.1'}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{r.created_at}</td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    No registration events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ACTIVE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Client User-Agent</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition">
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{s.user_name}</div>
                    <div className="text-[10px] text-slate-400">{s.user_email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[10px]">{s.id.slice(0, 16)}...</td>
                  <td className="py-3 px-4 text-slate-300 max-w-[220px] truncate" title={s.user_agent}>
                    {s.user_agent || 'Browser'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{s.ip_address || '127.0.0.1'}</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{s.last_active_at}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => revokeSession(s.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 text-[11px] transition"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    No active sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
