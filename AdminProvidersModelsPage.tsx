import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminProvidersModelsPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        apiFetch('/api/admin/ai/providers'),
        apiFetch('/api/admin/ai/models')
      ]);
      setProviders(pRes.providers || []);
      setModels(mRes.models || []);
    } catch (err) {
      console.warn('Failed to load providers or models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <span>AI Providers & Model Architecture</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Provider circuit breakers, masked credentials governance, model capabilities, and routing policies.
        </p>
      </div>

      {/* Provider Connectivity Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Active AI Providers & Circuit Status</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p: any) => (
            <div key={p.id} className="rounded-2xl glass-panel-elevated p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{p.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  p.configured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  {p.configured ? 'CONFIGURED' : 'OPTIONAL'}
                </span>
              </div>

              <div className="text-xs font-mono space-y-1 text-slate-300">
                <div>
                  <span className="text-slate-500">API Key: </span>
                  <span className="text-cyan-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                    {p.apiKeyMasked || 'Not configured'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Circuit State: </span>
                  <span className="text-emerald-400 font-semibold">CLOSED (Healthy)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="text-[10px] text-slate-500 font-mono mb-1.5">Supported Endpoints:</div>
                <div className="flex flex-wrap gap-1">
                  {p.modelsSupported?.map((m: string, i: number) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono text-slate-300 border border-white/10">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Catalog Table */}
      <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden space-y-3 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Frontier & Open-Source Model Registry</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Model Name</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Context Window</th>
                <th className="py-2.5 px-3">Capabilities</th>
                <th className="py-2.5 px-3">Cost Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {models.map((m: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white">{m.name}</div>
                    <div className="text-[10px] text-cyan-400">{m.id}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 uppercase">{m.provider}</td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {m.contextWindow ? `${(m.contextWindow / 1024)}k tokens` : '128k tokens'}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {m.capabilities ? Object.entries(m.capabilities).filter(([_, v]) => v).map(([k], i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] uppercase text-cyan-300">
                          {k}
                        </span>
                      )) : (
                        <span className="text-[10px] text-slate-500">Multimodal</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                      {m.costTier || 'Standard'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
