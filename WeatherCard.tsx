import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudDrizzle,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Compass,
  MapPin,
  Clock
} from 'lucide-react';
import { WeatherData } from '../types';

interface WeatherCardProps {
  weather: WeatherData;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const getWeatherIcon = (iconName?: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="w-8 h-8 text-amber-400 animate-spin-slow" />;
      case 'cloud-sun':
        return <CloudSun className="w-8 h-8 text-amber-300" />;
      case 'cloud':
        return <Cloud className="w-8 h-8 text-slate-300" />;
      case 'cloud-drizzle':
        return <CloudDrizzle className="w-8 h-8 text-cyan-300" />;
      case 'cloud-rain':
        return <CloudRain className="w-8 h-8 text-blue-400" />;
      case 'cloud-lightning':
        return <CloudLightning className="w-8 h-8 text-purple-400" />;
      case 'cloud-snow':
        return <CloudSnow className="w-8 h-8 text-sky-200" />;
      default:
        return <Sun className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden border border-cyan-500/30 glass-card bg-gradient-to-br from-slate-900/90 via-cyan-950/20 to-black/80 shadow-xl shadow-cyan-950/30">
      {/* Ambient Top Glow Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-80" />

      <div className="p-4 sm:p-5">
        {/* Header: Location & Telemetry Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                {weather.location}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono">
                {weather.coordinates.latitude.toFixed(4)}°N, {weather.coordinates.longitude.toFixed(4)}°E
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
        </div>

        {/* Main Temperature & Condition Display */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              {getWeatherIcon(weather.icon)}
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight font-mono">
                  {weather.temperature}
                </span>
                <span className="text-xl sm:text-2xl text-cyan-400 font-bold">
                  {weather.temperatureUnit || '°C'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5">
                {weather.conditionLabel || 'Verified Meteorological Data'}
              </p>
            </div>
          </div>

          {/* Feels Like & High / Low Range */}
          <div className="flex flex-col sm:items-end justify-center text-xs space-y-1 font-mono text-slate-300">
            <div className="flex items-center gap-1.5 text-cyan-200">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Feels like: <strong>{weather.feelsLike}°C</strong></span>
            </div>
            {weather.dailyMax !== null && weather.dailyMin !== null && (
              <div className="text-[11px] text-slate-400">
                Range: <span className="text-rose-300 font-semibold">{weather.dailyMax}°C</span> / <span className="text-sky-300 font-semibold">{weather.dailyMin}°C</span>
              </div>
            )}
            {(weather.rainChance ?? 0) > 0 && (
              <div className="text-[11px] text-blue-300">
                Precipitation: {weather.rainChance}% chance
              </div>
            )}
          </div>
        </div>

        {/* Atmospheric Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5">
            <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Humidity</div>
              <div className="font-semibold text-slate-200 font-mono">{weather.humidity}%</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5">
            <Wind className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Wind Speed</div>
              <div className="font-semibold text-slate-200 font-mono">{weather.windSpeed} km/h</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5">
            <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Pressure</div>
              <div className="font-semibold text-slate-200 font-mono">{weather.pressure || 1012} hPa</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Updated</div>
              <div className="font-semibold text-slate-200 font-mono text-[11px]">
                {new Date(weather.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
