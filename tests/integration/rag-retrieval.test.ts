import { describe, it, expect, beforeAll } from "vitest";
import { runRetrievalQueryOnly, buildQueryText } from "@/lib/rag/retrieve";
import { prisma } from "@/lib/db";

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("RAG retrieval integration", () => {
  beforeAll(async () => {
    if (!hasDb) return;
    const docCount = await prisma.knowledgeDocument.count();
    if (docCount === 0) {
      console.warn("No KnowledgeDocument in DB; run rag:ingest first. Skipping retrieval assertions.");
    }
  });

  it("runRetrievalQueryOnly returns policy and precedent arrays", async () => {
    const queryText = buildQueryText({
      adText: "Health disclaimer required",
      category: "HEALTH",
      landingUrl: "https://example.com",
    });
    const result = await runRetrievalQueryOnly(queryText, { topK: 3, retrievalType: "BOTH" });
    expect(result).toHaveProperty("policy");
    expect(result).toHaveProperty("precedent");
    expect(Array.isArray(result.policy)).toBe(true);
    expect(Array.isArray(result.precedent)).toBe(true);
  });

  it("result items have chunkId, stableChunkId or chunkId, score, snippet", async () => {
    const queryText = buildQueryText({
      adText: "Policy and precedent",
      category: "GENERAL",
      landingUrl: "https://example.com",
    });
    const result = await runRetrievalQueryOnly(queryText, { topK: 2 });
    for (const item of [...result.policy, ...result.precedent]) {
      expect(item).toHaveProperty("chunkId");
      expect(item).toHaveProperty("score");
      expect(item).toHaveProperty("snippet");
      expect(typeof item.score).toBe("number");
    }
  });
});
