"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const activeIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: "active-marker",
});

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

// Component to fly to active result
function FlyToActive({ activeResult }: { activeResult: PlaceResult | null }) {
  const map = useMap();
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeResult) {
      const key = `${activeResult.ancient_name}-${activeResult.latitude}`;
      if (key !== prevRef.current) {
        map.flyTo([activeResult.latitude, activeResult.longitude], 8, {
          duration: 1.5,
        });
        prevRef.current = key;
      }
    }
  }, [activeResult, map]);

  return null;
}

export default function MapView({ results, activeResult }: MapViewProps) {
  // China center
  const center: [number, number] = [35.86, 104.2];

  return (
    <MapContainer
      center={center}
      zoom={5}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToActive activeResult={activeResult} />

      {results.map((r, i) => {
        const isActive =
          activeResult?.ancient_name === r.ancient_name &&
          activeResult?.modern_name === r.modern_name;

        return (
          <Marker
            key={`${r.ancient_name}-${i}`}
            position={[r.latitude, r.longitude]}
            icon={isActive ? activeIcon : defaultIcon}
          >
            <Popup maxWidth={300}>
              <div className="text-sm">
                <h3 className="font-bold text-base mb-1 text-amber-900">
                  {r.ancient_name}
                  <span className="text-gray-400 font-normal mx-1">→</span>
                  {r.modern_name}
                </h3>
                <p className="text-gray-500 text-xs mb-2">
                  {r.province} · {r.latitude.toFixed(4)}°N,{" "}
                  {r.longitude.toFixed(4)}°E
                </p>
                <p className="text-gray-700 mb-2 leading-relaxed">
                  {r.description}
                </p>
                <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                  📜 {r.dynasty_info}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
