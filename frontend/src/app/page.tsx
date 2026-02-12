"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#fdf6e3]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-amber-300 animate-pulse-ring" />
          <div className="absolute inset-2 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-lg">🗺️</span>
          </div>
        </div>
        <span className="text-amber-700 text-sm">地图加载中…</span>
      </div>
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
  { name: "长安", emoji: "🏯" },
  { name: "临安", emoji: "🌊" },
  { name: "金陵", emoji: "🐉" },
  { name: "汴梁", emoji: "🎏" },
  { name: "洛阳", emoji: "🌸" },
  { name: "姑苏", emoji: "🎐" },
  { name: "襄阳", emoji: "⚔️" },
  { name: "邯郸", emoji: "🏹" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [activeResult, setActiveResult] = useState<PlaceResult | null>(null);
  const [btnAnimating, setBtnAnimating] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-open drawer on mobile when results come in
  useEffect(() => {
    if (results.length > 0) {
      setMobileDrawerOpen(true);
    }
  }, [results.length]);

  const handleSearch = useCallback(
    async (name?: string) => {
      const searchName = name || query.trim();
      if (!searchName) return;

      setBtnAnimating(true);
      setTimeout(() => setBtnAnimating(false), 200);

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
    <div className="flex flex-col h-screen overflow-hidden bg-[#fdf6e3]">
      {/* ===== Header ===== */}
      <header className="header-pattern bg-gradient-to-r from-amber-900 via-amber-800 to-[#6b2f0a] text-white px-4 sm:px-6 py-3 sm:py-4 shadow-[0_4px_24px_rgba(69,26,3,0.3)] relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
            🏛️
          </div>
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold tracking-wide"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              古今地名对照
            </h1>
            <p className="text-amber-300/80 text-xs sm:text-sm mt-0.5">
              输入中国古代地名，探索其现代地理位置
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* ===== Sidebar (desktop) / Drawer (mobile) ===== */}
        <aside
          className={`
            hidden md:flex
            w-[380px] lg:w-[400px] bg-[#fdf6e3]/80 backdrop-blur-lg
            border-r border-amber-200/60 flex-col z-10
          `}
        >
          <SidebarContent
            query={query}
            setQuery={setQuery}
            loading={loading}
            error={error}
            results={results}
            activeResult={activeResult}
            btnAnimating={btnAnimating}
            handleSearch={handleSearch}
            handleKeyDown={handleKeyDown}
            setActiveResult={setActiveResult}
            inputRef={inputRef}
          />
        </aside>

        {/* Mobile floating search + drawer */}
        <div className="md:hidden absolute top-3 left-3 right-3 z-30">
          <div className="glass rounded-2xl shadow-lg p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入古代地名…"
                className="flex-1 px-3 py-2.5 bg-white/70 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm text-amber-950 placeholder:text-amber-400"
                disabled={loading}
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className={`px-4 py-2.5 bg-gradient-to-b from-amber-700 to-amber-800 text-white rounded-xl text-sm font-medium shadow-md disabled:opacity-40 transition-all ${
                  btnAnimating ? "animate-btn-click" : ""
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <LoadingDot />
                    搜索
                  </span>
                ) : (
                  "搜索"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer toggle */}
        {results.length > 0 && (
          <button
            className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 glass-dark text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          >
            {mobileDrawerOpen ? "收起结果" : `查看结果 (${results.length})`}
          </button>
        )}

        {/* Mobile bottom drawer */}
        {mobileDrawerOpen && results.length > 0 && (
          <div className="md:hidden mobile-drawer glass animate-drawer-up">
            <div className="drawer-handle" />
            <div className="overflow-y-auto custom-scrollbar max-h-[55vh] px-3 pb-16">
              {results.map((r, i) => (
                <ResultCard
                  key={`${r.ancient_name}-${i}`}
                  result={r}
                  isActive={
                    activeResult?.ancient_name === r.ancient_name &&
                    activeResult?.modern_name === r.modern_name
                  }
                  index={i}
                  onClick={() => {
                    setActiveResult(r);
                    setMobileDrawerOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== Map ===== */}
        <main className="flex-1 relative">
          <MapView results={results} activeResult={activeResult} />
        </main>
      </div>
    </div>
  );
}

/* ===== Sub-Components ===== */

function LoadingDot() {
  return (
    <span className="flex gap-0.5">
      <span className="w-1 h-1 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1 h-1 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1 h-1 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 animate-shimmer skeleton-card">
      <div className="flex gap-3 mb-3">
        <div className="skeleton-line bg-amber-200/50 w-20 h-5" />
        <div className="skeleton-line bg-amber-200/30 w-4 h-5" />
        <div className="skeleton-line bg-amber-200/50 w-16 h-5" />
      </div>
      <div className="skeleton-line bg-amber-200/30 w-3/4 h-3 mb-2" />
      <div className="skeleton-line bg-amber-200/40 w-1/3 h-4" />
    </div>
  );
}

interface SidebarContentProps {
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
  error: string | null;
  results: PlaceResult[];
  activeResult: PlaceResult | null;
  btnAnimating: boolean;
  handleSearch: (name?: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setActiveResult: (r: PlaceResult) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function SidebarContent({
  query,
  setQuery,
  loading,
  error,
  results,
  activeResult,
  btnAnimating,
  handleSearch,
  handleKeyDown,
  setActiveResult,
  inputRef,
}: SidebarContentProps) {
  return (
    <>
      {/* Search area */}
      <div className="p-4 border-b border-amber-200/40">
        <div className="glass rounded-2xl p-4 shadow-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-sm">
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入古代地名，如：长安、临安…"
                className="w-full pl-9 pr-3 py-2.5 bg-white/60 border border-amber-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 text-sm text-amber-950 placeholder:text-amber-400 transition-all"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className={`px-5 py-2.5 bg-gradient-to-b from-amber-700 to-amber-800 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${
                btnAnimating ? "animate-btn-click" : ""
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <LoadingDot />
                  查询
                </span>
              ) : (
                "查询"
              )}
            </button>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {EXAMPLE_PLACES.map(({ name, emoji }) => (
              <button
                key={name}
                onClick={() => {
                  setQuery(name);
                  handleSearch(name);
                }}
                disabled={loading}
                className="group px-2.5 py-1 bg-white/50 text-amber-800 rounded-full text-xs border border-amber-200/50 hover:bg-amber-100 hover:border-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40"
              >
                <span className="mr-0.5 group-hover:mr-1 transition-all duration-200">{emoji}</span>
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 bg-red-50/80 backdrop-blur text-red-700 rounded-xl text-sm border border-red-200/50 animate-fade-up flex items-start gap-2">
            <span className="text-base mt-[-1px]">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && results.length === 0 ? (
          <div className="p-4 space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : results.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-3 space-y-2">
            {loading && <SkeletonCard />}
            {results.map((r, i) => (
              <ResultCard
                key={`${r.ancient_name}-${i}`}
                result={r}
                isActive={
                  activeResult?.ancient_name === r.ancient_name &&
                  activeResult?.modern_name === r.modern_name
                }
                index={i}
                onClick={() => setActiveResult(r)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="animate-float mb-4 relative">
        <div className="text-6xl">🏛️</div>
        <div className="absolute -top-1 -right-3 text-2xl animate-spin-slow">✦</div>
        <div className="absolute -bottom-1 -left-3 text-lg opacity-60">🗺️</div>
      </div>
      <h3
        className="text-amber-800 font-semibold text-base mb-1"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        探索古今地名
      </h3>
      <p className="text-amber-600/70 text-sm leading-relaxed">
        搜索古代地名，发现跨越千年的<br />地理变迁与历史记忆
      </p>
      <div className="mt-4 flex gap-1 text-xs text-amber-400">
        <span>长安</span><span>·</span>
        <span>临安</span><span>·</span>
        <span>金陵</span><span>·</span>
        <span>汴梁</span>
      </div>
    </div>
  );
}

interface ResultCardProps {
  result: PlaceResult;
  isActive: boolean;
  index: number;
  onClick: () => void;
}

function ResultCard({ result: r, isActive, index, onClick }: ResultCardProps) {
  return (
    <button
      onClick={onClick}
      className={`animate-slide-in w-full text-left p-4 rounded-xl transition-all duration-200 group
        ${
          isActive
            ? "bg-gradient-to-r from-amber-100 to-amber-50 shadow-md border border-amber-300/60 ring-1 ring-amber-400/20"
            : "bg-white/50 hover:bg-white/80 hover:shadow-md border border-transparent hover:border-amber-200/40"
        }
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">📍</span>
        <span
          className="font-bold text-amber-900 text-lg"
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          {r.ancient_name}
        </span>
        <span className="text-amber-400 text-sm group-hover:mx-1 transition-all duration-200">→</span>
        <span className="text-amber-800 font-medium">{r.modern_name}</span>
      </div>
      <div className="text-xs text-amber-600/70 mb-2 flex items-center gap-1.5">
        <span>📌</span>
        <span>
          {r.province} · {r.latitude.toFixed(2)}°N, {r.longitude.toFixed(2)}°E
        </span>
      </div>
      <div className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/40">
        <span>📜</span>
        <span>{r.dynasty_info}</span>
      </div>
    </button>
  );
}
