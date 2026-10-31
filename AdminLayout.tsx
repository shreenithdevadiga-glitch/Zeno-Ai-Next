import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  LogIn,
  KeyRound,
  ShieldAlert,
  FileText,
  Brain,
  Cpu,
  Layers,
  Activity,
  HardDrive,
  Sliders,
  Flag,
  Bell,
  RefreshCw,
  ArrowLeft,
  Search,
  CheckCircle2,
  Shield,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRGB } from '../../context/RGBThemeContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { config } = useRGB();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/admin/dashboard', label: 'SaaS Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'USERS & AUTHENTICATION',
      items: [
        { to: '/admin/users', label: 'User Directory', icon: Users },
        { to: '/admin/auth-audits', label: 'Logins & Sessions', icon: LogIn },
        { to: '/admin/audit-logs', label: 'System Audit Logs', icon: FileText }
      ]
    },
    {
      title: 'AI & INTELLIGENCE',
      items: [
        { to: '/admin/ai-analytics', label: 'AI Token Analytics', icon: Brain },
        { to: '/admin/providers-models', label: 'Providers & Models', icon: Cpu },
        { to: '/admin/rag-diagnostics', label: 'Hybrid RAG Engine', icon: Layers }
      ]
    },
    {
      title: 'CONTENT & STORAGE',
      items: [
        { to: '/admin/content', label: 'Conversations & Files', icon: HardDrive }
      ]
    },
    {
      title: 'SECURITY & OPS',
      items: [
        { to: '/admin/security', label: 'Security Center', icon: ShieldAlert },
        { to: '/admin/jobs', label: 'Job Queues & Sandbox', icon: Activity }
      ]
    },
    {
      title: 'SAAS & INFRASTRUCTURE',
      items: [
        { to: '/admin/saas-system', label: 'Plans, Flags & Health', icon: Sliders }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#06070a] text-slate-100 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#090b10] border-r border-white/10 flex flex-col transition-transform duration-200 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-white/20 shrink-0 bg-black/60">
              <img src="/zeno-logo.png" alt="ZENO AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>ZENO ADMIN</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-semibold">
                  PROD
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Control Center v2.0</div>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 font-mono uppercase">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-medium
                      ${isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Return to App & User Pill */}
        <div className="p-3 border-t border-white/10 space-y-2 bg-[#07090d]">
          <button
            onClick={() => navigate('/app/chat')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Return to Workspace</span>
          </button>

          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs text-rose-300 hover:text-rose-200 transition font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out of Admin</span>
          </button>

          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{user?.name || 'Admin'}</div>
                <div className="text-[10px] text-cyan-400 font-mono uppercase truncate">{user?.role || 'admin'}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Operational Bar */}
        <header className="h-16 px-4 md:px-6 border-b border-white/10 bg-[#080a0f]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 hidden sm:inline font-medium">LIVE PLATFORM TELEMETRY</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Role: <strong className="text-cyan-400 uppercase">{user?.role || 'admin'}</strong></span>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
              title="Refresh Real-time Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Sign Out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#06070a]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
