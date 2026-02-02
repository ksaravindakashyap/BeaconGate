"use client";

import dynamic from "next/dynamic";

const SiteBackdrop = dynamic(
  () => import("@/components/SiteBackdrop").then((m) => m.SiteBackdrop),
  { ssr: false },
);

export function LandingBackdrop() {
  return <SiteBackdrop />;
}
