import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Brain,
  DollarSign,
  KeyRound,
  ShieldAlert,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Server,
  Database,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/admin/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono">Aggregating live platform telemetry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl glass-panel border border-rose-500/30 bg-rose-500/10 text-rose-200 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <span>Telemetry Acquisition Error</span>
        </div>
        <p className="text-xs text-rose-300">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { users, auth, ai, storage, jobs, security, infrastructure, dailyTrends } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>SaaS Operations & Telemetry</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tenant intelligence, AI token consumption, infrastructure health, and security governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/security')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Security Center ({security?.unresolvedIncidents || 0})</span>
          </button>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs text-cyan-300 font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Users */}
        <div
          onClick={() => navigate('/admin/users')}
          className="rounded-2xl glass-panel-elevated p-5 border border-white/10 hover:border-cyan-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Users</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{users?.total || 0}</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center">
              {users?.active || 0} active
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            +{users?.newToday || 0} today • +{users?.newThisWeek || 0} this week
          </div>
        </div>

        {/* Metric 2: AI Requests & Tokens */}
        <div
          onClick={() => navigate('/admin/ai-analytics')}
          className="rounded-2xl glass-panel-elevated p-5 border border-white/10 hover:border-indigo-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Invocations</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{ai?.totalRequests || 0}</span>
            <span className="text-xs text-indigo-400 font-mono">
              {(ai?.totalTokens || 0).toLocaleString()} tok
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Today: {ai?.today?.requests || 0} reqs ({ai?.today?.tokens?.toLocaleString() || 0} tokens)
          </div>
        </div>

        {/* Metric 3: Estimated Cost */}
        <div
          onClick={() => navigate('/admin/ai-analytics')}
          className="rounded-2xl glass-panel-elevated p-5 border border-white/10 hover:border-emerald-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Provider Cost</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              ${(ai?.totalCostUsd || 0).toFixed(4)}
            </span>
            <span className="text-xs text-slate-400 font-mono">USD</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Avg Latency: {ai?.avgLatencyMs || 0}ms
          </div>
        </div>

        {/* Metric 4: Active Sessions */}
        <div
          onClick={() => navigate('/admin/auth-audits')}
          className="rounded-2xl glass-panel-elevated p-5 border border-white/10 hover:border-purple-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Sessions</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{auth?.activeSessions || 0}</span>
            <span className="text-xs text-purple-400 font-mono">sessions</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            {auth?.successful || 0} logins recorded
          </div>
        </div>
      </div>

      {/* Trend Charts & Daily Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Column: Daily Activity */}
        <div className="lg:col-span-2 rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Daily AI Requests & Throughput</h3>
              <p className="text-xs text-slate-400">Aggregated token execution across all connected providers</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
              Last 14 Days
            </span>
          </div>

          {Array.isArray(dailyTrends) && dailyTrends.length > 0 ? (
            <div className="space-y-3 pt-2">
              <div className="h-44 flex items-end gap-2 border-b border-white/10 pb-2">
                {dailyTrends.map((t: any, idx: number) => {
                  const maxRequests = Math.max(...dailyTrends.map((d: any) => d.requests || 1), 5);
                  const heightPct = Math.max(10, Math.min(100, Math.round(((t.requests || 1) / maxRequests) * 100)));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-30 pointer-events-none p-2 rounded-xl bg-black/90 border border-white/15 text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl">
                        <div>{t.date}</div>
                        <div>Requests: {t.requests}</div>
                        <div>Tokens: {t.tokens?.toLocaleString()}</div>
                        <div>Cost: ${t.cost?.toFixed(4)}</div>
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-indigo-500 group-hover:from-cyan-400 group-hover:to-indigo-400 transition"
                      />
                      <span className="text-[9px] font-mono text-slate-500 truncate max-w-full">
                        {t.date ? t.date.slice(5) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500 font-mono">
              Zero telemetry logs recorded for the selected time window.
            </div>
          )}
        </div>

        {/* Infrastructure & Subsystem Status */}
        <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Infrastructure Health</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Database */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-medium text-slate-200">Database Engine</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {infrastructure?.database?.type?.toUpperCase()} • {infrastructure?.database?.latencyMs || 0}ms
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/30">
                HEALTHY
              </span>
            </div>

            {/* Storage */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="font-medium text-slate-200">Object Storage</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {infrastructure?.storage?.type?.toUpperCase()} • {storage?.totalFiles || 0} files
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            {/* Redis & Queues */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-medium text-slate-200">Worker Queue</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {infrastructure?.redis?.status?.toUpperCase()}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] border ${
                infrastructure?.redis?.ok
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}>
                {infrastructure?.redis?.ok ? 'CONNECTED' : 'IN-MEMORY'}
              </span>
            </div>

            {/* API Server */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-medium text-slate-200">API Gateway</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Uptime: {Math.round((infrastructure?.api?.uptimeSeconds || 0) / 60)} mins
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/30">
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
