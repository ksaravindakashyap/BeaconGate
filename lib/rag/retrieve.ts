/**
 * Phase 3: Vector retrieval for policy + precedent.
 * - Cosine distance: pgvector operator <=> (smaller is better).
 * - ORDER BY ke.embedding <=> query_embedding (ASC = nearest first).
 * - Score in results: similarity = (1 - cosine_distance), so higher score = more similar.
 * - RetrievalRun.results stores chunkId, documentId, snippet, score (similarity).
 */

import { prisma } from "../db";
import { embedOne, EMBEDDING_MODEL, EMBEDDING_DIMS } from "./embeddings";

const DEFAULT_TOP_K = 6;

export interface RetrievalResultItem {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  docType: "POLICY" | "PRECEDENT";
  score: number;
  snippet: string;
  content?: string;
}

export interface RetrievalRunResult {
  policy: RetrievalResultItem[];
  precedent: RetrievalResultItem[];
}

function snippet(content: string, maxLen: number = 200): string {
  const t = content.replace(/\s+/g, " ").trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + "…";
}

/**
 * Build query text from case for embedding.
 */
export function buildQueryText(params: {
  adText: string;
  category: string;
  landingUrl: string;
  htmlSnippet?: string | null;
  redirectFinalDomain?: string | null;
}): string {
  const parts = [
    `Ad: ${params.adText}`,
    `Category: ${params.category}`,
    `Landing URL: ${params.landingUrl}`,
  ];
  if (params.htmlSnippet) parts.push(`Page excerpt: ${params.htmlSnippet}`);
  if (params.redirectFinalDomain) parts.push(`Final domain: ${params.redirectFinalDomain}`);
  return parts.join("\n");
}

/**
 * Run retrieval for a case: embed query, search policy + precedent, store RetrievalRun.
 */
export async function runRetrieval(
  caseId: string,
  queryText: string,
  options: { topK?: number; retrievalType?: "POLICY_ONLY" | "PRECEDENT_ONLY" | "BOTH" } = {}
): Promise<RetrievalRunResult> {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const retrievalType = options.retrievalType ?? "BOTH";
  const queryVector = await embedOne(queryText);
  if (queryVector.length !== EMBEDDING_DIMS) throw new Error("Embedding dim mismatch");
  const vectorStr = "[" + queryVector.join(",") + "]";

  const policyItems: RetrievalResultItem[] = [];
  const precedentItems: RetrievalResultItem[] = [];

  if (retrievalType === "POLICY_ONLY" || retrievalType === "BOTH") {
    const rows = await prisma.$queryRaw<
      { chunkId: string; documentId: string; title: string; content: string; score: number }[]
    >`
      SELECT kc.id AS "chunkId", kd.id AS "documentId", kd.title, kc.content,
             (1 - (ke.embedding <=> ${vectorStr}::vector))::float AS score
      FROM "KnowledgeEmbedding" ke
      JOIN "KnowledgeChunk" kc ON ke."chunkId" = kc.id
      JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
      WHERE kd.type = 'POLICY'
      ORDER BY ke.embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;
    for (const r of rows) {
      policyItems.push({
        chunkId: r.chunkId,
        documentId: r.documentId,
        documentTitle: r.title,
        docType: "POLICY",
        score: Number(r.score),
        snippet: snippet(r.content),
        content: r.content,
      });
    }
  }

  if (retrievalType === "PRECEDENT_ONLY" || retrievalType === "BOTH") {
    const rows = await prisma.$queryRaw<
      { chunkId: string; documentId: string; title: string; content: string; score: number }[]
    >`
      SELECT kc.id AS "chunkId", kd.id AS "documentId", kd.title, kc.content,
             (1 - (ke.embedding <=> ${vectorStr}::vector))::float AS score
      FROM "KnowledgeEmbedding" ke
      JOIN "KnowledgeChunk" kc ON ke."chunkId" = kc.id
      JOIN "KnowledgeDocument" kd ON kc."documentId" = kd.id
      WHERE kd.type = 'PRECEDENT'
      ORDER BY ke.embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;
    for (const r of rows) {
      precedentItems.push({
        chunkId: r.chunkId,
        documentId: r.documentId,
        documentTitle: r.title,
        docType: "PRECEDENT",
        score: Number(r.score),
        snippet: snippet(r.content),
        content: r.content,
      });
    }
  }

  const results: RetrievalRunResult = { policy: policyItems, precedent: precedentItems };
  await prisma.retrievalRun.create({
    data: {
      caseId,
      retrievalType,
      queryText,
      embedModel: EMBEDDING_MODEL,
      topK,
      results: JSON.parse(JSON.stringify(results)),
    },
  });
  return results;
}
