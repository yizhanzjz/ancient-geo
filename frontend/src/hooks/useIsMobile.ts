"use client";

import { useState, useEffect } from "react";

/**
 * Returns true on mobile, false on desktop, null before detection.
 * Use null state to avoid rendering the wrong UI during SSR/hydration.
 */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isNarrow = window.innerWidth < 768;
      setIsMobile(isMobileUA || isNarrow);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
