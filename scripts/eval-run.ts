/**
 * Phase 5: Evaluation harness CLI — seed suite/cases, run evaluation, print latest.
 * npm run eval:seed | eval:run | eval:latest
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const path = require("path");
const fs = require("fs").promises;
const { prisma } = require("../lib/db");
const { runRulesOnInput } = require("../lib/rules/runner");
const { buildQueryText, runRetrievalQueryOnly } = require("../lib/rag/retrieve");
const { buildAdvisoryInput } = require("../lib/llm/advisoryInput");
const { generateAdvisory } = require("../lib/llm/provider");
const { parseAdvisoryJson, NON_BINDING_NOTICE_VALUE } = require("../lib/llm/schema");
const { RULES_CONFIG } = require("../prisma/rules-config");

const SUITE_NAME = "phase5_v1";
const EVAL_CASES_PATH = path.join(process.cwd(), "eval", "phase5_v1", "eval_cases.json");
const DEFAULT_TOP_K = 6;

interface GroundTruth {
  expectedTriggeredRuleIds: string[];
  expectedPolicyChunkMustHit: string[];
  expectedPrecedentMustHit: string[];
  expectedAdvisory: {
    mustContainSignals: string[];
    maxInvalidCitations: number;
    nonBindingNoticeRequired: boolean;
  };
}

interface EvalCaseJson {
  title: string;
  category: string;
  adText: string;
  landingUrl: string;
  htmlText?: string | null;
  redirectChain?: { url: string }[] | null;
  groundTruth: GroundTruth;
}

async function seedSuite() {
  const raw = await fs.readFile(EVAL_CASES_PATH, "utf8");
  const cases: EvalCaseJson[] = JSON.parse(raw);

  let suite = await prisma.evalSuite.findFirst({ where: { name: SUITE_NAME } });
  if (!suite) {
    suite = await prisma.evalSuite.create({
      data: {
        name: SUITE_NAME,
        description: "Phase 5 evaluation suite — rules, retrieval, advisory hygiene",
      },
    });
    console.log("Created EvalSuite:", suite.id, suite.name);
  } else {
    console.log("Using existing EvalSuite:", suite.id, suite.name);
  }

  await prisma.evalCase.deleteMany({ where: { suiteId: suite.id } });

  for (const c of cases) {
    await prisma.evalCase.create({
      data: {
        suiteId: suite.id,
        title: c.title,
        category: c.category,
        adText: c.adText,
        landingUrl: c.landingUrl,
        htmlText: c.htmlText ?? null,
        redirectChain: c.redirectChain ?? null,
        groundTruth: c.groundTruth as object,
      },
    });
  }
  console.log("Seeded", cases.length, "EvalCases.");
}

function rulesMetrics(
  expectedIds: string[],
  actualTriggered: string[]
): { tp: number; fp: number; fn: number; expected: string[]; actual: string[] } {
  const expectedSet = new Set(expectedIds);
  const actualSet = new Set(actualTriggered);
  let tp = 0;
  for (const id of actualSet) {
    if (expectedSet.has(id)) tp++;
  }
  const fp = actualSet.size - tp;
  let fn = 0;
  for (const id of expectedSet) {
    if (!actualSet.has(id)) fn++;
  }
  return {
    tp,
    fp,
    fn,
    expected: expectedIds,
    actual: [...actualSet],
  };
}

function microPrecisionRecallF1(
  cases: { tp: number; fp: number; fn: number }[]
): { precision: number; recall: number; f1: number } {
  let tp = 0,
    fp = 0,
    fn = 0;
  for (const c of cases) {
    tp += c.tp;
    fp += c.fp;
    fn += c.fn;
  }
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}

async function runEval() {
  const suite = await prisma.evalSuite.findFirst({
    where: { name: SUITE_NAME },
    include: { cases: true },
  });
  if (!suite) {
    console.error("Run eval:seed first.");
    process.exit(1);
  }
  if (suite.cases.length === 0) {
    console.error("No eval cases. Run eval:seed first.");
    process.exit(1);
  }

  const rules = await prisma.policyRule.findMany({ where: { enabled: true } });
  const ruleSeverity: Record<string, string> = {};
  for (const r of RULES_CONFIG) {
    ruleSeverity[r.id] = r.severity;
  }

  const startMs = Date.now();
  const config = {
    topK: DEFAULT_TOP_K,
    retrievalType: "BOTH",
    embedModel: "Xenova/all-MiniLM-L6-v2",
    ruleVersion: "seed",
    provider: "mock",
  };

  const caseResults: {
    evalCaseId: string;
    title: string;
    category: string;
    rules: { expected: string[]; actual: string[]; tp: number; fp: number; fn: number };
    retrieval: { policyHit: boolean; precedentHit: boolean; policyTop: unknown[]; precedentTop: unknown[] };
    advisory: {
      schemaValid: boolean;
      invalidCitations: number;
      nonBindingOk: boolean;
      signalsHit: boolean;
    };
  }[] = [];

  for (const ec of suite.cases) {
    const gt = ec.groundTruth as GroundTruth;
    const redirectChain = (ec.redirectChain as { url: string }[] | null) ?? [];
    const htmlContent = ec.htmlText ?? "";

    const input = {
      adText: ec.adText,
      category: ec.category,
      landingUrl: ec.landingUrl,
      htmlContent: htmlContent || undefined,
      redirectChain: redirectChain.length > 0 ? redirectChain : undefined,
    };

    const ruleRuns = runRulesOnInput(input, rules.map((r: { id: string; config: unknown }) => ({ id: r.id, config: r.config })));
    const actualTriggered = ruleRuns.filter((r: { triggered: boolean }) => r.triggered).map((r: { ruleId: string }) => r.ruleId);
    const rulesResult = rulesMetrics(gt.expectedTriggeredRuleIds, actualTriggered);

    const queryText = buildQueryText({
      adText: ec.adText,
      category: ec.category,
      landingUrl: ec.landingUrl,
      htmlSnippet: htmlContent || null,
      redirectFinalDomain: redirectChain.length > 0 ? redirectChain[redirectChain.length - 1].url : null,
    });
    const retrievalResult = await runRetrievalQueryOnly(queryText, {
      topK: config.topK,
      retrievalType: "BOTH",
    });

    const policyStableIds = new Set(
      retrievalResult.policy.map((p: { stableChunkId: string | null; chunkId: string }) => p.stableChunkId ?? p.chunkId).filter(Boolean)
    );
    const precedentStableIds = new Set(
      retrievalResult.precedent.map((p: { stableChunkId: string | null; chunkId: string }) => p.stableChunkId ?? p.chunkId).filter(Boolean)
    );
    const precedentDocIds = new Set(retrievalResult.precedent.map((p: { documentId: string }) => p.documentId));

    const policyHit = gt.expectedPolicyChunkMustHit.some((id) => policyStableIds.has(id));
    const precedentHit = gt.expectedPrecedentMustHit.some(
      (id) => precedentStableIds.has(id) || precedentDocIds.has(id)
    );

    const policyMatchesForAdvisory = retrievalResult.policy.map((p: { stableChunkId: string | null; chunkId: string; documentTitle: string; score: number; snippet: string }) => ({
      chunkId: p.stableChunkId ?? p.chunkId,
      documentTitle: p.documentTitle,
      score: p.score,
      snippet: p.snippet,
    }));
    const precedentMatchesForAdvisory = retrievalResult.precedent.map((p: { stableChunkId: string | null; chunkId: string; documentTitle: string; score: number; snippet: string }) => ({
      chunkId: p.stableChunkId ?? p.chunkId,
      documentTitle: p.documentTitle,
      score: p.score,
      snippet: p.snippet,
    }));

    const advisoryInput = buildAdvisoryInput({
      case: {
        id: ec.id,
        category: ec.category,
        adText: ec.adText,
        landingUrl: ec.landingUrl,
      },
      evidence: { evidenceHash: "eval", lastCapturedAt: null },
      htmlSnippet: htmlContent.slice(0, 1500),
      redirectChain,
      screenshotArtifactId: null,
      ruleRuns: ruleRuns.map((r: { ruleId: string; triggered: boolean; matchedText: string | null; evidenceRef: string; explanation: string }, i: number) => ({
        id: `eval-${ec.id}-${i}`,
        ruleId: r.ruleId,
        triggered: r.triggered,
        matchedText: r.matchedText,
        evidenceRef: r.evidenceRef,
        explanation: r.explanation,
        rule: { severity: ruleSeverity[r.ruleId] ?? "LOW" },
      })),
      retrievalRun: {
        id: "eval",
        results: { policy: policyMatchesForAdvisory, precedent: precedentMatchesForAdvisory },
      },
      topKPolicy: config.topK,
      topKPrecedent: config.topK,
    });

    const origKey = process.env.OPENAI_API_KEY;
    try {
      delete process.env.OPENAI_API_KEY;
      var advisoryResult = await generateAdvisory(advisoryInput);
    } finally {
      if (origKey !== undefined) process.env.OPENAI_API_KEY = origKey;
    }
    const parsed = parseAdvisoryJson(advisoryResult.advisoryJson);
    const schemaValid = parsed.success;
    let invalidCitations = 0;
    let nonBindingOk = false;
    let signalsHit = false;

    if (parsed.success) {
      nonBindingOk = parsed.data.nonBindingNotice === NON_BINDING_NOTICE_VALUE;
      const citationIds =
        parsed.data.policyConcerns?.flatMap((c: { policyCitations?: { chunkId: string }[] }) => c.policyCitations?.map((p: { chunkId: string }) => p.chunkId) ?? []) ?? [];
      for (const id of citationIds) {
        if (!policyStableIds.has(id)) invalidCitations++;
      }
      const signals = parsed.data.evasionSignals?.map((e: { signal: string }) => e.signal.toLowerCase()) ?? [];
      const required = (gt.expectedAdvisory?.mustContainSignals ?? []).map((s: string) => s.toLowerCase());
      signalsHit =
        required.length === 0 || required.some((r: string) => signals.some((s: string) => s.includes(r) || r.includes(s)));
    }

    caseResults.push({
      evalCaseId: ec.id,
      title: ec.title,
      category: ec.category,
      rules: {
        expected: rulesResult.expected,
        actual: rulesResult.actual,
        tp: rulesResult.tp,
        fp: rulesResult.fp,
        fn: rulesResult.fn,
      },
      retrieval: {
        policyHit,
        precedentHit,
        policyTop: retrievalResult.policy.map((p: { stableChunkId: string | null; documentTitle: string; score: number; snippet?: string }) => ({
          stableChunkId: p.stableChunkId,
          documentTitle: p.documentTitle,
          score: p.score,
          snippet: p.snippet?.slice(0, 120),
        })),
        precedentTop: retrievalResult.precedent.map((p: { stableChunkId: string | null; documentTitle: string; score: number; snippet?: string }) => ({
          stableChunkId: p.stableChunkId,
          documentTitle: p.documentTitle,
          score: p.score,
          snippet: p.snippet?.slice(0, 120),
        })),
      },
      advisory: {
        schemaValid,
        invalidCitations,
        nonBindingOk,
        signalsHit,
      },
    });
  }

  const durationMs = Date.now() - startMs;

  const rulesAgg = microPrecisionRecallF1(caseResults.map((c: { rules: { tp: number; fp: number; fn: number } }) => c.rules));
  const policyHitRate =
    caseResults.filter((c: { retrieval: { policyHit: boolean } }) => c.retrieval.policyHit).length / caseResults.length;
  const precedentHitRate =
    caseResults.filter((c: { retrieval: { precedentHit: boolean } }) => c.retrieval.precedentHit).length / caseResults.length;
  const schemaValidRate =
    caseResults.filter((c: { advisory: { schemaValid: boolean } }) => c.advisory.schemaValid).length / caseResults.length;
  const citationValidRate =
    caseResults.filter((c: { advisory: { invalidCitations: number } }) => c.advisory.invalidCitations === 0).length / caseResults.length;
  const nonBindingRate =
    caseResults.filter((c: { advisory: { nonBindingOk: boolean } }) => c.advisory.nonBindingOk).length / caseResults.length;
  const signalHitRate =
    caseResults.filter((c: { advisory: { signalsHit: boolean } }) => c.advisory.signalsHit).length / caseResults.length;

  const metrics = {
    rules: { precision: rulesAgg.precision, recall: rulesAgg.recall, f1: rulesAgg.f1 },
    retrieval: { policyHitRate, precedentHitRate },
    advisory: {
      schemaValidRate,
      citationValidRate,
      nonBindingComplianceRate: nonBindingRate,
      signalHitRate,
    },
  };

  const summary = [
    `Rules P/R/F1: ${(rulesAgg.precision * 100).toFixed(1)}% / ${(rulesAgg.recall * 100).toFixed(1)}% / ${(rulesAgg.f1 * 100).toFixed(1)}%`,
    `Policy hit @${config.topK}: ${(policyHitRate * 100).toFixed(1)}%`,
    `Precedent hit @${config.topK}: ${(precedentHitRate * 100).toFixed(1)}%`,
    `Advisory schema valid: ${(schemaValidRate * 100).toFixed(1)}%`,
    `Citation valid: ${(citationValidRate * 100).toFixed(1)}%`,
    `Non-binding compliance: ${(nonBindingRate * 100).toFixed(1)}%`,
    `Signal hit: ${(signalHitRate * 100).toFixed(1)}%`,
    `Duration: ${durationMs}ms`,
  ].join(" | ");

  await prisma.evalRun.create({
    data: {
      suiteId: suite.id,
      config: config as object,
      results: { config, metrics, cases: caseResults } as object,
      summary,
      durationMs,
    },
  });

  console.log("EvalRun completed.", summary);
}

async function printLatest() {
  const run = await prisma.evalRun.findFirst({
    where: { suite: { name: SUITE_NAME } },
    orderBy: { createdAt: "desc" },
    include: { suite: true },
  });
  if (!run) {
    console.log("No EvalRun found. Run eval:run first.");
    return;
  }
  const results = run.results as { metrics?: unknown; cases?: unknown[] };
  console.log("Suite:", run.suite.name);
  console.log("Created:", run.createdAt);
  console.log("Summary:", run.summary);
  if (results?.metrics) console.log("Metrics:", JSON.stringify(results.metrics, null, 2));
  if (results?.cases?.length) console.log("Cases:", results.cases.length);
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "seed") {
    await seedSuite();
  } else if (cmd === "run") {
    await runEval();
  } else if (cmd === "latest") {
    await printLatest();
  } else {
    console.log("Usage: eval-run.ts seed | run | latest");
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
