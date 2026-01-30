/**
 * Phase 2 evidence capture worker.
 * Run with: npm run worker
 * Requires: REDIS_URL, DATABASE_URL, EVIDENCE_STORAGE_DIR
 */
import type { Job } from "bullmq";
import type { EvidenceCaptureJobData } from "../lib/queue";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const fs = require("fs").promises;
const { createWorker } = require("../lib/queue");
const { prisma } = require("../lib/db");
const { runPlaywrightCapture } = require("../lib/capture/playwrightCapture");
const { runRules, computeRiskScore } = require("../lib/rules/runner");
const { getArtifactRecordsFromCapture } = require("../lib/evidence/writeArtifacts");
import type { ArtifactRecord } from "../lib/evidence/writeArtifacts";

const EVIDENCE_STORAGE_DIR = process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "storage", "evidence");

async function processEvidenceCapture(job: Job<EvidenceCaptureJobData>) {
  const { caseId, evidenceId, landingUrl, adText, category, attempt } = job.data;

  const run = await prisma.evidenceCaptureRun.create({
    data: {
      evidenceId,
      status: "RUNNING",
      startedAt: new Date(),
      attempt: attempt ?? 1,
    },
  });

  await prisma.evidence.update({
    where: { id: evidenceId },
    data: { currentCaptureRunId: run.id },
  });

  const captureResult = await runPlaywrightCapture({
    evidenceId,
    captureRunId: run.id,
    landingUrl,
    storageDir: EVIDENCE_STORAGE_DIR,
  });

  if (!captureResult.success) {
    await prisma.evidenceCaptureRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: captureResult.error,
      },
    });
    return;
  }

  const result = captureResult;
  const runDir = path.join(EVIDENCE_STORAGE_DIR, evidenceId, run.id);
  await fs.mkdir(runDir, { recursive: true });

  const artifactMeta = { viewport: result.viewport, userAgent: result.userAgent };
  const artifactRecords = getArtifactRecordsFromCapture(evidenceId, run.id, result);
  let screenshotArtifactId: string | null = null;
  for (const rec of artifactRecords) {
    const artifact = await prisma.evidenceArtifact.create({
      data: {
        evidenceId,
        type: rec.type,
        path: rec.path,
        sha256: rec.sha256,
        byteSize: rec.byteSize,
        mimeType: rec.mimeType,
        meta: artifactMeta,
      },
    });
    if (rec.type === "SCREENSHOT") screenshotArtifactId = artifact.id;
  }

  await prisma.evidence.update({
    where: { id: evidenceId },
    data: {
      evidenceHash: result.bundleHash,
      lastCapturedAt: new Date(result.capturedAt),
      screenshotPath: screenshotArtifactId,
    },
  });

  const htmlArtifact = artifactRecords.find((r: ArtifactRecord) => r.type === "HTML_SNAPSHOT");
  const redirectArtifact = artifactRecords.find((r: ArtifactRecord) => r.type === "REDIRECT_CHAIN");
  const htmlPath = htmlArtifact
    ? path.join(EVIDENCE_STORAGE_DIR, htmlArtifact.path)
    : null;
  let htmlContent: string | null = null;
  let redirectChain: { url: string; status?: number }[] = [];
  if (htmlPath) {
    try {
      htmlContent = await fs.readFile(htmlPath, "utf8");
    } catch {
      // ignore
    }
  }
  const redirectPath = redirectArtifact
    ? path.join(EVIDENCE_STORAGE_DIR, redirectArtifact.path)
    : null;
  if (redirectPath) {
    try {
      const raw = await fs.readFile(redirectPath, "utf8");
      redirectChain = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  await runRules(caseId, {
    adText: adText ?? "",
    category,
    landingUrl,
    htmlContent: htmlContent ?? undefined,
    redirectChain: redirectChain.length ? redirectChain : undefined,
  });

  const ruleRuns = await prisma.ruleRun.findMany({
    where: { caseId },
    include: { rule: true },
  });
  const { score: riskScore, tier } = computeRiskScore(ruleRuns);
  const queueItem = await prisma.queueItem.findFirst({
    where: { caseId },
  });
  if (queueItem) {
    await prisma.queueItem.update({
      where: { id: queueItem.id },
      data: { riskScore, tier },
    });
  }

  const isPartialCapture = result.timedOut === true;

  await prisma.evidenceCaptureRun.update({
    where: { id: run.id },
    data: isPartialCapture
      ? {
          status: "FAILED",
          finishedAt: new Date(),
          errorMessage: result.error
            ? `${result.error} (artifacts captured)`
            : "Navigation timeout (artifacts captured)",
        }
      : { status: "SUCCEEDED", finishedAt: new Date() },
  });

  if (!isPartialCapture) {
    await prisma.case.update({
      where: { id: caseId },
      data: { status: "READY_FOR_REVIEW" },
    });
  }
}

const worker = createWorker(processEvidenceCapture);
worker.run().catch((err: unknown) => {
  console.error("Worker error:", err);
  process.exit(1);
});