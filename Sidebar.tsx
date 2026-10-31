import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Compass,
  FolderKanban,
  FileText,
  Image as ImageIcon,
  Mic,
  Brain,
  History,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pin,
  Trash2,
  Edit2,
  MoreVertical,
  Sliders,
  Sparkles,
  Command,
  Shield,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRGB } from '../context/RGBThemeContext';
import { Conversation } from '../types';
import { apiFetch } from '../lib/api';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen, onOpenShortcuts }) => {
  const { user, logout } = useAuth();
  const { config, toggleRgb } = useRGB();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: currentChatId } = useParams<{ id?: string }>();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('zeno_sidebar_collapsed') === 'true';
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const loadConversations = async () => {
    try {
      const data = await apiFetch('/api/chat/conversations');
      setConversations(data.conversations || []);
    } catch (err) {
      console.warn('Could not load sidebar conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 12000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('zeno_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleNewChat = async () => {
    try {
      const data = await apiFetch('/api/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' })
      });
      setMobileOpen(false);
      navigate(`/app/chat/${data.conversation.id}`);
      loadConversations();
    } catch {
      navigate('/app/chat');
    }
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
    setActiveMenuId(null);
  };

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await apiFetch(`/api/chat/conversations/${chatId}`, { method: 'DELETE' });
      if (currentChatId === chatId) {
        navigate('/app/chat');
      }
      loadConversations();
    } catch {}
    setActiveMenuId(null);
  };

  const handleStartRename = (chat: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = async (chatId: string) => {
    if (!editTitle.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      await apiFetch(`/api/chat/conversations/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editTitle.trim() })
      });
      loadConversations();
    } catch {}
    setEditingChatId(null);
  };

  const navItems = [
    { label: 'Chat', to: '/app/chat', icon: MessageSquare },
    { label: 'Research', to: '/app/research', icon: Compass },
    { label: 'Projects', to: '/app/projects', icon: FolderKanban },
    { label: 'Files', to: '/app/files', icon: FileText },
    { label: 'Images', to: '/app/images', icon: ImageIcon },
    { label: 'Voice Agent', to: '/app/voice', icon: Mic },
    { label: 'Memory', to: '/app/memory', icon: Brain },
    { label: 'History', to: '/app/history', icon: History }
  ];

  const filteredChats = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter(c => c.pinned);
  const recentChats = filteredChats.filter(c => !c.pinned);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col glass-panel border-r border-white/10 transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div
            className="flex items-center gap-3 cursor-pointer select-none overflow-hidden"
            onClick={() => navigate('/app/chat')}
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-white/20 shrink-0 bg-black/60 group">
              <img
                src="/zeno-logo.png"
                alt="ZENO AI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  ZENO AI
                </span>
                <span className="text-[10px] tracking-widest text-slate-400 font-mono uppercase">
                  WORKSPACE
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action: New Chat */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-200
              ${collapsed ? 'px-0' : 'px-4'}
              bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:via-indigo-500/30 hover:to-purple-500/30
              border border-cyan-500/40 hover:border-cyan-400 text-white shadow-lg shadow-cyan-500/10 group
            `}
            title="Start New Chat"
          >
            <Plus className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform" />
            {!collapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-2 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                style={isActive ? {
                  borderColor: 'var(--zeno-border-glow)',
                  color: 'var(--zeno-accent)',
                  backgroundColor: 'var(--zeno-glow)'
                } : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'shadow-sm border'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className="w-4 h-4 transition-colors"
                  style={{ color: isActive ? 'var(--zeno-accent)' : undefined }}
                />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Separator & Search (Expanded Only) */}
        {!collapsed && (
          <div className="px-4 py-2">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-black/40 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        )}

        {/* Workspace Chat History List */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            {/* Pinned Section */}
            {pinnedChats.length > 0 && (
              <div>
                <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                  <Pin className="w-3 h-3 text-cyan-400" />
                  <span>Pinned</span>
                </div>
                <div className="space-y-0.5">
                  {pinnedChats.map(chat => renderChatItem(chat))}
                </div>
              </div>
            )}

            {/* Recents Section */}
            <div>
              <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Recent Chats
              </div>
              <div className="space-y-0.5">
                {recentChats.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500 italic">No chats yet</div>
                ) : (
                  recentChats.map(chat => renderChatItem(chat))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Spacer if collapsed */}
        {collapsed && <div className="flex-1" />}

        {/* Bottom Profile & Settings */}
        <div className="p-3 border-t border-white/10 space-y-1">
          {/* Quick RGB Toggle */}
          <button
            onClick={toggleRgb}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition
              ${collapsed ? 'justify-center px-0' : ''}
            `}
            title={`RGB Mode: ${config.mode.toUpperCase()}`}
          >
            <Sliders className={`w-4 h-4 ${config.isRgbOn ? 'text-cyan-400 animate-spin-slow' : 'text-slate-500'}`} />
            {!collapsed && (
              <span className="flex-1 text-left flex items-center justify-between">
                <span>RGB Aura</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 uppercase font-mono text-cyan-300">
                  {config.preset}
                </span>
              </span>
            )}
          </button>

          {/* Keyboard Shortcuts */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title="Keyboard Shortcuts"
            >
              <Command className="w-4 h-4 text-slate-400" />
              {!collapsed && <span>Shortcuts (Ctrl+K)</span>}
            </button>
          )}

          {/* Admin Console NavLink strictly for authorized administrators */}
          {user?.role && (user.role === 'admin' || user.role === 'super-admin') && (
            <NavLink
              to="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition
                ${location.pathname.startsWith('/admin')
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-cyan-400 hover:text-white hover:bg-white/5'
                }
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={collapsed ? 'Admin Console' : undefined}
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              {!collapsed && (
                <span className="flex-1 text-left flex items-center justify-between">
                  <span className="font-semibold text-cyan-300">Admin Console</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                    PROD
                  </span>
                </span>
              )}
            </NavLink>
          )}

          {/* Settings NavLink */}
          <NavLink
            to="/app/settings"
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition
              ${location.pathname.startsWith('/app/settings')
                ? 'bg-white/10 text-cyan-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }
              ${collapsed ? 'justify-center px-0' : ''}
            `}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="w-4 h-4" />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {/* User Profile Info */}
          <div className="pt-2 mt-1 border-t border-white/5">
            <div className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg
              ${collapsed ? 'justify-center px-0' : ''}
            `}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">
                    {user?.name || 'ZENO User'}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    {user?.plan?.toUpperCase() || 'PRO'}
                  </div>
                </div>
              )}
            </div>

            {/* Log Out Option */}
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 mt-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition group cursor-pointer ${
                collapsed ? 'justify-center px-0' : ''
              }`}
              title={collapsed ? 'Log Out' : undefined}
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  function renderChatItem(chat: Conversation) {
    const isCurrent = currentChatId === chat.id;
    const isEditing = editingChatId === chat.id;
    const isMenuOpen = activeMenuId === chat.id;

    return (
      <div
        key={chat.id}
        onClick={() => {
          if (!isEditing) {
            navigate(`/app/chat/${chat.id}`);
            setMobileOpen(false);
          }
        }}
        style={isCurrent ? {
          borderColor: 'var(--zeno-border-glow)',
          color: 'var(--zeno-accent)',
          backgroundColor: 'var(--zeno-glow)'
        } : undefined}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all duration-150
          ${isCurrent
            ? 'font-medium border shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }
        `}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare
            className="w-3.5 h-3.5 shrink-0 transition-colors"
            style={{ color: isCurrent ? 'var(--zeno-accent)' : undefined }}
          />
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              autoFocus
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => handleSaveRename(chat.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveRename(chat.id);
                if (e.key === 'Escape') setEditingChatId(null);
              }}
              onClick={e => e.stopPropagation()}
              className="w-full bg-black/50 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
            />
          ) : (
            <span className="truncate">{chat.title}</span>
          )}
        </div>

        {/* Action Button & Context Menu */}
        {!isEditing && (
          <div className="relative shrink-0">
            <button
              onClick={e => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : chat.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-white p-1 rounded hover:bg-white/10 transition"
              title="Chat actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-32 rounded-lg glass-panel-elevated py-1 shadow-2xl z-50 text-xs border border-white/15"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={e => handlePin(chat, e)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 text-left"
                >
                  <Pin className="w-3 h-3 text-cyan-400" />
                  <span>{chat.pinned ? 'Unpin' : 'Pin'}</span>
                </button>
                <button
                  onClick={e => handleStartRename(chat, e)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 text-left"
                >
                  <Edit2 className="w-3 h-3 text-indigo-400" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={e => handleDelete(chat.id, e)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-left"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};
