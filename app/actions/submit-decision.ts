"use server";

import { prisma } from "@/lib/db";
import { decisionSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DecisionOutcome } from "@prisma/client";

export async function submitDecision(formData: FormData): Promise<void> {
  const caseId = formData.get("caseId") as string;
  if (!caseId) {
    redirect("/queue");
  }
  const raw = {
    outcome: formData.get("outcome") as string,
    reviewerNotes: formData.get("reviewerNotes") as string | null,
  };
  const parsed = decisionSchema.safeParse({
    outcome: raw.outcome,
    reviewerNotes: raw.reviewerNotes || undefined,
  });
  if (!parsed.success) {
    redirect(`/case/${caseId}?error=validation`);
  }
  const { outcome, reviewerNotes } = parsed.data;

  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      evidence: true,
      ruleRuns: { include: { rule: true } },
      llmRuns: true,
    },
  });
  if (!c) redirect("/queue");
  if (c.status === "DECIDED") redirect(`/case/${caseId}?alreadyDecided=1`);

  await prisma.reviewDecision.create({
    data: {
      caseId,
      outcome: outcome as DecisionOutcome,
      reviewerNotes: reviewerNotes ?? null,
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: "DECIDED" },
  });

  const queueItem = await prisma.queueItem.findUnique({ where: { caseId } });
  if (queueItem) {
    await prisma.queueItem.update({
      where: { id: queueItem.id },
      data: { status: "CLOSED" },
    });
  }

  const decision = await prisma.reviewDecision.findUnique({ where: { caseId } });
  const caseFileContent = {
    case_id: caseId,
    evidence_summary: {
      landingUrl: c.evidence.landingUrl,
      evidenceHash: c.evidence.evidenceHash,
      screenshotPath: c.evidence.screenshotPath,
    },
    rule_run_summary: c.ruleRuns.map((r) => ({
      ruleId: r.ruleId,
      severity: r.rule.severity,
      triggered: r.triggered,
      matchedText: r.matchedText,
      explanation: r.explanation,
      evidenceRef: r.evidenceRef,
    })),
    llm_advisory:
      c.llmRuns.length > 0
        ? {
            label: "LLM Advisory (non-binding)",
            advisoryText: c.llmRuns[0].advisoryText,
            model: c.llmRuns[0].model,
          }
        : null,
    reviewer_decision: decision
      ? {
          outcome: decision.outcome,
          notes: decision.reviewerNotes,
          decidedAt: decision.decidedAt,
        }
      : null,
    created_at: new Date().toISOString(),
  };

  await prisma.caseFile.create({
    data: {
      caseId,
      version: 1,
      content: caseFileContent,
    },
  });

  revalidatePath(`/case/${caseId}`);
  revalidatePath("/queue");
  revalidatePath("/dashboard");
  redirect(`/case/${caseId}`);
}
