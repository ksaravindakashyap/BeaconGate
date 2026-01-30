"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const MOCK_ADVISORY =
  "This is a placeholder LLM advisory (Phase 1). In a later phase, an LLM would analyze the ad text and landing context. Output is advisory only and must not be used as the sole basis for a decision.";

export async function generateAdvisory(formData: FormData): Promise<void> {
  const caseId = formData.get("caseId") as string;
  if (!caseId) return;
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) return;

  const existing = await prisma.lLMRun.findFirst({ where: { caseId } });
  if (existing) {
    revalidatePath(`/case/${caseId}`);
    return;
  }

  await prisma.lLMRun.create({
    data: {
      caseId,
      advisoryText: MOCK_ADVISORY,
      model: "placeholder-phase1",
      temperature: 0,
      promptVersion: "v0",
    },
  });

  revalidatePath(`/case/${caseId}`);
}
