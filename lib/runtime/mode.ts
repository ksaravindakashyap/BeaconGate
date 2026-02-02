/**
 * Runtime mode: demo (no DB/Redis) vs full (Prisma + Redis).
 * - APP_MODE=demo => demo
 * - APP_MODE=full => full
 * - Otherwise: demo when DATABASE_URL is missing, full when present.
 */
function computeMode(): "demo" | "full" {
  const explicit = process.env.APP_MODE;
  if (explicit === "demo") return "demo";
  if (explicit === "full") return "full";
  return process.env.DATABASE_URL ? "full" : "demo";
}

let _mode: "demo" | "full" | undefined;
function getMode(): "demo" | "full" {
  if (_mode === undefined) _mode = computeMode();
  return _mode;
}

export function isDemoMode(): boolean {
  return getMode() === "demo";
}

export function getAppMode(): "demo" | "full" {
  return getMode();
}

export const APP_MODE: "demo" | "full" = getMode();
