import React, { useState, useEffect } from 'react';
import { ChevronDown, Cpu, Zap, Sparkles, Code2, Eye, ShieldCheck, Check } from 'lucide-react';
import { AIModel, ModelCategory } from '../../types';
import { apiFetch } from '../../lib/api';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelectModel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [activeTab, setActiveTab] = useState<ModelCategory>('auto');

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await apiFetch('/api/models');
        setModels(data.models || []);
      } catch (err) {
        console.warn('Could not load models list:', err);
      }
    };
    fetchModels();
  }, []);

  const currentModel = models.find(m => m.id === selectedModel) || {
    id: 'auto',
    name: 'ZENO Auto Router',
    provider: 'auto',
    category: 'auto' as ModelCategory,
    description: 'Dynamic intelligence matching and cascade fallback',
    speed: 'Dynamic',
    contextWindow: '128k',
    capabilities: ['multimodal', 'tools']
  };

  const tabs: { id: ModelCategory; label: string; icon: any }[] = [
    { id: 'auto', label: 'AUTO', icon: Sparkles },
    { id: 'fast', label: 'FAST', icon: Zap },
    { id: 'smart', label: 'SMART', icon: Cpu },
    { id: 'reasoning', label: 'REASONING', icon: ShieldCheck },
    { id: 'coding', label: 'CODING', icon: Code2 },
    { id: 'vision', label: 'VISION', icon: Eye },
    { id: 'free', label: 'FREE', icon: Sparkles }
  ];

  const filteredModels = models.filter(m => {
    if (activeTab === 'auto') return true;
    return m.category === activeTab;
  });

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card hover:border-cyan-500/40 text-xs font-medium text-slate-200 transition shadow-sm"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-semibold text-white">{currentModel.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 uppercase text-slate-400 font-mono">
          {currentModel.speed}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-84 sm:w-96 rounded-2xl glass-panel-elevated p-3 shadow-2xl z-50 border border-white/15 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header Tabs */}
            <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl mb-3 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Model List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredModels.map(model => {
                const isSelected = model.id === selectedModel;
                return (
                  <div
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start justify-between p-2.5 rounded-xl cursor-pointer transition border
                      ${isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-sm'
                        : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-300'
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">{model.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-cyan-400 font-mono">
                          {model.provider}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                          ⚡ {model.speed}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                          Context: {model.contextWindow}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-black" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
