import { describe, it, expect } from "vitest";
import {
  sha256String,
  sha256Buffer,
  bundleHashPayload,
  sha256Bundle,
} from "@/lib/capture/hash";
import { hashAdvisoryInput } from "@/lib/llm/hash";
import type { AdvisoryInput } from "@/lib/llm/advisoryInput";

describe("sha256String", () => {
  it("returns 64 hex chars", () => {
    const h = sha256String("hello");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", () => {
    expect(sha256String("same")).toBe(sha256String("same"));
    expect(sha256String("a")).not.toBe(sha256String("b"));
  });
});

describe("sha256Buffer", () => {
  it("returns 64 hex chars", () => {
    const h = sha256Buffer(Buffer.from("hello", "utf8"));
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("bundleHashPayload and sha256Bundle", () => {
  it("sorts keys so same payload gives same hash", () => {
    const a = { z: 1, a: 2 };
    const b = { a: 2, z: 1 };
    expect(sha256Bundle(a)).toBe(sha256Bundle(b));
  });

  it("different payload gives different hash", () => {
    expect(sha256Bundle({ a: 1 })).not.toBe(sha256Bundle({ a: 2 }));
  });

  it("bundleHashPayload is deterministic string", () => {
    const s = bundleHashPayload({ b: 1, a: 2 });
    expect(typeof s).toBe("string");
    expect(JSON.parse(s)).toEqual({ a: 2, b: 1 });
  });
});

describe("hashAdvisoryInput", () => {
  const minimalInput: AdvisoryInput = {
    case: { id: "c1", category: "GENERAL", adText: "Ad", landingUrl: "https://x.com" },
    evidence: {
      redirectChain: [],
      htmlSnippet: "",
      evidenceHash: "h",
      lastCapturedAt: null,
    },
    ruleRuns: [],
    retrieval: { lastRunId: null, policyMatches: [], precedentMatches: [] },
    generationParams: { topKPolicy: 6, topKPrecedent: 6 },
  };

  it("same input => same hash", () => {
    expect(hashAdvisoryInput(minimalInput)).toBe(hashAdvisoryInput(minimalInput));
  });

  it("different adText => different hash", () => {
    const a = hashAdvisoryInput(minimalInput);
    const b = hashAdvisoryInput({
      ...minimalInput,
      case: { ...minimalInput.case, adText: "Other ad" },
    });
    expect(a).not.toBe(b);
  });
});
