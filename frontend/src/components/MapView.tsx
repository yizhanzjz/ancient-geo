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

    // Set security config
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

export default function MapView({ results, activeResult }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [AMap, setAMap] = useState<any>(null);

  // Initialize map
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
        });

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

  // Update markers when results change
  useEffect(() => {
    if (!AMap || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => {
      map.remove(m);
    });
    markersRef.current = [];

    // Close existing info window
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    // Add new markers
    results.forEach((r) => {
      const isActive =
        activeResult?.ancient_name === r.ancient_name &&
        activeResult?.modern_name === r.modern_name;

      const marker = new AMap.Marker({
        position: new AMap.LngLat(r.longitude, r.latitude),
        title: `${r.ancient_name} → ${r.modern_name}`,
        animation: "AMAP_ANIMATION_DROP",
      });

      const infoContent = `
        <div style="padding: 10px; max-width: 300px; font-family: -apple-system, sans-serif;">
          <h3 style="margin: 0 0 8px; color: #92400e; font-size: 16px; font-weight: bold;">
            ${r.ancient_name} <span style="color: #9ca3af; font-weight: normal;">→</span> ${r.modern_name}
          </h3>
          <p style="margin: 0 0 6px; color: #6b7280; font-size: 12px;">
            ${r.province} · ${r.latitude.toFixed(4)}°N, ${r.longitude.toFixed(4)}°E
          </p>
          <p style="margin: 0 0 8px; color: #374151; font-size: 13px; line-height: 1.6;">
            ${r.description}
          </p>
          <span style="font-size: 12px; color: #92400e; background: #fffbeb; padding: 3px 10px; border-radius: 4px; display: inline-block;">
            📜 ${r.dynasty_info}
          </span>
        </div>
      `;

      const infoWindow = new AMap.InfoWindow({
        content: infoContent,
        offset: new AMap.Pixel(0, -30),
      });

      marker.on("click", () => {
        infoWindow.open(map, marker.getPosition());
        infoWindowRef.current = infoWindow;
      });

      // Auto open for active result
      if (isActive) {
        setTimeout(() => {
          infoWindow.open(map, marker.getPosition());
          infoWindowRef.current = infoWindow;
        }, 700);
      }

      map.add(marker);
      markersRef.current.push(marker);
    });
  }, [AMap, results, activeResult]);

  // Fly to active result
  useEffect(() => {
    if (!mapInstanceRef.current || !activeResult) return;

    mapInstanceRef.current.setZoomAndCenter(
      10,
      new (window.AMap).LngLat(activeResult.longitude, activeResult.latitude),
      false,
      600
    );
  }, [activeResult]);

  return <div ref={mapRef} className="w-full h-full" />;
}
