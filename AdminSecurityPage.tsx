import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Eye,
  Shield,
  Lock,
  Globe,
  Mail,
  Phone,
  KeyRound,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminSecurityPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Recovery settings state
  const [recovery, setRecovery] = useState<any>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(severityFilter && { severity: severityFilter })
      });
      const res = await apiFetch(`/api/admin/security/events?${queryParams.toString()}`);
      setEvents(res.events || []);
      setPagination(res.pagination || { page: 1, limit: 25, total: 0 });
    } catch (err) {
      console.warn('Failed to load security events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecoverySettings = async () => {
    try {
      const res = await apiFetch('/api/admin/auth/recovery-settings');
      setRecovery(res);
      if (res.recoveryPhone && res.recoveryPhone !== 'Not configured') {
        setPhoneInput(res.recoveryPhone);
      }
    } catch (err) {
      console.warn('Failed to fetch recovery settings:', err);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
    fetchRecoverySettings();
  }, [pagination.page, severityFilter]);

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setSavingPhone(true);
    try {
      await apiFetch('/api/admin/auth/update-phone', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneInput.trim() })
      });
      await fetchRecoverySettings();
      setEditingPhone(false);
    } catch (err: any) {
      alert('Error updating phone: ' + err.message);
    } finally {
      setSavingPhone(false);
    }
  };

  const resolveEvent = async (id: string) => {
    try {
      await apiFetch(`/api/admin/security/events/${id}/resolve`, { method: 'PATCH' });
      fetchSecurityEvents();
    } catch (err: any) {
      alert('Resolve error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
          <span>Security Incident Center & Threat Telemetry</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Active tracking of rate-limit violations, brute-force lockouts, SSRF blocks, and administrator password recovery configuration.
        </p>
      </div>

      {/* Admin Recovery & Security Settings Panel */}
      {recovery && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c0e14] to-[#12151f] border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Administrator Recovery & MFA Settings
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              Zero Plaintext Secret Storage
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* Primary Email */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Primary Recovery Email
              </div>
              <div className="text-white font-bold truncate">{recovery.primaryRecoveryEmail}</div>
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                  recovery.emailVerified ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {recovery.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>

            {/* Recovery Phone */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Recovery Phone
                </div>
                {!editingPhone && (
                  <button
                    onClick={() => setEditingPhone(true)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                  >
                    {recovery.recoveryPhone === 'Not configured' ? '+ Configure' : 'Edit'}
                  </button>
                )}
              </div>

              {editingPhone ? (
                <form onSubmit={handleUpdatePhone} className="flex gap-2 pt-1">
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="px-2 py-1 rounded bg-black/60 border border-cyan-500/40 text-xs text-white focus:outline-none flex-1 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={savingPhone}
                    className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPhone(false)}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-slate-300 text-[10px]"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <div className="text-white font-bold">{recovery.recoveryPhone}</div>
                  <div className="pt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                      recovery.phoneVerified ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    }`}>
                      {recovery.phoneVerified ? 'Verified' : 'Not Configured'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Active Sessions & MFA */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Active Sessions & Password State
              </div>
              <div className="text-white font-bold flex items-center gap-2">
                <span>{recovery.activeSessionsCount} Active Session(s)</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">
                  MFA: {recovery.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate pt-1">
                Last Changed: {recovery.lastPasswordChange ? new Date(recovery.lastPasswordChange).toLocaleString() : 'System Genesis'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-2xl glass-panel-elevated border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Severity Filter:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>

        <button
          onClick={fetchSecurityEvents}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
          title="Refresh Events"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Security Incident Table */}
      <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
              <th className="py-3 px-4">Threat Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Involved User / IP</th>
              <th className="py-3 px-4">Target Endpoint</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-white/5 transition">
                <td className="py-3 px-4 font-bold text-white uppercase">{e.event_type}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                    e.severity === 'critical'
                      ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : e.severity === 'high'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : e.severity === 'medium'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {e.severity}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">
                  <div>{e.user_email || 'Unauthenticated'}</div>
                  <div className="text-[10px] text-slate-500">{e.ip_address || '127.0.0.1'}</div>
                </td>
                <td className="py-3 px-4 text-slate-400">{e.endpoint || '/api'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                    e.is_resolved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  }`}>
                    {e.is_resolved ? 'RESOLVED' : 'UNRESOLVED'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 text-[11px]">{e.created_at}</td>
                <td className="py-3 px-4 text-right">
                  {!e.is_resolved && (
                    <button
                      onClick={() => resolveEvent(e.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-[11px] transition"
                    >
                      Acknowledge
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                  No security incidents recorded. System running within clean parameters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
