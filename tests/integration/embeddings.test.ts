import { describe, it, expect } from "vitest";
import { embedOne, EMBEDDING_DIMS } from "@/lib/rag/embeddings";

describe("embeddings", () => {
  it.skip(
    "embedOne returns vector of length EMBEDDING_DIMS and L2 norm ~1 (slow; Xenova/Node env may fail)",
    async () => {
      const vec = await embedOne("short text");
      expect(vec).toHaveLength(EMBEDDING_DIMS);
      const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
      expect(norm).toBeGreaterThan(0.99);
      expect(norm).toBeLessThan(1.01);
    },
    { timeout: 60000 }
  );
});
