import React, { useState, useEffect } from 'react';
import {
  Compass,
  Code2,
  FileText,
  Image as ImageIcon,
  Mic,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ZenoOrb } from '../../components/ZenoOrb';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string, mode?: string) => void;
  onStartInteractiveAction?: (title: string, mode: string, initialQuestion: string) => void;
}

interface QuickPrompt {
  label: string;
  mode: string;
  initialQuestion: string;
}

const ALL_QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: 'What can you help me with?',
    mode: 'chat',
    initialQuestion: `👋 **Welcome to ZENO AI NEXT!**\n\nI am your unified multimodal intelligent workspace. Which capability would you like to explore today?\n\n1. **Autonomous Web Research** — Multi-source verification with live citations\n2. **Software Engineering & Architecture** — Full-stack coding, algorithms & system design\n3. **Document & Media Analysis** — Deep extraction of PPTX, PDF, Word, Excel, and images\n4. **Real-Time Meteorological Radar & Mapping** — Live weather & geospatial telemetry\n\nTell me which area you need assistance with, or ask any question directly!`
  },
  {
    label: 'Summarize recent breakthroughs in AI systems',
    mode: 'research',
    initialQuestion: `🌐 **AI Systems Breakthroughs**\n\nI can deliver an in-depth summary of recent AI breakthroughs with live verified web citations. Which specific area interests you most?\n\n• **Frontier Reasoning Models & Test-time Compute** (DeepSeek-R1, OpenAI o1/o3)\n• **Multimodal & Video Generation** (Sora, Gemini 2.0 Flash, Veo)\n• **Autonomous Coding & Agentic Workflows**\n• **Open Weights Ecosystem & Efficient Quantization**\n\nLet me know your focus, or reply **'all'** for a comprehensive cross-domain brief!`
  },
  {
    label: 'Write a Python script for high-throughput concurrency',
    mode: 'code',
    initialQuestion: `⚡ **Python Concurrency Engine**\n\nI can architect a production-ready high-throughput concurrency solution for your workload. Which pattern fits your use case?\n\n• **Asyncio Event Loop** (high-volume network I/O, WebSockets, or HTTP requests)\n• **Multiprocessing / ProcessPoolExecutor** (CPU-heavy mathematical or data computation)\n• **ThreadPoolExecutor with Thread-Safe Queues** (hybrid blocking I/O tasks)\n\nLet me know your target workload and any specific libraries you prefer!`
  },
  {
    label: 'Explain quantum computing principles with clear analogies',
    mode: 'chat',
    initialQuestion: `⚛️ **Quantum Computing Principles**\n\nQuantum mechanics introduces fascinating paradigms! Which concept would you like to master first?\n\n• **Superposition & Qubits** (how quantum bits differ from classical bits)\n• **Quantum Entanglement** (Einstein's 'spooky action at a distance')\n• **Quantum Algorithms & Cryptography** (Shor's and Grover's algorithms)\n\nTell me which one you want to explore, or what level of depth you'd prefer!`
  },
  {
    label: 'Who won the latest IPL and Cricket World Cup finals?',
    mode: 'research',
    initialQuestion: `🏏 **Live Sports Intelligence via Tavily**\n\nI can fetch real-time live match results, scorecards, championship summaries, and tournament records. Which tournament or team would you like verified live coverage for?`
  },
  {
    label: 'Design a scalable microservices architecture in Go',
    mode: 'code',
    initialQuestion: `🚀 **Go Cloud-Native Microservices**\n\nI can architect a low-latency, resilient Go service layout. Are you targeting gRPC or REST APIs, and what message broker (Kafka, RabbitMQ, Redis) would you like to use?`
  },
  {
    label: 'Investigate commercial nuclear fusion timeline & milestones',
    mode: 'research',
    initialQuestion: `☀️ **Commercial Fusion Energy Research**\n\nI will scan global scientific indices and public energy records on magnetic confinement (Tokamak, Stellarator) and inertial fusion. Which reactor facility or milestone shall we analyze?`
  },
  {
    label: 'Build a full-stack React + TypeScript dashboard component',
    mode: 'code',
    initialQuestion: `🎨 **Frontend Engineering Studio**\n\nLet's design a high-performance modern React component with Tailwind CSS, animated telemetry, and real-time data hooks. What metrics or controls should it feature?`
  },
  {
    label: 'What is the current price and market trend for Bitcoin?',
    mode: 'research',
    initialQuestion: `📈 **Financial & Crypto Live Telemetry**\n\nFetching live market capitalization, price action, macroeconomic context, and ETF inflows via real-time web intelligence. Would you like a technical or fundamental overview?`
  },
  {
    label: 'Compare Rust vs Zig for high-performance systems engineering',
    mode: 'chat',
    initialQuestion: `🦀 **Systems Language Deep Dive**\n\nBoth Rust and Zig offer remarkable zero-cost abstractions and memory control without garbage collection. Would you like to compare memory safety models, compile times, or C-interop?`
  },
  {
    label: 'Explain the mathematics behind transformer self-attention',
    mode: 'chat',
    initialQuestion: `📐 **Attention Mechanism Mathematics**\n\nFrom Query, Key, and Value dot-products to scaled softmax normalization and multi-head projection matrices. Would you like the formal KaTeX mathematical derivation or an intuitive walkthrough?`
  },
  {
    label: 'Audit a smart contract or API endpoint for security flaws',
    mode: 'code',
    initialQuestion: `🛡️ **Security & Vulnerability Audit**\n\nPaste your Solidity smart contract, Express/Go middleware, or API route logic. I will perform an in-depth security audit checking for reentrancy, IDOR, SSRF, and auth bypasses.`
  },
  {
    label: 'What are the newest discoveries from the James Webb Telescope?',
    mode: 'research',
    initialQuestion: `🔭 **Deep Space Astronomical Discoveries**\n\nI will harvest NASA and ESA research papers on JWST deep-field observations, exoplanet atmospheres, and high-redshift early galaxies. Any specific celestial target?`
  },
  {
    label: 'Create an optimal PostgreSQL indexing strategy for high writes',
    mode: 'code',
    initialQuestion: `🗄️ **Database Performance Engineering**\n\nLet's optimize your PostgreSQL schema. Tell me about your write patterns, table sizes, and query filters. We can explore BRIN, B-Tree, partial indexes, and HOT update tuning.`
  },
  {
    label: 'Synthesize the pros & cons of Solid-State Batteries',
    mode: 'research',
    initialQuestion: `🔋 **Battery Technology Whitepaper**\n\nResearching ceramic vs polymer solid electrolytes, energy density targets (450+ Wh/kg), and EV manufacturing roadmaps across Toyota, QuantumScape, and CATL.`
  },
  {
    label: 'Write an asynchronous web scraper with rate-limiting in Python',
    mode: 'code',
    initialQuestion: `🕷️ **Asynchronous Web Crawler**\n\nLet's build a robust crawler using httpx/aiohttp, asyncio semaphores for rate limiting, and exponential backoff retry policies. What target site structure are you scraping?`
  }
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt, onStartInteractiveAction }) => {
  // Randomly select 4 prompts whenever EmptyState mounts or user clicks shuffle
  const [activePrompts, setActivePrompts] = useState<QuickPrompt[]>(() => {
    return [...ALL_QUICK_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 4);
  });

  const shufflePrompts = () => {
    setActivePrompts([...ALL_QUICK_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 4));
  };
  const actions = [
    {
      title: 'Deep Research',
      desc: 'Investigate complex questions with multi-source verification and citations',
      icon: Compass,
      color: 'text-cyan-400',
      mode: 'research',
      initialQuestion: `🔬 **Deep Research Mode Active**\n\nWhat specific topic, breakthrough, company, or technical question would you like me to investigate for you with verified live web citations?\n\n*Feel free to mention any specific timeframes, benchmarks, or target URLs you want investigated.*`
    },
    {
      title: 'Coding & Architecture',
      desc: 'Build full-stack components, design databases, and write production scripts',
      icon: Code2,
      color: 'text-emerald-400',
      mode: 'code',
      initialQuestion: `💻 **Coding & Architecture Studio Active**\n\nWhat system, feature, or algorithm would you like to build or optimize?\n\n*Tell me about your tech stack (e.g., TypeScript, Python, Go, Rust), architecture requirements, or paste existing code to inspect.*`
    },
    {
      title: 'Document Analysis',
      desc: 'Extract key findings, summarize PDFs, or cross-examine contracts and data',
      icon: FileText,
      color: 'text-indigo-400',
      mode: 'analyze',
      initialQuestion: `📄 **Document & Media Analysis Active**\n\nWhich document, spreadsheet, presentation, or image would you like me to analyze? Please attach your file using the paperclip button below or tell me its name.\n\n*What specific data tables, slide summaries, or insights should I extract for you?*`
    },
    {
      title: 'Image Generation',
      desc: 'Craft hyper-detailed concept art, UI mocks, and cinematic scenes',
      icon: ImageIcon,
      color: 'text-pink-400',
      mode: 'image',
      initialQuestion: `🎨 **Generative Visual Studio Active**\n\nWhat visual concept or image would you like to create?\n\n*Describe the subject, artistic style (e.g. photorealistic 8K, cinematic 3D, cyberpunk render), composition, lighting, and aspect ratio.*`
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-4xl mx-auto w-full text-center">
      {/* 4K 3D Model Orb at the beginning of chat */}
      <div className="mb-6 relative group cursor-grab active:cursor-grabbing">
        <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition duration-300 pointer-events-none" />
        <ZenoOrb size="lg" state="idle" interactive={true} className="drop-shadow-[0_0_35px_rgba(0,229,255,0.4)]" />
      </div>

      <div className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            ZENO AI NEXT
          </span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
          Your Intelligent Multimodal Workspace for conversation, research, engineering, and creation.
        </p>
      </div>

      {/* Suggested Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div
              key={idx}
              onClick={() => {
                if (onStartInteractiveAction) {
                  onStartInteractiveAction(act.title, act.mode, act.initialQuestion);
                } else {
                  onSelectPrompt(act.title, act.mode);
                }
              }}
              className="flex items-start gap-3.5 p-4 rounded-2xl glass-card text-left cursor-pointer group hover:border-cyan-500/40 transition"
            >
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 group-hover:scale-110 transition-transform">
                <Icon className={`w-5 h-5 ${act.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-200 group-hover:text-cyan-300 transition">
                    {act.title}
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {act.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Prompts Pills with Dynamic Randomization */}
      <div className="space-y-2 max-w-2xl w-full">
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="font-medium">Suggested Inquiries</span>
          <button
            type="button"
            onClick={shufflePrompts}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
            title="Roll new randomized prompt ideas"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Shuffle Topics</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {activePrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (onStartInteractiveAction) {
                  onStartInteractiveAction(qp.label, qp.mode, qp.initialQuestion);
                } else {
                  onSelectPrompt(qp.label, qp.mode);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              "{qp.label}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
