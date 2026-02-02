import { describe, it, expect } from "vitest";
import {
  chunkPolicyDocument,
  chunkPrecedentEntry,
  computeStableChunkId,
  contentHash,
} from "@/lib/rag/chunker";

describe("computeStableChunkId", () => {
  it("returns chk_ prefix and 12 hex chars", () => {
    const id = computeStableChunkId("source", 0, "abc123");
    expect(id).toMatch(/^chk_[a-f0-9]{12}$/);
  });

  it("is deterministic for same input", () => {
    const a = computeStableChunkId("Policy: v1", 1, "hash1");
    const b = computeStableChunkId("Policy: v1", 1, "hash1");
    expect(a).toBe(b);
  });

  it("differs for different chunkIndex", () => {
    const a = computeStableChunkId("Policy: v1", 0, "hash1");
    const b = computeStableChunkId("Policy: v1", 1, "hash1");
    expect(a).not.toBe(b);
  });

  it("differs for different contentHash", () => {
    const a = computeStableChunkId("Policy: v1", 0, "hash1");
    const b = computeStableChunkId("Policy: v1", 0, "hash2");
    expect(a).not.toBe(b);
  });
});

describe("chunkPolicyDocument", () => {
  it("returns chunks with contentHash per chunk", () => {
    const content = "## Section\n\nParagraph one.\n\nParagraph two.";
    const chunks = chunkPolicyDocument(content, "test-source");
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    for (const c of chunks) {
      expect(c.content).toBeTruthy();
      expect(c.contentHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("produces deterministic stableIds when combined with computeStableChunkId", () => {
    const content = "## Scope\n\nThis policy applies.";
    const source = "BeaconGate Policy: policy_v1";
    const chunks = chunkPolicyDocument(content, source);
    const ids = chunks.map((c, i) => computeStableChunkId(source, i, c.contentHash));
    const ids2 = chunks.map((c, i) => computeStableChunkId(source, i, c.contentHash));
    expect(ids).toEqual(ids2);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("chunkPrecedentEntry", () => {
  it("returns single chunk with title, scenario, rules, outcome, rationale", () => {
    const chunks = chunkPrecedentEntry(
      "Title",
      "Scenario summary",
      ["RULE_1"],
      "REJECT",
      "Rationale"
    );
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toContain("Title:");
    expect(chunks[0].content).toContain("Scenario:");
    expect(chunks[0].contentHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("contentHash", () => {
  it("is deterministic", () => {
    expect(contentHash("hello")).toBe(contentHash("hello"));
    expect(contentHash("hello")).not.toBe(contentHash("world"));
  });
});
