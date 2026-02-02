import { describe, it, expect } from "vitest";
import { buildQueryText } from "@/lib/rag/retrieve";

describe("buildQueryText", () => {
  it("includes adText, category, landingUrl", () => {
    const q = buildQueryText({
      adText: "Buy now",
      category: "GENERAL",
      landingUrl: "https://example.com",
    });
    expect(q).toContain("Buy now");
    expect(q).toContain("GENERAL");
    expect(q).toContain("https://example.com");
  });

  it("includes htmlSnippet when provided", () => {
    const q = buildQueryText({
      adText: "Ad",
      category: "HEALTH",
      landingUrl: "https://example.com",
      htmlSnippet: "Page excerpt here",
    });
    expect(q).toContain("Page excerpt here");
  });

  it("includes redirectFinalDomain when provided", () => {
    const q = buildQueryText({
      adText: "Ad",
      category: "GENERAL",
      landingUrl: "https://example.com",
      redirectFinalDomain: "https://final.com",
    });
    expect(q).toContain("https://final.com");
  });

  it("omits optional parts when null", () => {
    const q = buildQueryText({
      adText: "Ad",
      category: "GENERAL",
      landingUrl: "https://example.com",
      htmlSnippet: null,
      redirectFinalDomain: null,
    });
    expect(q).not.toContain("Page excerpt");
    expect(q).not.toContain("Final domain");
  });
});
