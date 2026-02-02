/**
 * Phase 5: Build eval_cases.json with deterministic stableIds from policy + precedents.
 * Run: npx ts-node --compiler-options "{\"module\":\"CommonJS\",\"moduleResolution\":\"node\"}" scripts/build-eval-cases.ts
 */

const path = require("path");
const fs = require("fs").promises;
const {
  chunkPolicyDocument,
  chunkPrecedentEntry,
  computeStableChunkId,
} = require("../lib/rag/chunker");

const POLICY_SOURCE = "BeaconGate Policy: policy_v1";

interface PolicyChunkInfo {
  stableId: string;
  index: number;
  firstLine: string;
}

interface PrecedentChunkInfo {
  stableId: string;
  title: string;
  documentIdPlaceholder: string;
}

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

interface EvalCaseInput {
  title: string;
  category: "HEALTH" | "FINANCE" | "DATING" | "GAMBLING" | "GENERAL";
  adText: string;
  landingUrl: string;
  htmlText?: string | null;
  redirectChain?: { url: string }[] | null;
  groundTruth: GroundTruth;
}

async function main() {
  const ragDir = path.join(process.cwd(), "rag");
  const policyPath = path.join(ragDir, "policies", "policy_v1.md");
  const precedentsPath = path.join(ragDir, "precedents", "seed_precedents.json");

  const policyContent = await fs.readFile(policyPath, "utf8");
  const policyChunks = chunkPolicyDocument(policyContent, POLICY_SOURCE);
  const policyInfos: PolicyChunkInfo[] = policyChunks.map((c: { content: string; contentHash: string }, i: number) => ({
    stableId: computeStableChunkId(POLICY_SOURCE, i, c.contentHash),
    index: i,
    firstLine: c.content.split("\n")[0].slice(0, 60),
  }));

  const precedentsRaw = await fs.readFile(precedentsPath, "utf8");
  const precedents = JSON.parse(precedentsRaw) as {
    title: string;
    scenarioSummary?: string;
    triggeredRules?: string[];
    outcome?: string;
    rationale?: string;
  }[];
  const precedentInfos: PrecedentChunkInfo[] = [];
  for (let idx = 0; idx < precedents.length; idx++) {
    const e = precedents[idx];
    const title = e.title ?? `Precedent ${idx + 1}`;
    const source = `Precedent: ${title}`;
    const chunks = chunkPrecedentEntry(
      e.title ?? "",
      e.scenarioSummary ?? "",
      e.triggeredRules ?? [],
      e.outcome ?? "",
      e.rationale ?? ""
    );
    for (let i = 0; i < chunks.length; i++) {
      const stableId = computeStableChunkId(source, i, chunks[i].contentHash);
      precedentInfos.push({
        stableId,
        title,
        documentIdPlaceholder: `precedent-${idx}`,
      });
    }
  }

  // Map section keywords to policy chunk indices (by first line)
  const policyBySection: Record<string, string> = {};
  for (const p of policyInfos) {
    if (p.firstLine.includes("Scope")) policyBySection["scope"] = p.stableId;
    if (p.firstLine.includes("Health")) policyBySection["health"] = p.stableId;
    if (p.firstLine.includes("Finance")) policyBySection["finance"] = p.stableId;
    if (p.firstLine.includes("Misleading")) policyBySection["misleading"] = p.stableId;
    if (p.firstLine.includes("Redirect") || p.firstLine.includes("Cloaking")) policyBySection["redirect"] = p.stableId;
    if (p.firstLine.includes("Disclaimer")) policyBySection["disclaimers"] = p.stableId;
    if (p.firstLine.includes("Prohibited")) policyBySection["prohibited"] = p.stableId;
    if (p.firstLine.includes("Evidence")) policyBySection["evidence"] = p.stableId;
  }
  // Fallback: use first policy chunk if section not found
  const defaultPolicyStableId = policyInfos[0]?.stableId ?? "chk_unknown";
  const getPolicyStableIds = (...sections: string[]): string[] => {
    const ids = sections.map((s) => policyBySection[s]).filter(Boolean);
    return ids.length > 0 ? ids : [defaultPolicyStableId];
  };

  // Precedent by title (first chunk of each precedent)
  const precedentByTitle: Record<string, string> = {};
  for (const p of precedentInfos) {
    if (!precedentByTitle[p.title]) precedentByTitle[p.title] = p.stableId;
  }
  const getPrecedentStableId = (title: string): string =>
    precedentByTitle[title] ?? precedentInfos[0]?.stableId ?? "chk_precedent_unknown";

  const cases: EvalCaseInput[] = [
    // HEALTH
    {
      title: "Health supplement cure claim no disclaimer",
      category: "HEALTH",
      adText: "Our supplement guarantees a cure for joint pain. Try it today.",
      landingUrl: "https://example.com/supplement",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_PROHIBITED_PHRASE", "RULE_MISSING_DISCLAIMER"],
        expectedPolicyChunkMustHit: getPolicyStableIds("health", "disclaimers", "prohibited"),
        expectedPrecedentMustHit: [getPrecedentStableId("Health supplement unsubstantiated claim")],
        expectedAdvisory: {
          mustContainSignals: [],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    {
      title: "Health ad with consult your doctor",
      category: "HEALTH",
      adText: "Wellness product. Consult your doctor before use. Not medical advice.",
      landingUrl: "https://example.com/wellness",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("health", "disclaimers"),
        expectedPrecedentMustHit: [getPrecedentStableId("Health ad with proper disclaimer")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Health category no disclaimer",
      category: "HEALTH",
      adText: "Best supplement for energy. Order now.",
      landingUrl: "https://example.com/energy",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_MISSING_DISCLAIMER"],
        expectedPolicyChunkMustHit: getPolicyStableIds("health", "disclaimers"),
        expectedPrecedentMustHit: [getPrecedentStableId("Health category no disclaimer")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Hidden disclaimer in HTML",
      category: "HEALTH",
      adText: "Supplement for joint health. Consult your doctor.",
      landingUrl: "https://example.com/joint",
      htmlText: '<div style="display:none">Consult your doctor. Not medical advice.</div><p>Buy now</p>',
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_HIDDEN_TEXT_HEURISTIC", "RULE_MISSING_DISCLAIMER"],
        expectedPolicyChunkMustHit: getPolicyStableIds("disclaimers", "health"),
        expectedPrecedentMustHit: [getPrecedentStableId("Hidden disclaimer in HTML")],
        expectedAdvisory: {
          mustContainSignals: ["hidden text"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    {
      title: "Supplement with visible disclaimer",
      category: "HEALTH",
      adText: "Not evaluated by FDA. Consult your doctor. For informational purposes only.",
      landingUrl: "https://example.com/supplement-fda",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("disclaimers", "health"),
        expectedPrecedentMustHit: [getPrecedentStableId("Supplement with visible disclaimer")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Clean health ad full compliance",
      category: "HEALTH",
      adText: "Wellness tips. Consult your doctor. Not intended to diagnose or treat.",
      landingUrl: "https://example.com/wellness-tips",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("health", "disclaimers"),
        expectedPrecedentMustHit: [getPrecedentStableId("Clean health ad full compliance")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    // FINANCE
    {
      title: "Crypto guaranteed returns",
      category: "FINANCE",
      adText: "Guaranteed 10% monthly returns. No risk investment.",
      landingUrl: "https://risky-example.com/crypto",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_PROHIBITED_PHRASE", "RULE_LANDING_DOMAIN_RISK"],
        expectedPolicyChunkMustHit: getPolicyStableIds("finance", "prohibited"),
        expectedPrecedentMustHit: [getPrecedentStableId("Finance crypto guaranteed returns")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Loan ad clear APR",
      category: "FINANCE",
      adText: "Personal loan. APR 12%. Terms apply. Clear eligibility.",
      landingUrl: "https://example.com/loans",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("finance"),
        expectedPrecedentMustHit: [getPrecedentStableId("Loan ad clear terms"), getPrecedentStableId("Finance loan clear APR")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Denylist domain finance",
      category: "FINANCE",
      adText: "Get your loan today. Best rates.",
      landingUrl: "https://phish-demo.net/loan",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_LANDING_DOMAIN_RISK"],
        expectedPolicyChunkMustHit: getPolicyStableIds("finance"),
        expectedPrecedentMustHit: [getPrecedentStableId("Denylist domain finance")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Finance risk disclaimer present",
      category: "FINANCE",
      adText: "Past performance does not guarantee future results. Investment carries risk.",
      landingUrl: "https://example.com/invest",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("finance", "disclaimers"),
        expectedPrecedentMustHit: [getPrecedentStableId("Finance risk disclaimer present")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    // REDIRECT
    {
      title: "Redirect to different domain",
      category: "GENERAL",
      adText: "Great product. Click to learn more.",
      landingUrl: "https://example.com/promo",
      redirectChain: [
        { url: "https://example.com/promo" },
        { url: "https://unrelated-offer.net/landing" },
      ],
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_SUSPICIOUS_REDIRECTS", "RULE_REDIRECT_COUNT"],
        expectedPolicyChunkMustHit: getPolicyStableIds("redirect"),
        expectedPrecedentMustHit: [getPrecedentStableId("Redirect to different domain")],
        expectedAdvisory: {
          mustContainSignals: ["multi-hop redirect", "multi-hop"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    {
      title: "Single redirect same brand",
      category: "GENERAL",
      adText: "Brand sale. Shop now.",
      landingUrl: "https://example.com/sale",
      redirectChain: [{ url: "https://example.com/sale" }, { url: "https://example.com/shop" }],
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_SUSPICIOUS_REDIRECTS"],
        expectedPolicyChunkMustHit: getPolicyStableIds("redirect"),
        expectedPrecedentMustHit: [getPrecedentStableId("Single redirect same brand")],
        expectedAdvisory: {
          mustContainSignals: ["multi-hop redirect", "multi-hop"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    {
      title: "Multiple redirects cloaking risk",
      category: "GENERAL",
      adText: "Special offer.",
      landingUrl: "https://example.com/offer",
      redirectChain: [
        { url: "https://example.com/offer" },
        { url: "https://mid.net/redirect" },
        { url: "https://other-domain.com/final" },
      ],
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_SUSPICIOUS_REDIRECTS", "RULE_REDIRECT_COUNT"],
        expectedPolicyChunkMustHit: getPolicyStableIds("redirect"),
        expectedPrecedentMustHit: [getPrecedentStableId("Multiple redirects cloaking risk")],
        expectedAdvisory: {
          mustContainSignals: ["multi-hop redirect", "multi-hop"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    {
      title: "Evasion via redirect",
      category: "HEALTH",
      adText: "Health product. Best supplement.",
      landingUrl: "https://example.com/health",
      redirectChain: [
        { url: "https://example.com/health" },
        { url: "https://finance-offer.net/loan" },
      ],
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_SUSPICIOUS_REDIRECTS"],
        expectedPolicyChunkMustHit: getPolicyStableIds("redirect", "health"),
        expectedPrecedentMustHit: [getPrecedentStableId("Evasion via redirect")],
        expectedAdvisory: {
          mustContainSignals: ["multi-hop redirect", "multi-hop"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    {
      title: "Health and redirect combined",
      category: "HEALTH",
      adText: "Supplement. Order now. No disclaimer here.",
      landingUrl: "https://example.com/supp",
      redirectChain: [{ url: "https://example.com/supp" }, { url: "https://other.com/page" }],
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_MISSING_DISCLAIMER", "RULE_SUSPICIOUS_REDIRECTS"],
        expectedPolicyChunkMustHit: getPolicyStableIds("health", "disclaimers", "redirect"),
        expectedPrecedentMustHit: [getPrecedentStableId("Health and redirect combined")],
        expectedAdvisory: {
          mustContainSignals: ["multi-hop redirect", "multi-hop"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    // PROHIBITED PHRASE
    {
      title: "Prohibited phrase act now",
      category: "GENERAL",
      adText: "Act now or miss out. Limited time only. Get rich quick.",
      landingUrl: "https://example.com/deal",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_PROHIBITED_PHRASE"],
        expectedPolicyChunkMustHit: getPolicyStableIds("prohibited"),
        expectedPrecedentMustHit: [getPrecedentStableId("Prohibited phrase act now")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Guaranteed results phrase",
      category: "FINANCE",
      adText: "Guaranteed results. 100% free to try. Sign up now.",
      landingUrl: "https://example.com/trial",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_PROHIBITED_PHRASE"],
        expectedPolicyChunkMustHit: getPolicyStableIds("prohibited", "finance"),
        expectedPrecedentMustHit: [getPrecedentStableId("Prohibited phrase act now")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Misleading before-after",
      category: "GENERAL",
      adText: "Before and after results. Guaranteed results. No substantiation.",
      landingUrl: "https://example.com/skincare",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_PROHIBITED_PHRASE"],
        expectedPolicyChunkMustHit: getPolicyStableIds("prohibited", "misleading"),
        expectedPrecedentMustHit: [getPrecedentStableId("Misleading before-after")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    // HIDDEN TEXT
    {
      title: "Hidden text over threshold",
      category: "GENERAL",
      adText: "Great product. Click to learn more.",
      landingUrl: "https://example.com/product",
      htmlText: [
        '<span style="display:none">hidden</span>',
        '<div style="visibility:hidden">secret</div>',
        '<p style="font-size:0">tiny</p>',
        '<span style="display:none">x</span>',
        '<div style="visibility:hidden">y</div>',
        '<p style="font-size:0">z</p>',
      ].join(" "),
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_HIDDEN_TEXT_HEURISTIC"],
        expectedPolicyChunkMustHit: getPolicyStableIds("disclaimers", "evidence"),
        expectedPrecedentMustHit: [getPrecedentStableId("Hidden text over threshold")],
        expectedAdvisory: {
          mustContainSignals: ["hidden text"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    // DATING / GAMBLING / GENERAL
    {
      title: "Dating ad age-gated",
      category: "DATING",
      adText: "Meet people. Age gate on landing. No false promises.",
      landingUrl: "https://example.com/dating",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("scope"),
        expectedPrecedentMustHit: [getPrecedentStableId("Dating ad age-gated landing")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Gambling ad jurisdiction",
      category: "GAMBLING",
      adText: "Play responsibly. Jurisdiction disclaimer. Age restrictions apply.",
      landingUrl: "https://example.com/gaming",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("scope"),
        expectedPrecedentMustHit: [getPrecedentStableId("Gambling ad jurisdiction")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "General ad clean copy",
      category: "GENERAL",
      adText: "Product sale. No prohibited phrases. Landing matches ad.",
      landingUrl: "https://example.com/product",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("scope", "evidence"),
        expectedPrecedentMustHit: [getPrecedentStableId("General ad clean copy")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Landing domain mismatch",
      category: "GENERAL",
      adText: "Brand A product. Best quality.",
      landingUrl: "https://brand-a.com",
      redirectChain: [{ url: "https://brand-a.com" }, { url: "https://brand-b.com/same-product" }],
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_SUSPICIOUS_REDIRECTS"],
        expectedPolicyChunkMustHit: getPolicyStableIds("redirect"),
        expectedPrecedentMustHit: [getPrecedentStableId("Landing domain mismatch")],
        expectedAdvisory: {
          mustContainSignals: ["multi-hop redirect", "multi-hop"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    // More cases to reach 30+
    {
      title: "Blocked domain landing",
      category: "FINANCE",
      adText: "Get your loan. Best rates.",
      landingUrl: "https://blocked-test.org/loan",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_LANDING_DOMAIN_RISK"],
        expectedPolicyChunkMustHit: getPolicyStableIds("finance"),
        expectedPrecedentMustHit: [getPrecedentStableId("Denylist domain finance")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "100% free prohibited phrase",
      category: "GENERAL",
      adText: "100% free trial. Act now or miss out. Sign up.",
      landingUrl: "https://example.com/trial",
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_PROHIBITED_PHRASE"],
        expectedPolicyChunkMustHit: getPolicyStableIds("prohibited"),
        expectedPrecedentMustHit: [getPrecedentStableId("Prohibited phrase act now")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Health supplement unsubstantiated claim",
      category: "HEALTH",
      adText: "Cures joint pain. No disclaimer. Order now.",
      landingUrl: "https://example.com/pain",
      htmlText: '<p style="visibility:hidden">Disclaimer here</p>'.repeat(3),
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_PROHIBITED_PHRASE", "RULE_MISSING_DISCLAIMER"],
        expectedPolicyChunkMustHit: getPolicyStableIds("health", "prohibited"),
        expectedPrecedentMustHit: [getPrecedentStableId("Health supplement unsubstantiated claim")],
        expectedAdvisory: {
          mustContainSignals: ["hidden text"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
    {
      title: "Finance loan clear terms",
      category: "FINANCE",
      adText: "Short-term loan. APR and terms in ad and on landing.",
      landingUrl: "https://example.com/short-loan",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("finance"),
        expectedPrecedentMustHit: [getPrecedentStableId("Finance loan clear APR")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "General product no violations",
      category: "GENERAL",
      adText: "Product sale. Clear terms. No prohibited language.",
      landingUrl: "https://example.com/shop",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("scope", "evidence"),
        expectedPrecedentMustHit: [getPrecedentStableId("General ad clean copy")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Health for informational purposes",
      category: "HEALTH",
      adText: "For informational purposes only. Consult your doctor. Wellness tips.",
      landingUrl: "https://example.com/info",
      groundTruth: {
        expectedTriggeredRuleIds: [],
        expectedPolicyChunkMustHit: getPolicyStableIds("health", "disclaimers"),
        expectedPrecedentMustHit: [getPrecedentStableId("Health ad with proper disclaimer")],
        expectedAdvisory: { mustContainSignals: [], maxInvalidCitations: 0, nonBindingNoticeRequired: true },
      },
    },
    {
      title: "Redirect chain length two",
      category: "GENERAL",
      adText: "Offer. Click here.",
      landingUrl: "https://a.com",
      redirectChain: [{ url: "https://a.com" }, { url: "https://a.com/final" }],
      groundTruth: {
        expectedTriggeredRuleIds: ["RULE_SUSPICIOUS_REDIRECTS"],
        expectedPolicyChunkMustHit: getPolicyStableIds("redirect"),
        expectedPrecedentMustHit: [getPrecedentStableId("Single redirect same brand")],
        expectedAdvisory: {
          mustContainSignals: ["multi-hop redirect", "multi-hop"],
          maxInvalidCitations: 0,
          nonBindingNoticeRequired: true,
        },
      },
    },
  ];

  const outDir = path.join(process.cwd(), "eval", "phase5_v1");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "eval_cases.json");
  await fs.writeFile(outPath, JSON.stringify(cases, null, 2), "utf8");
  console.log("Wrote", outPath, "with", cases.length, "cases.");
  console.log("Policy stableIds sample:", policyInfos.slice(0, 3).map((p) => p.stableId));
  console.log("Precedent stableIds sample:", precedentInfos.slice(0, 3).map((p) => p.stableId));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
