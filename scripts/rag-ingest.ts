/**
 * Phase 3 RAG ingest: policies + precedents → KnowledgeDocument, KnowledgeChunk, KnowledgeEmbedding.
 * Run: npm run rag:ingest
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const fs = require("fs").promises;
const { prisma } = require("../lib/db");
const { chunkPolicyDocument, chunkPrecedentEntry } = require("../lib/rag/chunker");
const { embed, EMBEDDING_DIMS, EMBEDDING_MODEL } = require("../lib/rag/embeddings");
const { randomBytes } = require("crypto");

function cuidLike(): string {
  const t = Date.now().toString(36);
  const r = randomBytes(6).toString("hex");
  return "c" + t + r;
}

async function ingestPolicies(ragDir: string) {
  const policiesDir = path.join(ragDir, "policies");
  try {
    await fs.access(policiesDir);
  } catch {
    console.log("No rag/policies folder, skipping policies.");
    return;
  }
  const files = await fs.readdir(policiesDir);
  const mdFiles = files.filter((f: string) => f.endsWith(".md"));
  for (const file of mdFiles) {
    const filePath = path.join(policiesDir, file);
    const content = await fs.readFile(filePath, "utf8");
    const source = `BeaconGate Policy: ${path.basename(file, ".md")}`;
    const title = path.basename(file, ".md").replace(/_/g, " ");
    const doc = await prisma.knowledgeDocument.create({
      data: {
        type: "POLICY",
        title,
        source,
      },
    });
    const chunks = chunkPolicyDocument(content, source);
    for (let i = 0; i < chunks.length; i++) {
      const { content: chunkContent, contentHash } = chunks[i];
      const chunk = await prisma.knowledgeChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: i,
          content: chunkContent,
          contentHash,
        },
      });
      const [vec] = await embed([chunkContent]);
      if (!vec || vec.length !== EMBEDDING_DIMS) throw new Error("Embedding dim mismatch");
      const embeddingStr = "[" + vec.join(",") + "]";
      await prisma.$executeRaw`
        INSERT INTO "KnowledgeEmbedding" (id, "chunkId", dims, model, embedding, "createdAt")
        VALUES (${cuidLike()}, ${chunk.id}, ${EMBEDDING_DIMS}, ${EMBEDDING_MODEL}, ${embeddingStr}::vector, NOW())
      `;
    }
    console.log(`Ingested policy: ${title} (${chunks.length} chunks)`);
  }
}

async function ingestPrecedents(ragDir: string) {
  const precedentsPath = path.join(ragDir, "precedents", "seed_precedents.json");
  let raw: string;
  try {
    raw = await fs.readFile(precedentsPath, "utf8");
  } catch {
    console.log("No rag/precedents/seed_precedents.json, skipping precedents.");
    return;
  }
  const entries = JSON.parse(raw);
  for (let idx = 0; idx < entries.length; idx++) {
    const e = entries[idx];
    const title = e.title ?? `Precedent ${idx + 1}`;
    const source = `Precedent: ${title}`;
    const doc = await prisma.knowledgeDocument.create({
      data: {
        type: "PRECEDENT",
        title,
        source,
      },
    });
    const chunks = chunkPrecedentEntry(
      e.title ?? "",
      e.scenarioSummary ?? "",
      e.triggeredRules ?? [],
      e.outcome ?? "",
      e.rationale ?? ""
    );
    for (let i = 0; i < chunks.length; i++) {
      const { content: chunkContent, contentHash } = chunks[i];
      const chunk = await prisma.knowledgeChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: i,
          content: chunkContent,
          contentHash,
        },
      });
      const [vec] = await embed([chunkContent]);
      if (!vec || vec.length !== EMBEDDING_DIMS) throw new Error("Embedding dim mismatch");
      const embeddingStr = "[" + vec.join(",") + "]";
      await prisma.$executeRaw`
        INSERT INTO "KnowledgeEmbedding" (id, "chunkId", dims, model, embedding, "createdAt")
        VALUES (${cuidLike()}, ${chunk.id}, ${EMBEDDING_DIMS}, ${EMBEDDING_MODEL}, ${embeddingStr}::vector, NOW())
      `;
    }
    console.log(`Ingested precedent: ${title} (${chunks.length} chunks)`);
  }
}

async function main() {
  if (process.argv.includes("--reindex")) {
    console.log("REINDEX=1: clearing existing RAG data...");
    await prisma.$executeRaw`DELETE FROM "KnowledgeEmbedding"`;
    await prisma.knowledgeChunk.deleteMany({});
    await prisma.knowledgeDocument.deleteMany({});
    console.log("Cleared.");
  }
  const ragDir = path.join(process.cwd(), "rag");
  console.log("RAG ingest from", ragDir);
  await ingestPolicies(ragDir);
  await ingestPrecedents(ragDir);
  const docCount = await prisma.knowledgeDocument.count();
  const chunkCount = await prisma.knowledgeChunk.count();
  const embCount = await prisma.$queryRaw`SELECT COUNT(*)::int as c FROM "KnowledgeEmbedding"`;
  console.log("Done. Documents:", docCount, "Chunks:", chunkCount, "Embeddings:", (embCount as { c: number }[])[0]?.c ?? 0);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
