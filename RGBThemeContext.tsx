import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { RGBPreset, RGBThemeConfig } from '../types';

export interface PresetInfo {
  name: string;
  hue: number;
  accent: string;
  accent2: string;
  accent3: string;
  description: string;
}

interface RGBContextType {
  config: RGBThemeConfig;
  activeHue: number;
  setPreset: (preset: RGBPreset) => void;
  setMode: (mode: 'dynamic' | 'static' | 'off') => void;
  setIntensity: (intensity: number) => void;
  setSpeed: (speed: number) => void;
  setAccentColor: (color: string) => void;
  toggleRgb: () => void;
  presets: Record<RGBPreset, PresetInfo>;
}

export const PRESETS: Record<RGBPreset, PresetInfo> = {
  aurora: {
    name: 'Aurora',
    hue: 190,
    accent: '#06b6d4',
    accent2: '#8b5cf6',
    accent3: '#10b981',
    description: 'Electric Cyan flowing into Violet and Emerald hues'
  },
  cyber: {
    name: 'Cyberpunk',
    hue: 295,
    accent: '#d946ef',
    accent2: '#8b5cf6',
    accent3: '#06b6d4',
    description: 'Neon Magenta, Violet and Electric Blue neon glow'
  },
  ocean: {
    name: 'Deep Ocean',
    hue: 215,
    accent: '#0ea5e9',
    accent2: '#3b82f6',
    accent3: '#14b8a6',
    description: 'Tranquil deep marine blues with aqua highlights'
  },
  nebula: {
    name: 'Cosmic Nebula',
    hue: 268,
    accent: '#a855f7',
    accent2: '#ec4899',
    accent3: '#6366f1',
    description: 'Deep violet, cosmic purple and starlight magenta'
  },
  emerald: {
    name: 'Quantum Emerald',
    hue: 152,
    accent: '#10b981',
    accent2: '#059669',
    accent3: '#84cc16',
    description: 'High-tech mint, cyber emerald and jade illumination'
  },
  sunset: {
    name: 'Solar Flare',
    hue: 22,
    accent: '#f97316',
    accent2: '#f43f5e',
    accent3: '#eab308',
    description: 'Warm solar orange, golden amber and twilight purple'
  },
  monochrome: {
    name: 'Titanium',
    hue: 220,
    accent: '#94a3b8',
    accent2: '#64748b',
    accent3: '#cbd5e1',
    description: 'Refined ultra-minimal slate and brushed titanium'
  },
  custom: {
    name: 'Custom Calibration',
    hue: 200,
    accent: '#0ea5e9',
    accent2: '#a855f7',
    accent3: '#06b6d4',
    description: 'Fully personalized user-tuned hue and saturation'
  }
};

const DEFAULT_CONFIG: RGBThemeConfig = {
  preset: 'aurora',
  mode: 'dynamic',
  intensity: 0.85,
  speed: 1.0,
  accentColor: '#06b6d4',
  isRgbOn: true
};

const RGBContext = createContext<RGBContextType | undefined>(undefined);

export const RGBThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<RGBThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('zeno_rgb_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [activeHue, setActiveHue] = useState<number>(() => {
    return PRESETS[config.preset]?.hue || 190;
  });

  const animRef = useRef<number | null>(null);
  const hueRef = useRef<number>(PRESETS[config.preset]?.hue || 190);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem('zeno_rgb_config', JSON.stringify(config));
    
    // Stop any active animation frame
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    const root = document.documentElement;

    // Mode 1: Completely Off or Disabled
    if (!config.isRgbOn || config.mode === 'off') {
      root.style.setProperty('--zeno-hue', '220');
      root.style.setProperty('--zeno-accent', '#64748b');
      root.style.setProperty('--zeno-accent-2', '#475569');
      root.style.setProperty('--zeno-accent-3', '#334155');
      root.style.setProperty('--zeno-glow', 'rgba(255, 255, 255, 0.03)');
      root.style.setProperty('--zeno-glow-intense', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--zeno-glow-ambient', 'transparent');
      root.style.setProperty('--zeno-border-glow', 'rgba(255, 255, 255, 0.08)');
      setActiveHue(220);
      return;
    }

    const presetData = PRESETS[config.preset] || PRESETS.aurora;
    const baseTargetHue = config.preset === 'custom' ? 200 : presetData.hue;
    const isMono = config.preset === 'monochrome';
    const sat = isMono ? '15%' : '90%';
    const light = '55%';

    // Mode 2: Static Chroma (Locked Color)
    if (config.mode === 'static') {
      hueRef.current = baseTargetHue;
      setActiveHue(baseTargetHue);

      const intenseAlpha = (0.70 * config.intensity).toFixed(3);
      const glowAlpha = (0.36 * config.intensity).toFixed(3);
      const ambientAlpha = (0.22 * config.intensity).toFixed(3);
      const borderAlpha = (0.50 * config.intensity).toFixed(3);

      root.style.setProperty('--zeno-hue', baseTargetHue.toString());
      root.style.setProperty('--zeno-accent', presetData.accent);
      root.style.setProperty('--zeno-accent-2', presetData.accent2);
      root.style.setProperty('--zeno-accent-3', presetData.accent3);
      root.style.setProperty('--zeno-glow', `hsla(${baseTargetHue}, ${sat}, ${light}, ${glowAlpha})`);
      root.style.setProperty('--zeno-glow-intense', `hsla(${baseTargetHue}, ${sat}, ${light}, ${intenseAlpha})`);
      root.style.setProperty('--zeno-glow-ambient', `hsla(${baseTargetHue}, ${sat}, ${light}, ${ambientAlpha})`);
      root.style.setProperty('--zeno-border-glow', `hsla(${baseTargetHue}, ${sat}, ${light}, ${borderAlpha})`);
      return;
    }

    // Mode 3: Dynamic Spectrum (60fps continuous aura cycling)
    let curHue = hueRef.current;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Advance hue smoothly based on velocity slider
      curHue = (curHue + dt * 24 * config.speed) % 360;
      hueRef.current = curHue;

      const h = Math.round(curHue);
      const intenseAlpha = (0.70 * config.intensity).toFixed(3);
      const glowAlpha = (0.36 * config.intensity).toFixed(3);
      const ambientAlpha = (0.22 * config.intensity).toFixed(3);
      const borderAlpha = (0.50 * config.intensity).toFixed(3);

      root.style.setProperty('--zeno-hue', h.toString());
      root.style.setProperty('--zeno-accent', `hsl(${h}, ${sat}, ${light})`);
      root.style.setProperty('--zeno-accent-2', `hsl(${(h + 45) % 360}, ${sat}, ${light})`);
      root.style.setProperty('--zeno-accent-3', `hsl(${(h + 90) % 360}, ${sat}, ${light})`);
      root.style.setProperty('--zeno-glow', `hsla(${h}, ${sat}, ${light}, ${glowAlpha})`);
      root.style.setProperty('--zeno-glow-intense', `hsla(${h}, ${sat}, ${light}, ${intenseAlpha})`);
      root.style.setProperty('--zeno-glow-ambient', `hsla(${h}, ${sat}, ${light}, ${ambientAlpha})`);
      root.style.setProperty('--zeno-border-glow', `hsla(${h}, ${sat}, ${light}, ${borderAlpha})`);

      // Throttle React state notification to ~12fps for UI readouts
      if (now - lastUpdateRef.current > 80) {
        lastUpdateRef.current = now;
        setActiveHue(h);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [config]);

  const setPreset = (preset: RGBPreset) => {
    const data = PRESETS[preset] || PRESETS.aurora;
    hueRef.current = data.hue;
    setActiveHue(data.hue);
    setConfig(prev => ({
      ...prev,
      preset,
      accentColor: data.accent,
      isRgbOn: true,
      mode: prev.mode === 'off' ? 'dynamic' : prev.mode
    }));
  };

  const setMode = (mode: 'dynamic' | 'static' | 'off') => {
    setConfig(prev => ({
      ...prev,
      mode,
      isRgbOn: mode !== 'off'
    }));
  };

  const setIntensity = (intensity: number) => {
    setConfig(prev => ({ ...prev, intensity: Math.max(0.1, Math.min(1.0, intensity)) }));
  };

  const setSpeed = (speed: number) => {
    setConfig(prev => ({ ...prev, speed: Math.max(0.5, Math.min(3.0, speed)) }));
  };

  const setAccentColor = (accentColor: string) => {
    setConfig(prev => ({
      ...prev,
      accentColor,
      preset: 'custom',
      isRgbOn: true,
      mode: prev.mode === 'off' ? 'dynamic' : prev.mode
    }));
  };

  const toggleRgb = () => {
    setConfig(prev => {
      const willBeOn = !prev.isRgbOn;
      return {
        ...prev,
        isRgbOn: willBeOn,
        mode: willBeOn ? (prev.mode === 'off' ? 'dynamic' : prev.mode) : 'off'
      };
    });
  };

  return (
    <RGBContext.Provider value={{
      config,
      activeHue,
      setPreset,
      setMode,
      setIntensity,
      setSpeed,
      setAccentColor,
      toggleRgb,
      presets: PRESETS
    }}>
      {children}
    </RGBContext.Provider>
  );
};

export const useRGB = () => {
  const context = useContext(RGBContext);
  if (!context) throw new Error('useRGB must be used within an RGBThemeProvider');
  return context;
};
