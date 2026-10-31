import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Command, X, Plus, Search, Mic, Sliders, Moon } from 'lucide-react';
import { useRGB } from '../context/RGBThemeContext';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleRgb } = useRGB();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K = Shortcuts Modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
      }

      // Ctrl+N / Cmd+N = New Chat
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/app/chat');
      }

      // Ctrl+Shift+R = Quick RGB Toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        toggleRgb();
      }

      // Escape = Close Modals
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleRgb]);

  const shortcuts = [
    { keys: ['Ctrl', 'N'], desc: 'Create a New Chat' },
    { keys: ['Ctrl', 'K'], desc: 'Open Command / Shortcuts Dialog' },
    { keys: ['Enter'], desc: 'Send Message in Composer' },
    { keys: ['Shift', 'Enter'], desc: 'Insert Newline in Composer' },
    { keys: ['Ctrl', 'Shift', 'R'], desc: 'Toggle RGB Aura Lighting' },
    { keys: ['Esc'], desc: 'Dismiss Active Overlay / Dialog' }
  ];

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#07080b]">
      {/* Dynamic Ambient Atmospheric RGB Illumination Layers */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
        {/* Top-Right Ambient Nebula */}
        <div
          className="absolute -top-36 -right-36 w-[640px] h-[640px] rounded-full blur-[140px] opacity-75 transition-all duration-700 will-change-transform"
          style={{
            background: 'radial-gradient(circle, var(--zeno-glow-intense) 0%, var(--zeno-glow) 50%, transparent 80%)'
          }}
        />
        {/* Bottom-Left Ambient Glow */}
        <div
          className="absolute -bottom-48 -left-48 w-[680px] h-[680px] rounded-full blur-[160px] opacity-65 transition-all duration-700 will-change-transform"
          style={{
            background: 'radial-gradient(circle, var(--zeno-accent-2) 0%, var(--zeno-glow) 45%, transparent 75%)'
          }}
        />
        {/* Center atmospheric mist */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] rounded-full blur-[180px] opacity-25 transition-all duration-1000 will-change-transform"
          style={{
            background: 'radial-gradient(ellipse, var(--zeno-accent-3) 0%, transparent 70%)'
          }}
        />
        {/* Subtle Futuristic Grid Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_60%,transparent_100%)] opacity-35" />
      </div>

      {/* Collapsible Left Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* Main Content View Container */}
      <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden lg:pl-72 transition-all duration-300">
        <Outlet context={{ onToggleMobileSidebar: () => setMobileOpen(true) }} />
      </div>

      {/* Keyboard Shortcuts Dialog Modal */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Command className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Keyboard Shortcuts & Commands</h3>
              </div>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="text-slate-400 hover:text-white px-2 py-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {shortcuts.map((sc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-300">{sc.desc}</span>
                  <div className="flex items-center gap-1 font-mono">
                    {sc.keys.map((k, kIdx) => (
                      <kbd key={kIdx} className="px-2 py-0.5 rounded bg-black/60 border border-white/15 text-[11px] text-cyan-300 shadow-sm">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center text-[11px] text-slate-500 font-mono">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">Esc</kbd> anytime to dismiss
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
