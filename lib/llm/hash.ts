/**
 * Phase 4C: Canonical input hashing for LLMRun audit.
 * Stable stringify (sorted keys) + sha256.
 */

import { sha256Bundle } from "../capture/hash";
import type { AdvisoryInput } from "./advisoryInput";

export function hashAdvisoryInput(input: AdvisoryInput): string {
  const plain = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
  return sha256Bundle(plain);
}
