import { lookup } from "dns";
import { promisify } from "util";

const dnsLookup = promisify(lookup);

const MAX_URL_LENGTH = 2048;

export const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254",
  "100.100.100.200",
]);

/** Pure helper for tests: true if hostname is in blocked list (no DNS). */
export function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAMES.has(hostname.toLowerCase());
}

function isPrivateOrBlocked(ip: string): boolean {
  if (BLOCKED_HOSTNAMES.has(ip.toLowerCase())) return true;
  const parts = ip.split(".");
  if (parts.length === 4) {
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }
  if (ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  return false;
}

export interface SSRFResult {
  ok: boolean;
  error?: string;
}

export async function validateUrlForCapture(urlString: string): Promise<SSRFResult> {
  if (urlString.length > MAX_URL_LENGTH) {
    return { ok: false, error: `URL exceeds max length (${MAX_URL_LENGTH})` };
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  const scheme = url.protocol.replace(":", "").toLowerCase();
  if (!["http", "https"].includes(scheme)) {
    return { ok: false, error: `Scheme not allowed: ${scheme}` };
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, error: `Blocked hostname: ${hostname}` };
  }

  try {
    const { address } = await dnsLookup(hostname, { all: false });
    if (isPrivateOrBlocked(address)) {
      return { ok: false, error: `Resolved to blocked/private IP: ${address}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `DNS lookup failed: ${message}` };
  }

  return { ok: true };
}
