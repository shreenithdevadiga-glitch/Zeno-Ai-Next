import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Download,
  Calendar,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Conversation } from '../types';
import { apiFetch } from '../lib/api';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');

  const loadConversations = async () => {
    try {
      const data = await apiFetch('/api/chat/conversations');
      setConversations(data.conversations || []);
    } catch (err) {
      console.warn('Failed to load history:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await apiFetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
      loadConversations();
    } catch {}
  };

  const handlePin = async (chat: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/chat/conversations/${chat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: !chat.pinned })
      });
      loadConversations();
    } catch {}
  };

  const filtered = conversations.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    if (filterMode === 'pinned') return matchesSearch && c.pinned;
    if (filterMode !== 'all') return matchesSearch && c.mode === filterMode;
    return matchesSearch;
  });

  // Group by date: Today, Yesterday, Previous 7 Days, Older
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const groups: { [key: string]: Conversation[] } = {
    'Today': [],
    'Yesterday': [],
    'Previous 7 Days': [],
    'Older': []
  };

  for (const c of filtered) {
    const d = new Date(c.updated_at || c.created_at);
    const dStr = d.toDateString();

    if (dStr === todayStr) {
      groups['Today'].push(c);
    } else if (dStr === yesterday) {
      groups['Yesterday'].push(c);
    } else if (d.getTime() > sevenDaysAgo) {
      groups['Previous 7 Days'].push(c);
    } else {
      groups['Older'].push(c);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Workspace Conversation History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global search, indexed history, and archives across all your chats and reasoning sessions
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search all conversations by title or keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'pinned', 'chat', 'research', 'code'].map(f => (
            <button
              key={f}
              onClick={() => setFilterMode(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium uppercase font-mono transition
                ${filterMode === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white'
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Lists */}
      <div className="space-y-6">
        {Object.entries(groups).map(([groupTitle, chats]) => {
          if (chats.length === 0) return null;
          return (
            <div key={groupTitle} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{groupTitle} ({chats.length})</span>
              </h3>

              <div className="divide-y divide-white/5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/app/chat/${chat.id}`)}
                    className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-200 group-hover:text-cyan-300 transition truncate">
                            {chat.title}
                          </h4>
                          {chat.pinned === 1 && (
                            <Pin className="w-3 h-3 text-cyan-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{chat.model}</span>
                          <span>•</span>
                          <span className="uppercase text-cyan-400">{chat.mode}</span>
                          <span>•</span>
                          <span>{new Date(chat.updated_at || chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => handlePin(chat, e)}
                        className={`p-1.5 rounded-lg transition ${chat.pinned ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                        title={chat.pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => handleDelete(chat.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center rounded-2xl glass-panel border border-white/10 space-y-2">
            <History className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-slate-300 font-medium">No matching conversations found</div>
            <p className="text-xs text-slate-500">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
