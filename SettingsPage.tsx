import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Sliders,
  Cpu,
  Shield,
  Activity,
  Key,
  Check,
  AlertCircle,
  Database,
  Info,
  Lock,
  RefreshCw,
  Sparkles,
  Zap,
  Gauge,
  Radio,
  Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRGB } from '../context/RGBThemeContext';
import { RGBPreset } from '../types';
import { apiFetch } from '../lib/api';

/**
 * Real-time 60fps Luminescence Waveform Visualizer
 * Reacts directly to current activeHue, intensity, velocity, and mode
 */
const LuminescenceVisualizer: React.FC<{
  hue: number;
  intensity: number;
  speed: number;
  mode: string;
  isRgbOn: boolean;
}> = ({ hue, intensity, speed, mode, isRgbOn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!isRgbOn || mode === 'off') {
        // Flat minimal slate line for minimal mode
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }

      phase += 0.035 * speed;

      // Draw 3 layered harmonic sine waves with volumetric neon glow
      const waveConfigs = [
        { freq: 0.012, amp: 26 * intensity, alpha: 0.90, offset: 0, lineWidth: 2.5, hueShift: 0 },
        { freq: 0.018, amp: 18 * intensity, alpha: 0.60, offset: Math.PI / 3, lineWidth: 1.8, hueShift: 40 },
        { freq: 0.008, amp: 32 * intensity, alpha: 0.35, offset: Math.PI / 1.5, lineWidth: 1.2, hueShift: 80 }
      ];

      waveConfigs.forEach(w => {
        const currentWaveHue = (hue + w.hueShift) % 360;
        ctx.beginPath();
        ctx.shadowBlur = 18 * intensity;
        ctx.shadowColor = `hsla(${currentWaveHue}, 95%, 60%, ${w.alpha})`;
        ctx.strokeStyle = `hsla(${currentWaveHue}, 90%, 65%, ${w.alpha})`;
        ctx.lineWidth = w.lineWidth;

        for (let x = 0; x <= width; x += 3) {
          const y = height / 2 + Math.sin(x * w.freq + phase + w.offset) * w.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [hue, intensity, speed, mode, isRgbOn]);

  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center p-2 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={800}
        height={144}
        className="w-full h-full object-cover"
      />
      {/* Background ambient focal bloom inside visualizer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 transition-colors duration-300"
        style={{
          background: isRgbOn && mode !== 'off'
            ? `radial-gradient(ellipse at 50% 50%, hsla(${hue}, 95%, 55%, ${0.40 * intensity}), transparent 75%)`
            : 'none'
        }}
      />
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { config, activeHue, setPreset, setMode, setIntensity, setSpeed, setAccentColor, toggleRgb, presets } = useRGB();

  const [activeTab, setActiveTab] = useState<'account' | 'rgb' | 'providers' | 'usage' | 'audit' | 'about'>('rgb');
  const [displayName, setDisplayName] = useState(user?.profile?.display_name || user?.name || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Providers Config State
  const [providerData, setProviderData] = useState<any>(null);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [providerKeyInput, setProviderKeyInput] = useState('');
  const [providerBaseUrlInput, setProviderBaseUrlInput] = useState('');
  const [providerSuccessMsg, setProviderSuccessMsg] = useState<string | null>(null);

  // Usage State
  const [usageStats, setUsageStats] = useState<any>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Health Test State
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [testingHealth, setTestingHealth] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUsage();
    loadAudit();
    handleTestProviders();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiFetch('/api/settings');
      setProviderData(data.providers);
    } catch (err) {
      console.warn('Could not load settings:', err);
    }
  };

  const loadUsage = async () => {
    try {
      const data = await apiFetch('/api/settings/usage');
      setUsageStats(data.usage);
    } catch {}
  };

  const loadAudit = async () => {
    try {
      const data = await apiFetch('/api/settings/audit-logs');
      setAuditLogs(data.auditLogs || []);
    } catch {}
  };

  const handleTestProviders = async () => {
    setTestingHealth(true);
    try {
      const data = await apiFetch('/api/models/health');
      setHealthStatus(data.health);
    } catch {}
    setTestingHealth(false);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateProfile({ display_name: displayName, bio });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch {}
    setIsSavingProfile(false);
  };

  const handleSaveProviderKey = async (provider: string) => {
    if (!providerKeyInput.trim()) return;

    try {
      await apiFetch('/api/settings/providers', {
        method: 'PUT',
        body: JSON.stringify({
          provider,
          apiKey: providerKeyInput.trim(),
          baseUrl: providerBaseUrlInput.trim() || undefined
        })
      });

      setProviderSuccessMsg(`Configuration persisted and live for ${provider.toUpperCase()}`);
      setTimeout(() => setProviderSuccessMsg(null), 3000);
      setEditingProvider(null);
      setProviderKeyInput('');
      setProviderBaseUrlInput('');
      loadSettings();
      handleTestProviders();
      loadAudit();
    } catch (err: any) {
      alert(`Error updating key: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings
            className="w-6 h-6 transition-colors"
            style={{ color: 'var(--zeno-accent)' }}
          />
          <span>ZENO System Settings & Calibration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your RGB Aura theme engine, provider keys, cognitive parameters, and telemetry
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 overflow-x-auto">
        {[
          { id: 'rgb', label: 'RGB Aura Engine', icon: Sliders },
          { id: 'providers', label: 'AI Providers & Keys', icon: Cpu },
          { id: 'account', label: 'Account Profile', icon: User },
          { id: 'usage', label: 'Usage & Quota', icon: Activity },
          { id: 'audit', label: 'Security & Audit', icon: Shield },
          { id: 'about', label: 'About ZENO', icon: Info }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={isActive ? {
                backgroundColor: 'var(--zeno-glow)',
                color: 'var(--zeno-accent)',
                borderColor: 'var(--zeno-border-glow)'
              } : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap
                ${isActive
                  ? 'border shadow-sm'
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RGB THEME ENGINE */}
      {activeTab === 'rgb' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Sparkles
                    className="w-4 h-4 transition-colors"
                    style={{ color: 'var(--zeno-accent)' }}
                  />
                  <span>Dynamic RGB Illumination Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time CSS variable synthesis driving ambient glow, animated gradient borders, and reactive lighting
                </p>
              </div>
              <button
                onClick={toggleRgb}
                style={config.isRgbOn ? {
                  backgroundColor: 'var(--zeno-glow)',
                  borderColor: 'var(--zeno-border-glow)',
                  color: 'var(--zeno-accent)',
                  boxShadow: '0 0 20px var(--zeno-glow)'
                } : undefined}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition uppercase
                  ${config.isRgbOn
                    ? 'border shadow-lg'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                  }
                `}
              >
                RGB {config.isRgbOn ? 'Active (ON)' : 'Disabled (OFF)'}
              </button>
            </div>

            {/* LIVE 60FPS WAVEFORM VISUALIZER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Real-Time Luminescence Matrix & Waveform</span>
                </span>
                <span className="font-mono text-[11px]" style={{ color: 'var(--zeno-accent)' }}>
                  Active Hue: {activeHue}° • Velocity: {config.speed.toFixed(1)}x
                </span>
              </div>

              <LuminescenceVisualizer
                hue={activeHue}
                intensity={config.intensity}
                speed={config.speed}
                mode={config.mode}
                isRgbOn={config.isRgbOn}
              />

              {/* Dynamic Telemetry Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase">Engine Status</div>
                  <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--zeno-accent)' }}>
                    <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--zeno-accent)' }} />
                    <span>{!config.isRgbOn || config.mode === 'off' ? 'MUTED (OFF)' : config.mode === 'dynamic' ? 'SPECTRUM (60 FPS)' : 'CHROMA LOCK'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase">Active Preset</div>
                  <div className="font-bold text-white uppercase">{presets[config.preset]?.name || config.preset}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase">Flux Lumens</div>
                  <div className="font-bold text-cyan-300">{Math.round(config.intensity * 100)}% Saturation</div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase">Period Cycle</div>
                  <div className="font-bold text-purple-300">{(14 / config.speed).toFixed(1)}s Velocity</div>
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Atmospheric Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(presets).map(([key, val]) => {
                  const isSelected = config.preset === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setPreset(key as RGBPreset)}
                      style={isSelected ? {
                        borderColor: 'var(--zeno-accent)',
                        backgroundColor: 'var(--zeno-glow)',
                        boxShadow: '0 0 20px var(--zeno-glow)'
                      } : undefined}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 relative overflow-hidden group
                        ${isSelected
                          ? 'text-white'
                          : 'border-white/10 bg-white/5 hover:border-white/20 text-slate-300 hover:bg-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs">{val.name}</span>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: val.accent }}
                          />
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-white/10 opacity-70"
                            style={{ backgroundColor: val.accent2 }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {val.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mode: Dynamic vs Static vs Off */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Lighting Evolution Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dynamic', label: 'Dynamic Spectrum', desc: 'Slow continuous 60fps RGB aura morph' },
                  { id: 'static', label: 'Static Chroma', desc: 'Locked accent color with soft ambient glow' },
                  { id: 'off', label: 'Pure Dark Minimal', desc: 'Monochrome slate without RGB animation' }
                ].map(m => {
                  const isModeActive = config.mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as any)}
                      style={isModeActive ? {
                        borderColor: 'var(--zeno-border-glow)',
                        backgroundColor: 'var(--zeno-glow)',
                        color: 'var(--zeno-accent)',
                        boxShadow: '0 0 16px var(--zeno-glow)'
                      } : undefined}
                      className={`p-3 rounded-xl border text-left transition
                        ${isModeActive
                          ? 'shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <div className="font-bold text-xs">{m.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intensity & Speed Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Glow Lumens Intensity</span>
                  </span>
                  <span className="font-mono" style={{ color: 'var(--zeno-accent)' }}>
                    {Math.round(config.intensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={config.intensity}
                  onChange={e => setIntensity(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10% (Subtle)</span>
                  <span>50% (Standard)</span>
                  <span>100% (High Flux)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-purple-400" />
                    <span>Cycle Animation Velocity</span>
                  </span>
                  <span className="font-mono" style={{ color: 'var(--zeno-accent)' }}>
                    {config.speed.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={config.speed}
                  onChange={e => setSpeed(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.5x (Slow Drift)</span>
                  <span>1.0x (Harmonic)</span>
                  <span>3.0x (High Velocity)</span>
                </div>
              </div>
            </div>

            {/* LIVE SURFACE CALIBRATION VERIFICATION */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Surface Illumination Diagnostics</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className="p-3.5 rounded-xl border transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--zeno-glow)',
                    borderColor: 'var(--zeno-border-glow)',
                    boxShadow: '0 0 20px var(--zeno-glow)'
                  }}
                >
                  <div className="text-[10px] uppercase font-mono text-slate-300">Ambient Glow Box</div>
                  <div className="font-bold text-xs text-white mt-1">Reactive Radiance</div>
                </div>

                <div className="p-3.5 rounded-xl rgb-border bg-black/40 text-center flex flex-col justify-center items-center">
                  <div className="text-[10px] uppercase font-mono text-slate-400">RGB Animated Border</div>
                  <div className="font-bold text-xs text-zeno-glow mt-1">Gradient Mesh</div>
                </div>

                <div className="p-3.5 rounded-xl glass-card flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Glass Elevation</div>
                  <div className="font-bold text-xs text-white mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--zeno-accent)' }} />
                    <span>Volumetric Light</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI PROVIDERS & KEYS */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-bold text-base text-white">Multi-Provider AI Gateway</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure real provider keys. Keys are persisted to .env and never exposed unmasked.
                </p>
              </div>
              <button
                onClick={handleTestProviders}
                disabled={testingHealth}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-card text-xs text-cyan-300 hover:border-cyan-500/40 transition font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin' : ''}`} />
                <span>Test Live Connection</span>
              </button>
            </div>

            {providerSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{providerSuccessMsg}</span>
              </div>
            )}

            {/* Provider Cards */}
            <div className="space-y-3">
              {[
                { id: 'openrouter', name: 'OpenRouter Cloud Router', desc: 'Access 100+ frontier & open-weight models including GPT-5.4, Claude 3.5, and DeepSeek R1', keyProp: providerData?.openrouter },
                { id: 'gemini', name: 'Google Gemini', desc: 'Direct ultra-fast access to Gemini Flash Lite and Gemini Pro', keyProp: providerData?.gemini },
                { id: 'nvidia', name: 'NVIDIA NIM High Speed', desc: 'Accelerated low-latency models including Llama 3.1 Nemotron 70B', keyProp: providerData?.nvidia },
                { id: 'pollinations', name: 'Pollinations Flux Creative Engine', desc: 'Accelerated high-resolution image synthesis using Flux 1.0 architecture', keyProp: providerData?.pollinations },
                { id: 'tavily', name: 'Tavily Deep Search', desc: 'Live factual web crawling and source evidence extraction', keyProp: providerData?.tavily },
                { id: 'google_maps', name: 'Google Weather & Maps API', desc: 'Google Cloud Geocoding, satellite mapping embeds, and live geospatial radar', keyProp: providerData?.google_maps },
                { id: 'openai', name: 'OpenAI / Custom Endpoint', desc: 'Standard OpenAI or local Ollama endpoints (e.g. http://localhost:11434/v1)', keyProp: providerData?.openai }
              ].map(p => {
                const isEditing = editingProvider === p.id;
                const isConfigured = p.keyProp?.configured;
                const health = healthStatus?.[p.id];

                return (
                  <div key={p.id} className="p-4 rounded-xl glass-card border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{p.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase border
                            ${isConfigured
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            }
                          `}>
                            {isConfigured ? 'Configured' : 'Needs Key'}
                          </span>
                          {health && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono flex items-center gap-1
                              ${health.ok ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}
                            `}>
                              <span className={`w-1.5 h-1.5 rounded-full ${health.ok ? 'bg-cyan-400' : 'bg-rose-400'}`} />
                              <span>{health.ok ? '200 OK' : 'Offline'}</span>
                              {health.latencyMs !== undefined && <span>• {health.latencyMs}ms</span>}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{p.desc}</p>
                      </div>

                      <button
                        onClick={() => {
                          setEditingProvider(isEditing ? null : p.id);
                          setProviderKeyInput('');
                          setProviderBaseUrlInput(p.keyProp?.baseUrl || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition"
                      >
                        {isEditing ? 'Cancel' : (isConfigured ? 'Update Key' : 'Configure')}
                      </button>
                    </div>

                    {/* Masked Key Display */}
                    {!isEditing && isConfigured && (
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Key: {p.keyProp.maskedKey}</span>
                        {p.keyProp.baseUrl && <span>• Base: {p.keyProp.baseUrl}</span>}
                      </div>
                    )}

                    {/* Edit Key Form */}
                    {isEditing && (
                      <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3 animate-in fade-in duration-150">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            API Secret Key
                          </label>
                          <input
                            type="password"
                            value={providerKeyInput}
                            onChange={e => setProviderKeyInput(e.target.value)}
                            placeholder={`Enter ${p.name} API Key...`}
                            className="w-full p-2.5 rounded-xl glass-input text-xs text-white focus:outline-none font-mono"
                          />
                        </div>

                        {p.id === 'openai' && (
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              Custom Base URL (optional for Ollama or Local vLLM)
                            </label>
                            <input
                              type="text"
                              value={providerBaseUrlInput}
                              onChange={e => setProviderBaseUrlInput(e.target.value)}
                              placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                              className="w-full p-2.5 rounded-xl glass-input text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditingProvider(null)}
                            className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveProviderKey(p.id)}
                            disabled={!providerKeyInput.trim()}
                            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition disabled:opacity-50"
                          >
                            Save Key
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNT PROFILE */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-5">
            <h3 className="font-bold text-base text-white border-b border-white/10 pb-3">
              User Profile & Directives
            </h3>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Profile preferences updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-2.5 rounded-xl glass-input text-xs text-slate-400 bg-white/5 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Bio / Architectural Role
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={2}
                placeholder="e.g. Lead Systems Engineer & AI Architect"
                className="w-full p-2.5 rounded-xl glass-input text-xs text-white focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium hover:bg-rose-500/20 transition"
              >
                Log Out of Session
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USAGE DASHBOARD */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Platform Telemetry & Usage Analytics</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time counts directly recorded in the native SQLite database</p>
              </div>
              <button
                onClick={loadUsage}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl glass-card text-xs text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Conversations', count: usageStats?.conversations ?? 0, desc: 'Active chat sessions' },
                { label: 'Messages', count: usageStats?.messages ?? 0, desc: 'Processed prompt exchanges' },
                { label: 'Files Indexed', count: usageStats?.files ?? 0, desc: 'Documents chunked into RAG' },
                { label: 'Images Synthesized', count: usageStats?.images ?? 0, desc: 'Generative renders' },
                { label: 'Memory Directives', count: usageStats?.memories ?? 0, desc: 'Retained personal preferences' },
                { label: 'Research Inquiries', count: usageStats?.researchOperations ?? 0, desc: 'Deep multi-agent studies' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl glass-card border border-white/10 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </span>
                  <div className="text-2xl font-extrabold text-cyan-400 font-mono">
                    {item.count}
                  </div>
                  <p className="text-[10px] text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & AUDIT */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Immutable Security Audit Log</h3>
                <p className="text-xs text-slate-400">
                  Monitors authentication requests, rate limits, provider key operations, and compliance events
                </p>
              </div>
              <button
                onClick={loadAudit}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl glass-card text-xs text-cyan-300 hover:text-cyan-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>

            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-black/40">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No security audit logs found.</div>
              ) : (
                auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 text-xs flex items-center justify-between font-mono hover:bg-white/5 transition">
                    <div className="space-y-0.5">
                      <span className="text-cyan-400 font-bold">{log.action}</span>
                      <div className="text-[10px] text-slate-400">
                        Resource: {log.resource_type} • IP: {log.ip_address || '127.0.0.1'}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ABOUT */}
      {activeTab === 'about' && (
        <div className="rounded-2xl glass-panel-elevated p-6 border border-white/15 space-y-4 text-xs leading-relaxed text-slate-300">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">About ZENO AI NEXT</h3>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px]">
              v2.0.0-PROD
            </span>
          </div>
          <p>
            <strong>ZENO AI NEXT</strong> is a high-performance, multimodal AI workspace conceived, engineered, and founded by <strong className="text-cyan-400">Shreenith Devadiga</strong> for developers, researchers, and creators.
            Designed around an intelligent provider-agnostic router, it guarantees cascading fallback across OpenAI, Anthropic, Google Gemini, NVIDIA NIM, and local endpoints.
          </p>
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono space-y-1 text-slate-400">
            <div>Founder & Creator: <span className="text-cyan-400 font-semibold">Shreenith Devadiga</span></div>
            <div>Version: 2.0.0-PROD (Enterprise Release)</div>
            <div>Core Engine: Node 24 Native Multi-Adapter (PostgreSQL + SQLite WAL) + React 19 SPA</div>
            <div>Security: PBKDF2 (SHA-512) Hashing, SSRF Guard, Isolated Process Sandbox, Strict CSP</div>
            <div>Illumination: 60 FPS Dynamic Spectrum RGB Aura Synthesis</div>
          </div>
        </div>
      )}
    </div>
  );
};
