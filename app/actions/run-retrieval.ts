"use server";

import { prisma } from "@/lib/db";
import { runRetrieval, buildQueryText } from "@/lib/rag/retrieve";
import { revalidatePath } from "next/cache";

async function runRetrievalAction(caseIdOrFormData: string | FormData) {
  const caseId = typeof caseIdOrFormData === "string" ? caseIdOrFormData : (caseIdOrFormData.get("caseId") as string);
  if (!caseId) return { error: "Case ID required" };
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      evidence: {
        include: {
          artifacts: true,
        },
      },
    },
  });
  if (!c) return { error: "Case not found" };

  const htmlArtifact = c.evidence.artifacts.find((a) => a.type === "HTML_SNAPSHOT");
  let htmlSnippet: string | null = null;
  if (htmlArtifact?.path) {
    try {
      const path = await import("path");
      const fs = await import("fs/promises");
      const storageDir = process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "storage", "evidence");
      const fullPath = path.join(storageDir, ...htmlArtifact.path.split("/").filter(Boolean));
      const raw = await fs.readFile(fullPath, "utf8");
      const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      htmlSnippet = text.slice(0, 500);
    } catch {
      // ignore
    }
  }

  const redirectArtifact = c.evidence.artifacts.find((a) => a.type === "REDIRECT_CHAIN");
  let redirectFinalDomain: string | null = null;
  if (redirectArtifact?.path) {
    try {
      const path = await import("path");
      const fs = await import("fs/promises");
      const storageDir = process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "storage", "evidence");
      const fullPath = path.join(storageDir, ...redirectArtifact.path.split("/").filter(Boolean));
      const raw = await fs.readFile(fullPath, "utf8");
      const chain = JSON.parse(raw) as { url: string }[];
      if (chain.length > 0) {
        const lastUrl = chain[chain.length - 1].url;
        redirectFinalDomain = new URL(lastUrl).hostname;
      }
    } catch {
      // ignore
    }
  }

  const queryText = buildQueryText({
    adText: c.adText,
    category: c.category,
    landingUrl: c.evidence.landingUrl,
    htmlSnippet,
    redirectFinalDomain,
  });

  await runRetrieval(caseId, queryText, { retrievalType: "BOTH" });
  revalidatePath(`/case/${caseId}`);
}

/** Form action wrapper for use in forms (returns void). */
export async function runRetrievalFormAction(formData: FormData) {
  await runRetrievalAction(formData);
}
