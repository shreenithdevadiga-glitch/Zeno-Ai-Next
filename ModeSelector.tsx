import React, { useState } from 'react';
import {
  ChevronDown,
  MessageSquare,
  Search,
  Sparkles,
  Code2,
  Palette,
  Image as ImageIcon,
  Mic,
  GraduationCap,
  LineChart,
  PenTool
} from 'lucide-react';
import { AIMode } from '../../types';

interface ModeSelectorProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const modes: { id: AIMode; label: string; icon: any; color: string; desc: string }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-cyan-400', desc: 'Standard interactive conversation & general inquiries' },
    { id: 'research', label: 'Research', icon: Search, color: 'text-indigo-400', desc: 'Live web search with factual citation links' },
    { id: 'deep_research', label: 'Deep Research', icon: Sparkles, color: 'text-purple-400', desc: 'Multi-vector whitepaper synthesis and evidence ranking' },
    { id: 'code', label: 'Code', icon: Code2, color: 'text-emerald-400', desc: 'Engineering architecture, syntax generation & refactoring' },
    { id: 'create', label: 'Create', icon: Palette, color: 'text-pink-400', desc: 'Brainstorming, storytelling & concept development' },
    { id: 'image', label: 'Image Studio', icon: ImageIcon, color: 'text-rose-400', desc: 'Generative image generation, prompt tuning & styles' },
    { id: 'voice', label: 'Voice Agent', icon: Mic, color: 'text-cyan-400', desc: 'Real-time conversational voice assistance' },
    { id: 'study', label: 'Study & Learn', icon: GraduationCap, color: 'text-amber-400', desc: 'Deep concept breakdowns, flashcards & quizzes' },
    { id: 'analyze', label: 'Analyze', icon: LineChart, color: 'text-blue-400', desc: 'Data breakdown, document comparison & extraction' },
    { id: 'write', label: 'Write', icon: PenTool, color: 'text-teal-400', desc: 'Polished prose, essays, reports & documentation' }
  ];

  const active = modes.find(m => m.id === currentMode) || modes[0];
  const ActiveIcon = active.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card hover:border-cyan-500/40 text-xs font-medium text-slate-200 transition shadow-sm"
      >
        <ActiveIcon className={`w-3.5 h-3.5 ${active.color}`} />
        <span className="font-semibold">{active.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl glass-panel-elevated p-2 shadow-2xl z-50 border border-white/15 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 tracking-wider uppercase">
              AI Operational Mode
            </div>
            <div className="space-y-1">
              {modes.map(mode => {
                const Icon = mode.icon;
                const isSelected = mode.id === currentMode;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onSelectMode(mode.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2 rounded-xl text-left transition
                      ${isSelected
                        ? 'bg-cyan-500/20 text-white border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${mode.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{mode.label}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{mode.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
