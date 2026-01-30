import { PrismaClient } from "@prisma/client";
import { RULES_CONFIG } from "./rules-config";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function main() {
  console.log("Seeding PolicyRule...");
  for (const r of RULES_CONFIG) {
    await prisma.policyRule.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        name: r.name,
        description: r.description,
        severity: r.severity,
        categoryScope: r.categoryScope,
        enabled: r.enabled,
        config: r.config as object,
      },
      update: {
        name: r.name,
        description: r.description,
        severity: r.severity,
        categoryScope: r.categoryScope,
        enabled: r.enabled,
        config: r.config as object,
      },
    });
  }

  const categories = ["HEALTH", "FINANCE", "DATING", "GAMBLING", "GENERAL"] as const;
  const ruleIds = (await prisma.policyRule.findMany({ where: { enabled: true } })).map((r) => r.id);

  console.log("Seeding cases and queue items...");
  for (let i = 0; i < 12; i++) {
    const adText =
      i === 1
        ? "Guaranteed results! Act now - 100% free trial."
        : i === 3
          ? "Lose weight fast. Consult your doctor before starting."
          : `Sample ad copy for campaign ${i + 1}.`;
    const category = categories[i % categories.length];
    const landingUrl =
      i === 5
        ? "https://risky-example.com/page"
        : `https://example-${i}.com/landing`;
    const hash = sha256(landingUrl);
    const evidence = await prisma.evidence.create({
      data: {
        landingUrl,
        evidenceHash: hash,
        notes: i % 2 === 0 ? "Seeded evidence." : null,
      },
    });

    const status: "NEW" | "IN_REVIEW" | "DECIDED" = i < 2 ? "DECIDED" : i < 5 ? "IN_REVIEW" : "NEW";
    const queueStatus: "OPEN" | "IN_REVIEW" | "CLOSED" = status === "DECIDED" ? "CLOSED" : status === "IN_REVIEW" ? "IN_REVIEW" : "OPEN";

    const c = await prisma.case.create({
      data: {
        adText,
        category,
        landingUrl,
        status,
        evidenceId: evidence.id,
      },
    });

    let triggeredCount = 0;
    if (i === 1) triggeredCount = 2;
    else if (i === 5) triggeredCount = 2;
    else if (i === 2) triggeredCount = 1;
    else if (i === 4) triggeredCount = 1;
    for (let r = 0; r < ruleIds.length; r++) {
      const triggered = r < triggeredCount;
      await prisma.ruleRun.create({
        data: {
          caseId: c.id,
          ruleId: ruleIds[r],
          triggered,
          matchedText: triggered ? "seeded match" : null,
          explanation: triggered ? "Seeded rule hit." : "No match.",
          evidenceRef: ruleIds[r] === "RULE_LANDING_DOMAIN_RISK" ? "LANDING_URL" : "AD_TEXT",
        },
      });
    }

    const ruleRuns = await prisma.ruleRun.findMany({
      where: { caseId: c.id },
      include: { rule: true },
    });
    let score = 10;
    for (const run of ruleRuns) {
      if (!run.triggered) continue;
      if (run.rule.severity === "HIGH") score += 50;
      else if (run.rule.severity === "MEDIUM") score += 25;
      else score += 10;
    }
    score = Math.min(100, score);
    const tier: "LOW" | "MEDIUM" | "HIGH" = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";

    await prisma.queueItem.create({
      data: {
        caseId: c.id,
        riskScore: score,
        tier,
        status: queueStatus,
      },
    });

    if (status === "DECIDED" && i < 2) {
      const outcome = i === 0 ? "APPROVE" : "REJECT";
      await prisma.reviewDecision.create({
        data: {
          caseId: c.id,
          outcome,
          reviewerNotes: i === 0 ? "Looks compliant." : "Prohibited phrase present.",
        },
      });
      const llmRuns = await prisma.lLMRun.findMany({ where: { caseId: c.id } });
      const decision = await prisma.reviewDecision.findUnique({ where: { caseId: c.id } });
      await prisma.caseFile.create({
        data: {
          caseId: c.id,
          version: 1,
          content: {
            case_id: c.id,
            evidence_summary: { landingUrl: evidence.landingUrl, evidenceHash: evidence.evidenceHash },
            rule_run_summary: ruleRuns.map((r) => ({ ruleId: r.ruleId, triggered: r.triggered, explanation: r.explanation })),
            llm_advisory: llmRuns.length > 0 ? { advisoryText: llmRuns[0].advisoryText, label: "LLM Advisory (non-binding)" } : null,
            reviewer_decision: decision ? { outcome: decision.outcome, notes: decision.reviewerNotes, decidedAt: decision.decidedAt } : null,
            created_at: new Date().toISOString(),
          },
        },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
