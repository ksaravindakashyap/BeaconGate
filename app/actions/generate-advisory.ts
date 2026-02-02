"use server";

import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { buildAdvisoryInput } from "@/lib/llm/advisoryInput";
import { generateAdvisory as runAdvisoryGeneration } from "@/lib/llm/provider";

export async function generateAdvisory(formData: FormData): Promise<void> {
  const caseId = formData.get("caseId") as string;
  if (!caseId) return;

  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      evidence: { include: { artifacts: true } },
      ruleRuns: { include: { rule: true } },
      retrievalRuns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!c) return;

  const storageDir = process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "storage", "evidence");

  let htmlSnippet = "";
  const htmlArtifact = c.evidence.artifacts.find((a) => a.type === "HTML_SNAPSHOT");
  if (htmlArtifact?.path) {
    try {
      const fullPath = path.join(storageDir, ...htmlArtifact.path.split("/").filter(Boolean));
      const raw = await fs.readFile(fullPath, "utf8");
      htmlSnippet = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500);
    } catch {
      htmlSnippet = "";
    }
  }

  let redirectChain: { url: string; status?: number }[] = [];
  const redirectArtifact = c.evidence.artifacts.find((a) => a.type === "REDIRECT_CHAIN");
  if (redirectArtifact?.path) {
    try {
      const fullPath = path.join(storageDir, ...redirectArtifact.path.split("/").filter(Boolean));
      const content = await fs.readFile(fullPath, "utf8");
      redirectChain = JSON.parse(content) as { url: string; status?: number }[];
    } catch {
      redirectChain = [];
    }
  }

  const screenshotArtifact = c.evidence.artifacts.find((a) => a.type === "SCREENSHOT");
  const retrievalRun = c.retrievalRuns[0] ?? null;
  const retrievalResults = retrievalRun?.results as {
    policy?: { chunkId: string; documentTitle: string; score: number; snippet: string }[];
    precedent?: { chunkId: string; documentTitle: string; score: number; snippet: string; outcome?: string }[];
  } | null;

  const input = buildAdvisoryInput({
    case: { id: c.id, category: c.category, adText: c.adText, landingUrl: c.landingUrl },
    evidence: { evidenceHash: c.evidence.evidenceHash, lastCapturedAt: c.evidence.lastCapturedAt },
    htmlSnippet,
    redirectChain,
    screenshotArtifactId: screenshotArtifact?.id ?? null,
    ruleRuns: c.ruleRuns.map((r) => ({
      id: r.id,
      ruleId: r.ruleId,
      triggered: r.triggered,
      matchedText: r.matchedText,
      evidenceRef: r.evidenceRef,
      explanation: r.explanation,
      rule: { severity: r.rule.severity },
    })),
    retrievalRun: retrievalRun
      ? { id: retrievalRun.id, results: retrievalResults ?? { policy: [], precedent: [] } }
      : null,
    topKPolicy: 6,
    topKPrecedent: 6,
  });

  const result = await runAdvisoryGeneration(input);

  let advisoryJson: object | undefined = result.advisoryJson ? (result.advisoryJson as object) : undefined;
  let citationsJson: object | undefined = result.citationsJson ? (result.citationsJson as object) : undefined;
  let errorMessage: string | null = result.errorMessage;

  if (advisoryJson && typeof advisoryJson === "object" && "policyConcerns" in advisoryJson) {
    const concerns = (advisoryJson as { policyConcerns?: { policyCitations?: { chunkId: string }[] }[] }).policyConcerns;
    if (Array.isArray(concerns)) {
      const chunkIds = concerns.flatMap((c) => (c.policyCitations ?? []).map((p) => p.chunkId)).filter(Boolean);
      if (chunkIds.length > 0) {
        const valid = await prisma.knowledgeChunk.findMany({
          where: { id: { in: chunkIds } },
          select: { id: true },
        });
        const validIds = new Set(valid.map((r) => r.id));
        const removedChunkIds = chunkIds.filter((id) => !validIds.has(id));
        if (removedChunkIds.length > 0) {
          const cleaned = JSON.parse(JSON.stringify(advisoryJson)) as { policyConcerns?: { policyCitations?: { chunkId: string }[] }[] };
          if (cleaned.policyConcerns) {
            for (const pc of cleaned.policyConcerns) {
              if (pc.policyCitations) {
                pc.policyCitations = pc.policyCitations.filter((cit) => validIds.has(cit.chunkId));
              }
            }
          }
          advisoryJson = cleaned;
          errorMessage = (errorMessage ? errorMessage + " " : "") + "Some policy citations were invalid (chunkId not found) and were removed: " + [...new Set(removedChunkIds)].join(", ");
          citationsJson = {
            ...(typeof citationsJson === "object" && citationsJson !== null ? citationsJson : {}),
            removedChunkIds: [...new Set(removedChunkIds)],
          };
        }
      }
    }
  }

  await prisma.lLMRun.create({
    data: {
      caseId,
      provider: result.provider,
      model: result.model,
      temperature: result.temperature,
      promptVersion: result.promptVersion,
      inputHash: result.inputHash,
      advisoryText: result.advisoryText,
      advisoryJson,
      citationsJson,
      errorMessage,
      latencyMs: result.latencyMs,
    },
  });

  revalidatePath(`/case/${caseId}`);
}
