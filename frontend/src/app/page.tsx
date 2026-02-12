"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamically import Map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
      地图加载中...
    </div>
  ),
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const EXAMPLE_PLACES = [
  "长安",
  "临安",
  "金陵",
  "汴梁",
  "洛阳",
  "姑苏",
  "襄阳",
  "邯郸",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [activeResult, setActiveResult] = useState<PlaceResult | null>(null);

  const handleSearch = useCallback(
    async (name?: string) => {
      const searchName = name || query.trim();
      if (!searchName) return;

      setLoading(true);
      setError(null);

      try {
        const resp = await fetch(`${API_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ancient_name: searchName }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => null);
          throw new Error(data?.detail || `请求失败 (${resp.status})`);
        }

        const data: PlaceResult = await resp.json();

        // Add to results if not duplicate
        setResults((prev) => {
          const exists = prev.some(
            (r) =>
              r.ancient_name === data.ancient_name &&
              r.modern_name === data.modern_name
          );
          if (exists) return prev;
          return [data, ...prev];
        });
        setActiveResult(data);
        setQuery("");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "查询失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-700 to-amber-900 text-white px-6 py-4 shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide">🏛️ 古今地名对照</h1>
        <p className="text-amber-200 text-sm mt-1">
          输入中国古代地名，探索其现代地理位置
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入古代地名，如：长安、临安..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {loading ? "查询中..." : "查询"}
              </button>
            </div>

            {/* Example tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {EXAMPLE_PLACES.map((place) => (
                <button
                  key={place}
                  onClick={() => {
                    setQuery(place);
                    handleSearch(place);
                  }}
                  disabled={loading}
                  className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full text-xs hover:bg-amber-100 transition-colors border border-amber-200"
                >
                  {place}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-3 p-2.5 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-y-auto">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="text-sm">
                  搜索古代地名，查看其现代对应位置
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.map((r, i) => (
                  <button
                    key={`${r.ancient_name}-${i}`}
                    onClick={() => setActiveResult(r)}
                    className={`w-full text-left p-4 hover:bg-amber-50 transition-colors ${
                      activeResult?.ancient_name === r.ancient_name &&
                      activeResult?.modern_name === r.modern_name
                        ? "bg-amber-50 border-l-4 border-amber-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-amber-900 text-lg">
                        {r.ancient_name}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700 font-medium">
                        {r.modern_name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1.5">
                      {r.province} · {r.latitude.toFixed(2)}°N,{" "}
                      {r.longitude.toFixed(2)}°E
                    </div>
                    <div className="text-xs text-amber-700 bg-amber-50 inline-block px-2 py-0.5 rounded">
                      {r.dynasty_info}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <MapView results={results} activeResult={activeResult} />
        </main>
      </div>
    </div>
  );
}
