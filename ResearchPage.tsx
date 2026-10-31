import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  Search,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { marked } from 'marked';
import { ResearchJob } from '../types';
import { apiFetch } from '../lib/api';
import { ZenoOrb } from '../components/ZenoOrb';

const ALL_RESEARCH_TOPICS = [
  'Transformer Architecture Optimizations for Speculative Decoding in 2026',
  'Commercial Quantum Computing & Fault-Tolerant Qubits Verification',
  'Autonomous Multi-Agent AI Orchestration & Self-Reflective Loops',
  'Solid-State Battery Electrolytes & Grid Storage Commercialization',
  'Next-Generation Nuclear Fusion Reactor Designs & Net Energy Gains',
  'Embodied AI & Foundation Models for Humanoid Robotics in 2026',
  'Post-Quantum Cryptography Migration & NIST Standard Implementations',
  'James Webb Space Telescope Deep-Field Galactic Formation Findings',
  'CRISPR Epigenome Editing & Cellular Rejuvenation Therapy Milestones',
  'Photonic Computing & Optical Interconnect Scaling in Data Centers',
  'Neuromorphic Processors & Event-Based Vision Sensor Architectures',
  'Decentralized GPU Compute Networks (DePIN) Performance & Unit Economics',
  'Room-Temperature Superconductivity Experimental Replications & Truth',
  'Autonomous Driving Level 4 vs Level 5 Safety Benchmarks & Regulations',
  'High-Throughput mRNA Vaccine Platforms for Oncology & Rare Disease',
  'Perovskite-Silicon Tandem Solar Cell Degradation & Efficiency Limits',
  'State-of-the-Art Test-Time Compute & Reasoning Models Comparison',
  'Deep Space Propulsion: Fusion Drives & Advanced Ion Thrusters',
  'Brain-Computer Interfaces: Non-Invasive Neural Decoding Accuracy in 2026',
  'Microplastics Biodegradation via Engineered Bacterial Enzymes',
  'Zero-Knowledge Proofs & Scalability Limits in Layer-2 Rollups',
  'Graphene Nanoribbon Transistors & Beyond-Silicon Semiconductor Scaling'
];

export const ResearchPage: React.FC = () => {
  // Randomly pick 4 quick topics and a fresh sample objective every time the user visits
  const [activeTopics, setActiveTopics] = useState<string[]>(() => {
    return [...ALL_RESEARCH_TOPICS].sort(() => 0.5 - Math.random()).slice(0, 4);
  });
  const [sampleObjective, setSampleObjective] = useState<string>(() => {
    return ALL_RESEARCH_TOPICS[Math.floor(Math.random() * ALL_RESEARCH_TOPICS.length)];
  });

  const shuffleTopics = () => {
    const shuffled = [...ALL_RESEARCH_TOPICS].sort(() => 0.5 - Math.random());
    setActiveTopics(shuffled.slice(0, 4));
    setSampleObjective(shuffled[4] || ALL_RESEARCH_TOPICS[0]);
  };

  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<number>(2);
  const [breadth, setBreadth] = useState<number>(4);
  const [isRunning, setIsRunning] = useState(false);
  const [currentJob, setCurrentJob] = useState<ResearchJob | null>(null);
  const [jobHistory, setJobHistory] = useState<ResearchJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const data = await apiFetch('/api/research/jobs');
      setJobHistory(data.jobs || []);
    } catch (err) {
      console.warn('Could not load research jobs:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleStartResearch = async (targetQuery?: string) => {
    const effectiveQuery = (typeof targetQuery === 'string' ? targetQuery : query).trim() || sampleObjective;
    if (isRunning) return;

    if (!query.trim()) {
      setQuery(effectiveQuery);
    }

    setIsRunning(true);
    setError(null);
    setCurrentJob({
      id: 'active-job',
      query: effectiveQuery,
      status: 'running',
      depth,
      breadth,
      plan: [
        { step: 1, name: 'Formulate Research Architecture', status: 'completed' },
        { step: 2, name: `Harvest multi-source intelligence across ${breadth} query vectors`, status: 'in_progress' },
        { step: 3, name: 'Cross-verify facts and rank empirical evidence', status: 'pending' },
        { step: 4, name: 'Synthesize comprehensive whitepaper report', status: 'pending' }
      ],
      created_at: new Date().toISOString()
    });

    try {
      const res = await apiFetch('/api/research/deep', {
        method: 'POST',
        body: JSON.stringify({ query: effectiveQuery, depth, breadth })
      });

      setCurrentJob(res.job);
      loadHistory();
    } catch (err: any) {
      console.error('Deep research failed:', err);
      setError(err.message || 'Research pipeline encountered an issue.');
      if (currentJob) {
        setCurrentJob({ ...currentJob, status: 'failed', error_message: err.message });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSelectHistoricalJob = async (jobId: string) => {
    try {
      const data = await apiFetch(`/api/research/jobs/${jobId}`);
      setCurrentJob(data.job);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Deep Research Studio
              </h1>
              <p className="text-xs text-slate-400">
                Multi-agent web investigation, source verification, and comprehensive whitepaper generation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Query Formulation Console */}
      <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Research Objective or Technical Inquiry
          </label>
          <button
            type="button"
            onClick={() => setQuery(sampleObjective)}
            disabled={isRunning}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline flex items-center gap-1 cursor-pointer transition"
          >
            <Sparkles className="w-3 h-3" />
            <span>Use Sample Objective</span>
          </button>
        </div>

        <div className="relative">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`e.g., ${sampleObjective}...`}
            rows={3}
            disabled={isRunning}
            className="w-full p-4 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Suggestion Chips with Dynamic Randomization & Shuffle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">Quick Topics (Randomized each visit):</span>
            <button
              type="button"
              onClick={shuffleTopics}
              disabled={isRunning}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline flex items-center gap-1 cursor-pointer transition"
              title="Roll new randomized research topics"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Shuffle Topics</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTopics.map(topic => (
              <button
                key={topic}
                type="button"
                onClick={() => setQuery(topic)}
                disabled={isRunning}
                className="px-2.5 py-1 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-white/10 transition cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Depth & Breadth Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 rounded-xl glass-card border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">Research Depth</span>
              <span className="text-xs font-mono text-cyan-400">Level {depth}</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              value={depth}
              onChange={e => setDepth(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>Standard (1)</span>
              <span>Deep (2)</span>
              <span>Exhaustive (3)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl glass-card border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">Search Breadth</span>
              <span className="text-xs font-mono text-cyan-400">{breadth} Queries</span>
            </div>
            <input
              type="range"
              min={2}
              max={6}
              value={breadth}
              onChange={e => setBreadth(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>Focused (2)</span>
              <span>Balanced (4)</span>
              <span>Comprehensive (6)</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleStartResearch()}
          disabled={isRunning}
          className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg cursor-pointer
            ${isRunning
              ? 'bg-white/10 text-slate-400 cursor-wait'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:shadow-cyan-500/30 hover:scale-[1.01] active:scale-[0.99]'
            }
          `}
        >
          {isRunning ? (
            <>
              <ZenoOrb size="sm" state="thinking" />
              <span>Researching across live web sources via Tavily...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span>Launch Deep Research</span>
              {!query.trim() && (
                <span className="text-[11px] text-cyan-200/80 font-normal">
                  (Click to run sample objective)
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Research Progress Steps */}
      {currentJob && (
        <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ZenoOrb size="sm" state={currentJob.status === 'running' ? 'thinking' : 'idle'} />
              <div>
                <h3 className="font-semibold text-sm text-white">
                  {currentJob.query}
                </h3>
                <span className="text-[11px] text-cyan-400 font-mono uppercase">
                  Status: {currentJob.status}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Steps Progression */}
          {currentJob.plan && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {currentJob.plan.map((step, idx) => {
                const isDone = step.status === 'completed';
                const isInProg = step.status === 'in_progress';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition
                      ${isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : (isInProg
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse'
                          : 'bg-white/5 border-white/10 text-slate-400'
                        )
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px]">Step {step.step}</span>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {isInProg && <Clock className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="font-medium truncate">{step.name}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sources Section */}
          {currentJob.sources && currentJob.sources.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Harvested Primary Sources ({currentJob.sources.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {currentJob.sources.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl glass-card hover:border-cyan-500/40 text-left transition group"
                  >
                    <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                      {s.snippet || s.content_snippet}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Completed Report Display */}
          {(currentJob.report || currentJob.report_markdown) && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Synthesized Whitepaper Report</span>
                </h4>
                <button
                  onClick={() => {
                    const text = currentJob.report || currentJob.report_markdown || '';
                    const blob = new Blob([text], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `zeno-research-${currentJob.id}.md`;
                    a.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card text-xs text-slate-300 hover:text-white hover:border-cyan-500/40 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Markdown</span>
                </button>
              </div>

              <div
                className="prose-zeno p-6 rounded-2xl bg-black/40 border border-white/10 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(currentJob.report || currentJob.report_markdown || '') as string
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Historical Inquiries List */}
      {jobHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Past Research Dossiers
          </h3>
          <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
            {jobHistory.map(job => (
              <div
                key={job.id}
                onClick={() => handleSelectHistoricalJob(job.id)}
                className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="text-sm font-medium text-slate-200 truncate">{job.query}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                    <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    <span>Depth: {job.depth}</span>
                    <span className="text-cyan-400 uppercase">{job.status}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
