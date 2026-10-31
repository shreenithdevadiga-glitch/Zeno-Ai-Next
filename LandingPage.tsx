import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  Compass,
  Code2,
  Image as ImageIcon,
  Mic,
  FolderKanban,
  FileText,
  Brain,
  Shield,
  Zap,
  Cpu
} from 'lucide-react';
import { ZenoOrb } from '../components/ZenoOrb';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate('/app/chat');
    } else {
      navigate('/login');
    }
  };

  const capabilities = [
    {
      title: 'Provider-Agnostic Router',
      desc: 'Seamlessly cascading between frontier models (GPT-5.4, Gemini 2.5 Flash, Claude 3.5 Sonnet, NVIDIA NIM, and local Ollama) with instant health fallback.',
      icon: Cpu,
      color: 'text-cyan-400'
    },
    {
      title: 'Deep Research Studio',
      desc: 'Autonomous multi-query web crawling, source cross-referencing, and synthesis into comprehensive, cited technical whitepapers.',
      icon: Compass,
      color: 'text-indigo-400'
    },
    {
      title: 'Continuous Voice Agent',
      desc: 'Fluid, low-latency conversational voice assistance with real-time barge-in interruption and speech synthesis.',
      icon: Mic,
      color: 'text-purple-400'
    },
    {
      title: 'Multimodal File Intelligence',
      desc: 'Instant chunking, indexing, and vector similarity retrieval across PDFs, CSVs, documentation, codebases, and screenshots.',
      icon: FileText,
      color: 'text-emerald-400'
    },
    {
      title: 'Dynamic RGB Aura Engine',
      desc: 'User-calibrated living CSS illumination system with atmospheric presets (Aurora, Cyber, Ocean, Nebula) and fluid harmonic motion.',
      icon: Sparkles,
      color: 'text-pink-400'
    },
    {
      title: 'Isolated Project Workspaces',
      desc: 'Domain-specific sandboxes with custom system instructions, persistent documents, notes, and focused context retention.',
      icon: FolderKanban,
      color: 'text-amber-400'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="h-16 px-6 md:px-12 flex items-center justify-between border-b border-white/10 glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-white/20 shrink-0 bg-black/60">
            <img src="/zeno-logo.png" alt="ZENO AI NEXT" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            ZENO AI NEXT
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/app/chat')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition"
            >
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 hover:scale-105 transition"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 max-w-5xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-500/25 via-purple-600/20 to-pink-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* 4K Resolution 3D Model AI Orb at the beginning */}
        <div className="relative group cursor-grab active:cursor-grabbing transition-transform duration-300">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />
          <ZenoOrb size="4k" state="idle" interactive={true} className="drop-shadow-[0_0_50px_rgba(0,229,255,0.45)]" />
        </div>

        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 tracking-wide mb-2 shadow-lg shadow-cyan-500/10 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="font-semibold tracking-wider uppercase text-[11px] text-cyan-200 font-mono">
              Next-Gen Neural Intelligence
            </span>
            <span className="text-cyan-500/50">•</span>
            <span className="text-slate-300 text-[11px] font-medium tracking-normal">
              Unified Enterprise Workspace
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            One intelligent workspace for everything you{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              create, learn, and build.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Unifying multi-provider frontier intelligence, autonomous deep web research, sandboxed coding, generative art, and real-time voice assistance into a single cohesive environment.
          </p>
        </div>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 z-10">
          <button
            onClick={handleCTA}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <span>Start Exploring ZENO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('capabilities');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl glass-card text-xs font-semibold text-slate-300 hover:text-white hover:border-cyan-500/40 transition"
          >
            Explore Capabilities
          </button>
        </div>
      </section>

      {/* Capabilities Matrix */}
      <section id="capabilities" className="px-6 py-20 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Architected for Serious Production Workflows
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered from first principles with resilience, privacy, and technical versatility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl glass-card border border-white/10 hover:border-cyan-500/40 text-left transition group shadow-lg space-y-3"
              >
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-fit group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${cap.color}`} />
                </div>
                <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition">
                  {cap.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-slate-500 font-mono">
        <div>ZENO AI NEXT • Founded & Created by <span className="text-cyan-400 font-semibold">Shreenith Devadiga</span> • Production Cloud Architecture</div>
        <div className="text-[10px] text-slate-600 mt-1">
          OpenRouter • Google Gemini • NVIDIA NIM • OpenAI • Tavily Search
        </div>
      </footer>
    </div>
  );
};
