"use client";

import { useEffect, useRef, useState } from "react";

interface PlaceResult {
  ancient_name: string;
  modern_name: string;
  province: string;
  latitude: number;
  longitude: number;
  description: string;
  dynasty_info: string;
}

interface MapViewProps {
  results: PlaceResult[];
  activeResult: PlaceResult | null;
}

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
    __amap_init_callback: () => void;
  }
}

function loadAMapScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap);
      return;
    }

    window._AMapSecurityConfig = {
      securityJsCode: process.env.NEXT_PUBLIC_AMAP_SECRET || "",
    };

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${process.env.NEXT_PUBLIC_AMAP_KEY || ""}&callback=__amap_init_callback`;
    script.async = true;

    window.__amap_init_callback = () => {
      resolve(window.AMap);
    };

    script.onerror = reject;
    document.head.appendChild(script);
  });
}

type MapLayer = "standard" | "satellite" | "terrain";

const LAYER_OPTIONS: { key: MapLayer; label: string; icon: string }[] = [
  { key: "standard", label: "标准", icon: "🗺️" },
  { key: "satellite", label: "卫星", icon: "🛰️" },
  { key: "terrain", label: "地形", icon: "⛰️" },
];

/**
 * Custom red ancient-style marker SVG (seal / stamp style)
 */
function getMarkerSvg(isActive: boolean): string {
  const scale = isActive ? 1.15 : 1;
  const glow = isActive
    ? `<circle cx="20" cy="20" r="18" fill="none" stroke="rgba(196,30,58,0.3)" stroke-width="3">
        <animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
      </circle>`
    : "";

  return `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <g transform="scale(${scale})">
    ${glow}
    <defs>
      <linearGradient id="pin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#e74860"/>
        <stop offset="100%" style="stop-color:#a3162a"/>
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#451a03" flood-opacity="0.25"/>
      </filter>
    </defs>
    <path d="M20 2 C10 2 3 10 3 18 C3 30 20 50 20 50 C20 50 37 30 37 18 C37 10 30 2 20 2Z" 
          fill="url(#pin)" filter="url(#shadow)" stroke="#fff" stroke-width="1.5"/>
    <circle cx="20" cy="18" r="7" fill="#fff" opacity="0.9"/>
    <text x="20" y="22" text-anchor="middle" font-size="10" font-weight="bold" fill="#a3162a" font-family="serif">古</text>
  </g>
</svg>`)}`;
}

function buildInfoContent(r: PlaceResult): string {
  return `
    <div style="
      padding: 16px 18px;
      max-width: 320px;
      font-family: 'Noto Sans SC', 'PingFang SC', sans-serif;
      border-radius: 12px;
    ">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
        <span style="
          display:inline-flex; align-items:center; justify-content:center;
          width:28px; height:28px; border-radius:8px;
          background: linear-gradient(135deg, #c41e3a, #a3162a);
          color:#fff; font-size:14px;
        ">📍</span>
        <div>
          <span style="font-family:'Noto Serif SC',serif; font-size:17px; font-weight:700; color:#451a03;">
            ${r.ancient_name}
          </span>
          <span style="color:#b8860b; margin:0 6px; font-size:14px;">→</span>
          <span style="font-size:15px; color:#6b2f0a; font-weight:500;">
            ${r.modern_name}
          </span>
        </div>
      </div>
      <div style="
        display:flex; align-items:center; gap:4px;
        color:#92400e; font-size:12px; margin-bottom:8px;
        padding:4px 8px; background:#fffbeb; border-radius:6px; border:1px solid rgba(180,134,11,0.15);
      ">
        📌 ${r.province} · ${r.latitude.toFixed(4)}°N, ${r.longitude.toFixed(4)}°E
      </div>
      <p style="margin:0 0 10px; color:#374151; font-size:13px; line-height:1.7;">
        ${r.description}
      </p>
      <span style="
        display:inline-flex; align-items:center; gap:4px;
        font-size:12px; color:#92400e;
        background: linear-gradient(135deg, #fffbeb, #fef3c7);
        padding:5px 12px; border-radius:8px;
        border:1px solid rgba(180,134,11,0.2);
        font-weight:500;
      ">
        📜 ${r.dynasty_info}
      </span>
    </div>
  `;
}

export default function MapView({ results, activeResult }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const extraLayersRef = useRef<any[]>([]);
  const [AMap, setAMap] = useState<any>(null);
  const [currentLayer, setCurrentLayer] = useState<MapLayer>("standard");

  // Initialize map — default to standard layer
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        const AMapModule = await loadAMapScript();
        if (cancelled || !mapRef.current) return;

        const map = new AMapModule.Map(mapRef.current, {
          zoom: 5,
          center: [104.2, 35.86],
          viewMode: "2D",
          mapStyle: "amap://styles/normal",
          animateEnable: true,
        });

        // Standard layer — no extra layers needed
        extraLayersRef.current = [];

        mapInstanceRef.current = map;
        setAMap(AMapModule);
      } catch (e) {
        console.error("Failed to load AMap:", e);
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch layers
  useEffect(() => {
    if (!AMap || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing extra layers
    if (extraLayersRef.current.length > 0) {
      map.remove(extraLayersRef.current);
      extraLayersRef.current = [];
    }

    if (currentLayer === "satellite") {
      const sat = new AMap.TileLayer.Satellite();
      map.add(sat);
      extraLayersRef.current = [sat];
    } else if (currentLayer === "terrain") {
      const sat = new AMap.TileLayer.Satellite();
      const road = new AMap.TileLayer.RoadNet();
      map.add([sat, road]);
      extraLayersRef.current = [sat, road];
    }
    // "standard" uses only the default base layer
  }, [AMap, currentLayer]);

  // Update markers when results change
  useEffect(() => {
    if (!AMap || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => {
      map.remove(m);
    });
    markersRef.current = [];

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    results.forEach((r) => {
      const isActive =
        activeResult?.ancient_name === r.ancient_name &&
        activeResult?.modern_name === r.modern_name;

      const markerSize = isActive ? [44, 56] : [36, 47];

      const icon = new AMap.Icon({
        size: new AMap.Size(markerSize[0], markerSize[1]),
        image: getMarkerSvg(isActive),
        imageSize: new AMap.Size(markerSize[0], markerSize[1]),
      });

      const marker = new AMap.Marker({
        position: new AMap.LngLat(r.longitude, r.latitude),
        title: `${r.ancient_name} → ${r.modern_name}`,
        icon: icon,
        offset: new AMap.Pixel(-markerSize[0] / 2, -markerSize[1]),
        animation: "AMAP_ANIMATION_DROP",
      });

      const infoWindow = new AMap.InfoWindow({
        content: buildInfoContent(r),
        offset: new AMap.Pixel(0, -markerSize[1] - 4),
        isCustom: false,
      });

      marker.on("click", () => {
        infoWindow.open(map, marker.getPosition());
        infoWindowRef.current = infoWindow;
      });

      if (isActive) {
        setTimeout(() => {
          infoWindow.open(map, marker.getPosition());
          infoWindowRef.current = infoWindow;
        }, 800);
      }

      map.add(marker);
      markersRef.current.push(marker);
    });
  }, [AMap, results, activeResult]);

  // Fly to active result with smooth animation
  useEffect(() => {
    if (!mapInstanceRef.current || !activeResult || !window.AMap) return;

    const map = mapInstanceRef.current;
    const targetPos = new window.AMap.LngLat(
      activeResult.longitude,
      activeResult.latitude
    );

    // Smooth panTo + zoom
    map.setZoomAndCenter(10, targetPos, true, 800);
  }, [activeResult]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Layer switcher */}
      <div className="absolute top-3 right-3 z-10">
        <div className="glass rounded-xl shadow-lg overflow-hidden border border-amber-200/40 flex text-sm">
          {LAYER_OPTIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setCurrentLayer(key)}
              className={`px-3 py-2 flex items-center gap-1 transition-all duration-200 ${
                currentLayer === key
                  ? "bg-gradient-to-b from-amber-700 to-amber-800 text-white shadow-inner"
                  : "text-amber-800 hover:bg-amber-100/60"
              }`}
            >
              <span className="text-xs">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map attribution label */}
      <div className="absolute bottom-2 left-2 z-10 text-[10px] text-amber-700/40 select-none">
        古今地名对照 · AMap
      </div>
    </div>
  );
}
