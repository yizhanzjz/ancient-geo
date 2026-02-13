"use client";

import { useState, useEffect } from "react";

/**
 * Returns true on mobile, false on desktop, null before detection.
 * Uses multiple signals: UA, screen width, touch support, pointer type.
 */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      // UA detection (covers most mobile browsers including WeChat)
      const isMobileUA =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|MicroMessenger|Mobile|mobile/i.test(ua);
      // Narrow viewport
      const isNarrow = window.innerWidth < 768;
      // Touch-capable device with coarse pointer (no mouse)
      const isTouchOnly =
        "ontouchstart" in window &&
        window.matchMedia("(pointer: coarse)").matches &&
        !window.matchMedia("(pointer: fine)").matches;
      // iPad Safari requests desktop site by default — catch it via touch + platform
      const isIPad =
        navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1;

      setIsMobile(isMobileUA || isNarrow || isTouchOnly || isIPad);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
