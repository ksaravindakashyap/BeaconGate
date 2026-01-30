/**
 * Simple chunker for policy docs and precedent text.
 * - Policy: split by headings (## ) or paragraphs; fallback ~500–800 chars with 100 char overlap.
 * - Precedent: 1–3 chunks per case (summary + rules + rationale).
 */

import { createHash } from "crypto";

const DEFAULT_CHUNK_SIZE = 650;
const OVERLAP = 100;

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * Split markdown by ## headings first, then by paragraphs, then by fixed size with overlap.
 */
export function chunkPolicyDocument(content: string, source: string): { content: string; contentHash: string }[] {
  const chunks: { content: string; contentHash: string }[] = [];
  const sections = content.split(/(?=^##\s)/m).filter(Boolean);
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    const paragraphs = trimmed.split(/\n\n+/);
    let current = "";
    for (const p of paragraphs) {
      if (current.length + p.length + 2 > DEFAULT_CHUNK_SIZE && current.length > 0) {
        const text = current.trim();
        if (text.length > 0) chunks.push({ content: text, contentHash: sha256Hex(text) });
        current = current.slice(-OVERLAP) + "\n\n" + p;
      } else {
        current = current ? current + "\n\n" + p : p;
      }
    }
    if (current.trim().length > 0) chunks.push({ content: current.trim(), contentHash: sha256Hex(current.trim()) });
  }
  if (chunks.length === 0 && content.trim().length > 0) {
    const text = content.trim();
    chunks.push({ content: text, contentHash: sha256Hex(text) });
  }
  return chunks;
}

/**
 * Precedent: one chunk per entry (title + scenario + rules + outcome + rationale).
 */
export function chunkPrecedentEntry(
  title: string,
  scenarioSummary: string,
  triggeredRules: string[],
  outcome: string,
  rationale: string
): { content: string; contentHash: string }[] {
  const parts = [
    `Title: ${title}`,
    `Scenario: ${scenarioSummary}`,
    `Triggered rules: ${triggeredRules.join(", ") || "None"}`,
    `Outcome: ${outcome}`,
    `Rationale: ${rationale}`,
  ];
  const content = parts.join("\n\n");
  return [{ content, contentHash: sha256Hex(content) }];
}

export function contentHash(text: string): string {
  return sha256Hex(text);
}
