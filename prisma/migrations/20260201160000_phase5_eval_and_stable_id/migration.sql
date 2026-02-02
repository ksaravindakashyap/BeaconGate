-- Phase 5: Evaluation harness + deterministic chunk stableId
ALTER TABLE "KnowledgeChunk" ADD COLUMN "stableId" TEXT;
CREATE UNIQUE INDEX "KnowledgeChunk_stableId_key" ON "KnowledgeChunk"("stableId");

CREATE TABLE "EvalSuite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    CONSTRAINT "EvalSuite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvalCase" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "adText" TEXT NOT NULL,
    "landingUrl" TEXT NOT NULL,
    "htmlText" TEXT,
    "redirectChain" JSONB,
    "groundTruth" JSONB NOT NULL,
    CONSTRAINT "EvalCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvalRun" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "config" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    CONSTRAINT "EvalRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EvalCase" ADD CONSTRAINT "EvalCase_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "EvalSuite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvalRun" ADD CONSTRAINT "EvalRun_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "EvalSuite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
