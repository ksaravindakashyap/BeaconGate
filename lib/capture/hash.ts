import { createHash } from "crypto";
import { readFile } from "fs/promises";

export function sha256String(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function sha256Buffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function sha256File(path: string): Promise<string> {
  const buf = await readFile(path);
  return sha256Buffer(buf);
}

export function bundleHashPayload(payload: Record<string, unknown>): string {
  const sorted = sortKeys(payload);
  return JSON.stringify(sorted);
}

export function sha256Bundle(payload: Record<string, unknown>): string {
  return sha256String(bundleHashPayload(payload));
}

function sortKeys(obj: unknown): unknown {
  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  return obj;
}
