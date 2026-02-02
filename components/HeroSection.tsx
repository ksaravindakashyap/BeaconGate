"use client";

import dynamic from "next/dynamic";
import type { HeroProps } from "@/components/ui/synthetic-hero";

const SyntheticHero = dynamic(
  () => import("@/components/ui/synthetic-hero").then((m) => m.default),
  { ssr: false },
);

export function HeroSection(props: HeroProps) {
  return <SyntheticHero {...props} />;
}
