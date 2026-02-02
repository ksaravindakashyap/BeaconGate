"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * When on the landing page (/), sets data-theme="landing" on the document
 * so the whole page (html/body) uses the dark hero design. Other routes stay default.
 */
export function LandingTheme() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (pathname === "/") {
      root.setAttribute("data-theme", "landing");
    } else {
      root.removeAttribute("data-theme");
    }
    return () => root.removeAttribute("data-theme");
  }, [pathname]);

  return null;
}
