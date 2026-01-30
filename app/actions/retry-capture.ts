"use server";

import { prisma } from "@/lib/db";
import { addEvidenceCaptureJob } from "@/lib/queue";
import { revalidatePath } from "next/cache";

export async function retryCapture(caseId: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { evidence: true },
  });
  if (!c) return { error: "Case not found" };
  if (c.status !== "CAPTURING") return { error: "Case is not in CAPTURING state" };

  const maxAttempt = await prisma.evidenceCaptureRun.aggregate({
    where: { evidenceId: c.evidenceId },
    _max: { attempt: true },
  });
  const attempt = (maxAttempt._max.attempt ?? 0) + 1;

  await addEvidenceCaptureJob({
    caseId: c.id,
    evidenceId: c.evidenceId,
    landingUrl: c.evidence.landingUrl,
    adText: c.adText,
    category: c.category,
    attempt,
  });

  revalidatePath(`/case/${caseId}`);
  return { success: true };
}

export async function retryCaptureForm(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  if (caseId) await retryCapture(caseId);
}
