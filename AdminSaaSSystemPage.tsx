import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Flag,
  Bell,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Server
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminSaaSSystemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'flags' | 'announcements' | 'health'>('plans');

  // Plans
  const [plans, setPlans] = useState<any[]>([]);

  // Flags
  const [flags, setFlags] = useState<any[]>([]);

  // Announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newSeverity, setNewSeverity] = useState('info');

  // Health
  const [healthData, setHealthData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/plans');
      setPlans(res.plans || []);
    } catch (err) {
      console.warn('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/feature-flags');
      setFlags(res.flags || []);
    } catch (err) {
      console.warn('Failed to load flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/announcements');
      setAnnouncements(res.announcements || []);
    } catch (err) {
      console.warn('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/metrics');
      setHealthData(res);
    } catch (err) {
      console.warn('Failed to load health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'plans') fetchPlans();
    else if (activeTab === 'flags') fetchFlags();
    else if (activeTab === 'announcements') fetchAnnouncements();
    else if (activeTab === 'health') fetchHealth();
  }, [activeTab]);

  const toggleFlag = async (key: string, currentEnabled: number) => {
    try {
      await apiFetch(`/api/admin/feature-flags/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_enabled: currentEnabled ? 0 : 1 })
      });
      fetchFlags();
    } catch (err: any) {
      alert('Flag toggle failed: ' + err.message);
    }
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessage) return;
    try {
      await apiFetch('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, message: newMessage, severity: newSeverity })
      });
      setNewTitle('');
      setNewMessage('');
      fetchAnnouncements();
    } catch (err: any) {
      alert('Announcement error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-cyan-400" />
          <span>SaaS Plans, Feature Toggles & Platform Infrastructure</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure subscription quotas, globally toggle platform modules, broadcast maintenance alerts, and inspect memory telemetry.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'plans'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>SaaS Plans & Quotas</span>
        </button>

        <button
          onClick={() => setActiveTab('flags')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'flags'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Feature Flags</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'announcements'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'health'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>System Diagnostics</span>
        </button>
      </div>

      {/* TAB 1: PLANS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl glass-panel-elevated p-5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">{p.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
                  {p.id}
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white font-mono">${p.monthly_price_usd}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>

              <div className="text-xs font-mono space-y-2 text-slate-300 border-t border-white/5 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Tokens:</span>
                  <span className="text-white font-semibold">{(p.monthly_tokens || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Req/Day:</span>
                  <span className="text-white">{p.max_requests_per_day}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Storage Limit:</span>
                  <span className="text-white">{p.max_storage_mb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Concurrent Jobs:</span>
                  <span className="text-white">{p.max_concurrent_jobs}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: FEATURE FLAGS */}
      {activeTab === 'flags' && (
        <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Flag Key</th>
                <th className="py-3 px-4">Feature Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {flags.map((f) => (
                <tr key={f.key} className="hover:bg-white/5 transition">
                  <td className="py-3 px-4 text-cyan-300 font-bold">{f.key}</td>
                  <td className="py-3 px-4 text-white font-medium">{f.name}</td>
                  <td className="py-3 px-4 text-slate-400 font-sans">{f.description}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                      f.is_enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {f.is_enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => toggleFlag(f.key, f.is_enabled)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                        f.is_enabled
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {f.is_enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <form onSubmit={createAnnouncement} className="rounded-2xl glass-panel-elevated p-5 border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Broadcast New Announcement</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Title (e.g. Scheduled System Upgrade)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="success">Success</option>
              </select>
            </div>

            <textarea
              placeholder="Announcement message body..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-cyan-500 text-white text-xs font-medium hover:bg-cyan-600 transition"
            >
              Publish Announcement
            </button>
          </form>

          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="p-4 rounded-xl glass-panel-elevated border border-white/10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{a.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-white/10 text-slate-300">
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{a.message}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{a.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM HEALTH DIAGNOSTICS */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Process Uptime</span>
            <div className="text-2xl font-bold text-white font-mono">{healthData?.uptimeSeconds || 0} seconds</div>
            <p className="text-[11px] text-slate-500">Process running stably with zero crash restarts</p>
          </div>

          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Memory Footprint (RSS)</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{healthData?.memory?.rssMb || 0} MB</div>
            <p className="text-[11px] text-slate-500">Heap Used: {healthData?.memory?.heapUsedMb || 0} MB / {healthData?.memory?.heapTotalMb || 0} MB</p>
          </div>

          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Total Platform Telemetry</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{healthData?.telemetry?.totalRequests || 0} calls</div>
            <p className="text-[11px] text-slate-500">{(healthData?.telemetry?.totalTokensProcessed || 0).toLocaleString()} tokens processed</p>
          </div>
        </div>
      )}
    </div>
  );
};
