"use client";

import dynamic from "next/dynamic";

const SiteBackdrop = dynamic(
  () => import("@/components/SiteBackdrop").then((m) => m.SiteBackdrop),
  { ssr: false },
);

/**
 * Single global backdrop for the entire app (landing + Submit/Queue/Dashboard/Eval/Case/Setup).
 * Mounted once in layout; no duplicate canvases.
 */
export function GlobalBackdrop() {
  return <SiteBackdrop />;
}
