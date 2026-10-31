import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { MemoryItem } from '../types';
import { apiFetch } from '../lib/api';

export const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'general' | 'preference' | 'technical' | 'fact' | 'instruction'>('preference');
  const [isAdding, setIsAdding] = useState(false);

  const categories = [
    { id: 'preference', label: 'Preferences' },
    { id: 'technical', label: 'Technical Guidelines' },
    { id: 'fact', label: 'Core Facts' },
    { id: 'instruction', label: 'Custom Behavior' },
    { id: 'general', label: 'General' }
  ];

  const loadMemories = async () => {
    try {
      const data = await apiFetch('/api/memory');
      setMemories(data.memories || []);
    } catch (err) {
      console.warn('Could not load memories:', err);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleAdd = async () => {
    if (!content.trim()) return;

    try {
      await apiFetch('/api/memory', {
        method: 'POST',
        body: JSON.stringify({ content: content.trim(), category })
      });
      setContent('');
      setIsAdding(false);
      loadMemories();
    } catch (err) {
      console.error('Failed to add memory:', err);
    }
  };

  const handleToggleActive = async (mem: MemoryItem) => {
    try {
      await apiFetch(`/api/memory/${mem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !mem.is_active })
      });
      loadMemories();
    } catch {}
  };

  const handleDelete = async (memoryId: string) => {
    try {
      await apiFetch(`/api/memory/${memoryId}`, { method: 'DELETE' });
      loadMemories();
    } catch {}
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to permanently erase all memories? This cannot be undone.')) return;
    try {
      await apiFetch('/api/memory', { method: 'DELETE' });
      loadMemories();
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            <span>Personal Memory Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ZENO automatically recalls your coding habits, tone, and directives across conversations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {memories.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-medium border border-rose-500/20 transition"
            >
              Clear All Memory
            </button>
          )}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium text-xs shadow-lg shadow-purple-500/20 hover:scale-105 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Add Memory Box */}
      {isAdding && (
        <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <h3 className="font-semibold text-sm text-white">Teach ZENO a New Preference or Fact</h3>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="e.g. I prefer concise answers with clean TypeScript architecture and zero boilerplate."
            rows={2}
            className="w-full p-3.5 rounded-xl glass-input text-xs text-white focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Category:</span>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="p-2 rounded-xl glass-input text-xs text-white bg-black/60 border border-white/10"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!content.trim()}
                className="px-4 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-medium hover:bg-purple-500/30 transition disabled:opacity-50"
              >
                Save to Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Memory Items ({memories.length})
          </h3>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Zero private data leakage
          </span>
        </div>

        {memories.length === 0 ? (
          <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 space-y-3">
            <Brain className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="font-semibold text-slate-300">Memory is empty</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add explicit preferences, coding style guides, or important context. You maintain complete control to edit or delete any memory item anytime.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
            {memories.map(mem => (
              <div
                key={mem.id}
                className="p-4 flex items-center justify-between hover:bg-white/5 transition group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                  <button
                    onClick={() => handleToggleActive(mem)}
                    className="mt-0.5 text-slate-400 hover:text-white"
                    title={mem.is_active ? 'Disable memory' : 'Enable memory'}
                  >
                    {mem.is_active ? (
                      <ToggleRight className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-600" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <p className={`text-xs md:text-sm leading-relaxed ${mem.is_active ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                      {mem.content}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-purple-300 uppercase">
                        {mem.category}
                      </span>
                      <span>•</span>
                      <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(mem.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                  title="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
