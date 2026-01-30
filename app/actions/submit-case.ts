"use server";

import { prisma } from "@/lib/db";
import { addEvidenceCaptureJob } from "@/lib/queue";
import { validateUrlForCapture } from "@/lib/capture/ssrfGuards";
import { submitCaseSchema } from "@/lib/validations";
import { createHash } from "crypto";
import { redirect } from "next/navigation";
import type { Category } from "@prisma/client";

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export async function submitCase(
  _prevState: { error?: Record<string, string[]> } | null,
  formData: FormData
) {
  const raw = {
    adText: formData.get("adText") as string,
    category: formData.get("category") as string,
    landingUrl: formData.get("landingUrl") as string,
  };
  const parsed = submitCaseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { adText, category, landingUrl } = parsed.data;

  const ssrf = await validateUrlForCapture(landingUrl);
  if (!ssrf.ok) {
    return { error: { landingUrl: [ssrf.error ?? "URL not allowed (SSRF check failed)"] } };
  }

  const evidenceHash = sha256(landingUrl);
  const evidence = await prisma.evidence.create({
    data: {
      landingUrl,
      screenshotPath: null,
      evidenceHash,
      notes: null,
    },
  });

  const c = await prisma.case.create({
    data: {
      adText,
      category: category as Category,
      landingUrl,
      status: "CAPTURING",
      evidenceId: evidence.id,
    },
  });

  await addEvidenceCaptureJob({
    caseId: c.id,
    evidenceId: evidence.id,
    landingUrl,
    adText,
    category,
  });

  await prisma.queueItem.create({
    data: {
      caseId: c.id,
      riskScore: 10,
      tier: "LOW",
      status: "OPEN",
    },
  });

  redirect(`/case/${c.id}`);
}
