import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  ExternalLink,
  Navigation,
  Compass,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Layers,
  CornerUpRight,
  RotateCcw
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationData } from '../types';

interface MapCardProps {
  location: LocationData;
}

type MapLayerType = 'dark' | 'street' | 'satellite';

const TILE_CONFIG: Record<MapLayerType, { url: string; subdomains: string; maxZoom: number; label: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19,
    label: 'Dark Tech',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  street: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 19,
    label: 'Street',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: 'abcd',
    maxZoom: 19,
    label: 'Satellite',
    attribution: '&copy; Esri &copy; Earthstar Geographics'
  }
};

export const MapCard: React.FC<MapCardProps> = ({ location }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('dark');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const lat = Number(location.coordinates?.latitude) || 13.21428;
  const lon = Number(location.coordinates?.longitude) || 74.99234;
  const coordStr = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(coordStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 14, { animate: true });
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }
  };

  const directionsUrl = location.directionsUrl || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const googleMapsUrl = location.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map Instance if not exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Custom pulsing cyber pin marker
      const pinIcon = L.divIcon({
        className: 'custom-zeno-pin',
        html: `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; pointer-events:none;">
            <div style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(6,182,212,0.3); animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
            <div style="position:absolute; width:22px; height:22px; border-radius:50%; background:rgba(99,102,241,0.5); animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position:relative; width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg, #06b6d4 0%, #6366f1 100%); display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(6,182,212,0.9); border:2.5px solid #ffffff;">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([lat, lon], { icon: pinIcon }).addTo(map);
      marker.bindPopup(`
        <div style="color:#0f172a; font-family:system-ui,-apple-system,sans-serif; min-width:180px; padding:2px;">
          <h5 style="margin:0 0 4px 0; font-weight:700; font-size:13px; color:#0f172a;">${location.name}</h5>
          <p style="margin:0 0 6px 0; font-size:11px; color:#475569; line-height:1.3;">${location.address || location.name}</p>
          <div style="font-family:monospace; font-size:10px; color:#0284c7; background:#f0f9ff; padding:2px 6px; border-radius:4px; display:inline-block;">GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}</div>
        </div>
      `);

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      // Update coordinates
      mapInstanceRef.current.setView([lat, lon], 14);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      }
    }

    // Attach active tile layer
    const config = TILE_CONFIG[activeLayer];
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newLayer = L.tileLayer(config.url, {
      subdomains: config.subdomains,
      maxZoom: config.maxZoom,
      attribution: config.attribution
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;

    // Invalidate size on render
    const t = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(t);
  }, [lat, lon, activeLayer]);

  // Handle Resize / Expand
  useEffect(() => {
    const t = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 320);
    return () => clearTimeout(t);
  }, [isExpanded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden border border-cyan-500/30 glass-card bg-slate-900/90 shadow-2xl shadow-cyan-950/20 transition-all duration-300">
      {/* Top Header Bar */}
      <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-semibold text-slate-100 truncate">
                {location.name}
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Live Interactive Map
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {location.address}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Layer Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/50 border border-white/10 text-[10px] font-mono">
            {(['dark', 'street', 'satellite'] as MapLayerType[]).map(l => (
              <button
                key={l}
                onClick={() => setActiveLayer(l)}
                className={`px-2 py-0.5 rounded capitalize transition ${
                  activeLayer === l ? 'bg-cyan-500/25 text-cyan-300 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {TILE_CONFIG[l].label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRecenter}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
            title="Recenter pin on map"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyCoords}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
            title="Copy Latitude & Longitude"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{coordStr}</span>
          </button>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition shadow-sm"
            title="Get Directions on Google Maps"
          >
            <CornerUpRight className="w-3 h-3" />
            <span className="hidden md:inline">Directions</span>
          </a>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition shadow-sm"
            title="Open in Google Maps"
          >
            <Navigation className="w-3 h-3" />
            <span>Open Maps</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title={isExpanded ? 'Collapse Map' : 'Expand Map'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Direct Interactive Leaflet Map Container */}
      <div className={`relative w-full transition-all duration-300 bg-slate-950 z-0 ${isExpanded ? 'h-96' : 'h-64 sm:h-72'}`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Overlay GPS Telemetry Pill */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/15 text-[10px] font-mono text-cyan-300 shadow-lg pointer-events-none z-[400]">
          <Compass className="w-3 h-3 animate-spin-slow text-cyan-400" />
          <span>GPS: {coordStr}</span>
        </div>
      </div>
    </div>
  );
};
