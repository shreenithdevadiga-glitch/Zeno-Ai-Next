import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Terminal,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database
} from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const AdminOpsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'rag'>('jobs');
  const [jobsData, setJobsData] = useState<{ researchJobs: any[]; sandboxRuns: any[] }>({ researchJobs: [], sandboxRuns: [] });
  const [ragData, setRagData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/jobs');
      setJobsData(res);
    } catch (err) {
      console.warn('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRag = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/rag');
      setRagData(res);
    } catch (err) {
      console.warn('Failed to load RAG diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'jobs') fetchJobs();
    else fetchRag();
  }, [activeTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          <span>Operations, Background Queues & RAG Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor asynchronous BullMQ background workers, isolated code execution sandboxes, and vector chunk indexing.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'jobs'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Job Queues & Sandbox Runs</span>
        </button>

        <button
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
            activeTab === 'rag'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Hybrid RAG Vector Engine</span>
        </button>
      </div>

      {/* TAB 1: JOBS & SANDBOX RUNS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Code Sandbox Runs */}
          <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden space-y-3 p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Isolated Sandbox Code Executions</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">Run ID</th>
                    <th className="py-2.5 px-3">Language</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Stdout Preview</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobsData.sandboxRuns?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-white/5 transition">
                      <td className="py-2.5 px-3 text-cyan-300 font-bold">{s.id.slice(0, 14)}...</td>
                      <td className="py-2.5 px-3 uppercase text-slate-300">{s.language}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                          s.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {s.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{s.execution_time_ms}ms</td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-[200px] truncate">
                        {s.stdout ? s.stdout.slice(0, 50) : (s.stderr || 'No output')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{s.created_at}</td>
                    </tr>
                  ))}
                  {(!jobsData.sandboxRuns || jobsData.sandboxRuns.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No sandbox runs executed recently.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Research Jobs */}
          <div className="rounded-2xl glass-panel-elevated border border-white/10 overflow-hidden space-y-3 p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Autonomous Deep Research Tasks</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">Research Objective</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Depth</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobsData.researchJobs?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-white/5 transition">
                      <td className="py-2.5 px-3 text-white font-semibold max-w-[240px] truncate">{r.query}</td>
                      <td className="py-2.5 px-3 text-slate-300">{r.user_name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">Level {r.depth}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">{r.created_at}</td>
                    </tr>
                  ))}
                  {(!jobsData.researchJobs || jobsData.researchJobs.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No background research jobs active.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HYBRID RAG VECTOR ENGINE */}
      {activeTab === 'rag' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Total Indexed Documents</span>
            <div className="text-3xl font-bold text-white font-mono">{ragData?.totalIndexedDocuments || 0}</div>
            <p className="text-[11px] text-slate-500">Active documents available in vector store</p>
          </div>

          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Total Vector Chunks</span>
            <div className="text-3xl font-bold text-cyan-400 font-mono">{ragData?.totalChunks || 0}</div>
            <p className="text-[11px] text-slate-500">Embedded with dense cosine representations</p>
          </div>

          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/10 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Tenant Isolation Protocol</span>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-2">
              {ragData?.tenantIsolationProtocol}
            </div>
            <p className="text-[11px] text-slate-500">Cross-tenant vector bleeding strictly prohibited</p>
          </div>
        </div>
      )}
    </div>
  );
};
