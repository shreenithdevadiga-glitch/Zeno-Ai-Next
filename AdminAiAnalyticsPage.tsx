import React, { useState, useEffect } from 'react';
import {
  Brain,
  Cpu,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  Filter,
  Download,
  Users
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminAiAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/ai/analytics?days=${days}`);
      setData(res);
    } catch (err) {
      console.warn('Failed to load AI analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const { modelBreakdown = [], providerBreakdown = [], topUsers = [] } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            <span>AI Token & Provider Cost Governance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditing token throughput, model allocation, upstream latencies, and user consumption economics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Provider Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {providerBreakdown.map((p: any, idx: number) => (
          <div key={idx} className="rounded-2xl glass-panel-elevated p-5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase font-mono">{p.provider}</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {(p.total_tokens || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">tokens</span>
            </div>
            <div className="text-xs text-emerald-400 font-mono">
              ${(p.total_cost_usd || 0).toFixed(4)} USD • {p.request_count} reqs
            </div>
          </div>
        ))}
        {providerBreakdown.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-slate-500 font-mono">
            No provider usage records in the selected time range.
          </div>
        )}
      </div>

      {/* Model Breakdown Table */}
      <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden space-y-3 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Model Execution Breakdown</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Requests</th>
                <th className="py-2.5 px-3">Total Tokens</th>
                <th className="py-2.5 px-3">Est. Cost (USD)</th>
                <th className="py-2.5 px-3">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {modelBreakdown.map((m: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">{m.model}</td>
                  <td className="py-2.5 px-3 text-slate-300 uppercase">{m.provider}</td>
                  <td className="py-2.5 px-3 text-white">{m.request_count}</td>
                  <td className="py-2.5 px-3 text-slate-300">{(m.total_tokens || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">${(m.total_cost_usd || 0).toFixed(4)}</td>
                  <td className="py-2.5 px-3 text-slate-400">{Math.round(m.avg_latency_ms || 0)}ms</td>
                </tr>
              ))}
              {modelBreakdown.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    Zero model executions recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Consuming Users Table */}
      <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden space-y-3 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Top Users by Token Allocation</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Requests</th>
                <th className="py-2.5 px-3">Total Tokens</th>
                <th className="py-2.5 px-3">Est. Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topUsers.map((u: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="py-2.5 px-3 text-white font-medium">
                    <div>{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-white/10 uppercase text-[10px] text-indigo-300">
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-white">{u.request_count}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{(u.total_tokens || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">${(u.total_cost_usd || 0).toFixed(4)}</td>
                </tr>
              ))}
              {topUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No active user consumption recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
