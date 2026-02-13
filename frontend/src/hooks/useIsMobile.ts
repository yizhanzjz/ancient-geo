"use client";

import { useState, useEffect } from "react";

/**
 * Returns true on mobile, false on desktop, null before detection.
 *
 * Most reliable approach: use screen.width (physical device width in CSS px).
 * - window.innerWidth can be affected by browser zoom / split view
 * - UA detection is fragile (Quark, UCBrowser, etc. have weird UAs)
 * - screen.width reflects the actual device and doesn't change with zoom
 *
 * Fallback: touch + coarse pointer for tablets requesting desktop site.
 */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      // Primary signal: physical screen width (most reliable)
      const smallScreen = screen.width < 768;
      // Secondary: current viewport is narrow
      const narrowViewport = window.innerWidth < 768;
      // Tertiary: touch-only device (no mouse) — catches tablets
      const touchOnly =
        navigator.maxTouchPoints > 0 &&
        window.matchMedia("(pointer: coarse)").matches;

      setIsMobile(smallScreen || narrowViewport || touchOnly);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}
