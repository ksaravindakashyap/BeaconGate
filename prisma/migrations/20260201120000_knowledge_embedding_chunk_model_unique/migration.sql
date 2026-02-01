-- Phase 3: Allow one embedding per (chunkId, model) so reindexing with a different model is possible.
-- Drop single-column unique on chunkId
DROP INDEX IF EXISTS "KnowledgeEmbedding_chunkId_key";

-- Add composite unique on (chunkId, model)
CREATE UNIQUE INDEX "KnowledgeEmbedding_chunkId_model_key" ON "KnowledgeEmbedding"("chunkId", "model");
