"use client";

interface MapAppPickerProps {
  latitude: number;
  longitude: number;
  name: string; // 地点名称（古名 → 今名）
  onClose: () => void;
}

interface MapOption {
  key: string;
  label: string;
  icon: string;
  getUrl: (lat: number, lng: number, name: string) => string;
}

const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

const MAP_OPTIONS: MapOption[] = [
  {
    key: "amap",
    label: "高德地图",
    icon: "🟢",
    getUrl: (lat, lng, name) =>
      `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}&src=yutujinxi&coordinate=gaode&callnative=1`,
  },
  {
    key: "baidu",
    label: "百度地图",
    icon: "🔵",
    getUrl: (lat, lng, name) =>
      `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodeURIComponent(name)}&content=${encodeURIComponent(name)}&output=html&src=yutujinxi&coord_type=wgs84`,
  },
  {
    key: "tencent",
    label: "腾讯地图",
    icon: "🟣",
    getUrl: (lat, lng, name) =>
      `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${encodeURIComponent(name)}&referer=yutujinxi`,
  },
  {
    key: "apple",
    label: "Apple 地图",
    icon: "🍎",
    getUrl: (lat, lng, name) =>
      `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`,
  },
  {
    key: "google",
    label: "Google 地图",
    icon: "🌐",
    getUrl: (lat, lng, name) =>
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`,
  },
];

export default function MapAppPicker({
  latitude,
  longitude,
  name,
  onClose,
}: MapAppPickerProps) {
  // Filter: show Apple Maps only on iOS
  const options = MAP_OPTIONS.filter((opt) => {
    if (opt.key === "apple") return isIOS();
    return true;
  });

  const handleOpen = (opt: MapOption) => {
    const url = opt.getUrl(latitude, longitude, name);
    window.location.href = url;
    // Close picker after a short delay (in case the app doesn't open)
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="w-full max-w-md mx-3 mb-6 animate-drawer-up">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-lg rounded-t-2xl border border-amber-200/40 px-5 pt-5 pb-3">
          <div className="text-center mb-1">
            <h3
              className="text-lg font-bold text-amber-900"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              📍 在地图中查看
            </h3>
            <p className="text-sm text-amber-600 mt-1">{name}</p>
            <p className="text-xs text-amber-400 mt-0.5">
              {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
            </p>
          </div>
        </div>

        {/* Map options */}
        <div className="bg-white/95 backdrop-blur-lg border-x border-amber-200/40">
          {options.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => handleOpen(opt)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/80 active:bg-amber-100 transition-colors text-left ${
                i < options.length - 1 ? "border-b border-amber-100/60" : ""
              }`}
            >
              <span className="text-xl w-8 text-center">{opt.icon}</span>
              <span className="text-amber-900 font-medium text-base">
                {opt.label}
              </span>
              <span className="ml-auto text-amber-300 text-sm">›</span>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="w-full mt-2 bg-white/95 backdrop-blur-lg rounded-2xl border border-amber-200/40 py-3.5 text-amber-700 font-medium text-base hover:bg-amber-50 active:bg-amber-100 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
