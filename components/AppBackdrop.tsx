"use client";

/**
 * CSS-only ambient backdrop for non-landing routes.
 * Fixed full-viewport layer: emerald/teal gradient + wavy texture + readability overlay.
 * Does not set body/html background. No scrollbars (overflow-hidden).
 */
export function AppBackdrop() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {/* Base: emerald/teal haze */}
      <div
        className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_30%_20%,rgba(16,185,129,0.20),transparent_60%),radial-gradient(900px_600px_at_70%_35%,rgba(45,212,191,0.14),transparent_55%),radial-gradient(1000px_800px_at_50%_80%,rgba(16,185,129,0.10),transparent_60%)]"
        aria-hidden
      />
      {/* Wavy / blob texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.10] mix-blend-soft-light bg-[radial-gradient(circle_at_20%_30%,rgba(45,212,191,0.35),transparent_35%),radial-gradient(circle_at_80%_40%,rgba(16,185,129,0.35),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(45,212,191,0.25),transparent_45%)]"
        aria-hidden
      />
      {/* Subtle wave lines */}
      <div
        className="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_18px)]"
        aria-hidden
      />
      {/* Readability overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65"
        aria-hidden
      />
    </div>
  );
}
