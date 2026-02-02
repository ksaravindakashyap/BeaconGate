"use client";

import { usePathname } from "next/navigation";
import { AppBackdrop } from "@/components/AppBackdrop";

/**
 * Renders the non-landing backdrop only on non-landing routes.
 * Landing (/) keeps its existing shader backdrop; all other routes get AppBackdrop.
 * Mount in root layout so the fixed layer is not clipped by any parent transform/overflow.
 */
export function RouteBackdrops() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <AppBackdrop />;
}
