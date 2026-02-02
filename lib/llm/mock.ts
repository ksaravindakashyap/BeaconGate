/**
 * Phase 4C: Deterministic mock advisory generator (no API key).
 * Produces structured advisory from rules + retrieval + evidence.
 */

import type { AdvisoryInput } from "./advisoryInput";
import type { AdvisoryJson } from "./schema";
import { NON_BINDING_NOTICE_VALUE } from "./schema";

const CLAIM_KEYWORDS: Record<string, string[]> = {
  health: ["health", "doctor", "cure", "treatment", "medical", "joint", "pain", "relief", "supplement"],
  finance: ["guarantee", "return", "investment", "profit", "money", "cash", "refund"],
  guarantee: ["guarantee", "promise", "ensure", "100%", "best"],
  endorsement: ["recommended", "approved", "certified"],
};

export function generateMockAdvisory(input: AdvisoryInput): AdvisoryJson {
  const claims = buildClaims(input);
  const evasionSignals = buildEvasionSignals(input);
  const policyConcerns = buildPolicyConcerns(input);
  const recommendedReviewerQuestions = buildQuestions(input);
  const recommendedNextActions = buildNextActions(input);
  const summary = buildSummary(claims, evasionSignals, policyConcerns);

  return {
    summary,
    claims,
    evasionSignals,
    policyConcerns,
    recommendedReviewerQuestions,
    recommendedNextActions,
    nonBindingNotice: NON_BINDING_NOTICE_VALUE,
  };
}

function buildClaims(input: AdvisoryInput): AdvisoryJson["claims"] {
  const claims: AdvisoryJson["claims"] = [];
  const adLower = input.case.adText.toLowerCase();
  for (const [type, keywords] of Object.entries(CLAIM_KEYWORDS)) {
    for (const kw of keywords) {
      if (adLower.includes(kw)) {
        const sentence = extractSentenceContaining(input.case.adText, kw);
        claims.push({
          text: sentence,
          type: type as AdvisoryJson["claims"][0]["type"],
          risk: "medium",
          evidence: [{ source: "ad_text", quote: sentence.slice(0, 200), pointer: "adText:chars 0-" + input.case.adText.length }],
        });
        if (claims.length >= 5) return claims;
      }
    }
  }
  if (claims.length === 0) {
    claims.push({
      text: "General promotional claim",
      type: "other",
      risk: "low",
      evidence: [{ source: "ad_text", quote: input.case.adText.slice(0, 150), pointer: "adText:chars 0-" + Math.min(150, input.case.adText.length) }],
    });
  }
  return claims;
}

function extractSentenceContaining(text: string, word: string): string {
  const idx = text.toLowerCase().indexOf(word);
  if (idx === -1) return text.slice(0, 120);
  const start = text.lastIndexOf(".", idx - 1) + 1;
  const end = text.indexOf(".", idx + 1);
  const slice = (end === -1 ? text.slice(start) : text.slice(start, end + 1)).trim();
  return slice.length > 200 ? slice.slice(0, 197) + "…" : slice;
}

function buildEvasionSignals(input: AdvisoryInput): AdvisoryJson["evasionSignals"] {
  const signals: AdvisoryJson["evasionSignals"] = [];
  if (input.evidence.redirectChain.length >= 2) {
    signals.push({
      signal: "multi-hop redirect",
      severity: input.evidence.redirectChain.length > 3 ? "high" : "medium",
      evidence: [
        {
          source: "redirect_chain",
          quote: `${input.evidence.redirectChain.length} hops`,
          pointer: `redirectChain[0..${input.evidence.redirectChain.length - 1}]`,
        },
      ],
    });
  }
  const hiddenTextRule = input.ruleRuns.find((r) => r.triggered && (r.ruleId.toLowerCase().includes("hidden") || r.explanation.toLowerCase().includes("hidden")));
  if (hiddenTextRule) {
    signals.push({
      signal: "hidden text",
      severity: hiddenTextRule.severity === "HIGH" ? "high" : "medium",
      evidence: [
        {
          source: "html",
          quote: (hiddenTextRule.matchedText ?? "").slice(0, 150),
          pointer: "htmlSnippet",
        },
      ],
    });
  }
  return signals.slice(0, 8);
}

function buildPolicyConcerns(input: AdvisoryInput): AdvisoryJson["policyConcerns"] {
  const concerns: AdvisoryJson["policyConcerns"] = [];
  const highTriggered = input.ruleRuns.filter((r) => r.triggered && r.severity === "HIGH");
  const policyMatches = input.retrieval.policyMatches.slice(0, 3);
  if (highTriggered.length > 0 && policyMatches.length > 0) {
    for (const match of policyMatches) {
      concerns.push({
        concern: `Policy relevance: ${match.documentTitle}. Rule(s) triggered: ${highTriggered.map((r) => r.ruleId).join(", ")}.`,
        severity: "high",
        policyCitations: [{ chunkId: match.chunkId, documentTitle: match.documentTitle, snippet: match.snippet.slice(0, 400) }],
      });
      if (concerns.length >= 3) break;
    }
  }
  if (concerns.length === 0) {
    concerns.push({
      concern: "Review policy guidance for this category and ad type.",
      severity: "medium",
      policyCitations: policyMatches.map((m) => ({ chunkId: m.chunkId, documentTitle: m.documentTitle, snippet: m.snippet.slice(0, 200) })),
    });
  }
  return concerns.slice(0, 8);
}

function buildQuestions(input: AdvisoryInput): string[] {
  const q: string[] = [];
  if (input.evidence.redirectChain.length >= 2) q.push("Does the redirect chain comply with disclosure requirements?");
  if (input.ruleRuns.some((r) => r.triggered && r.severity === "HIGH")) q.push("Are triggered rule findings substantiated by evidence?");
  q.push("Does the ad and landing experience align with category policy?");
  return q.slice(0, 8);
}

function buildNextActions(inputAdvisory: AdvisoryInput): AdvisoryJson["recommendedNextActions"] {
  const actions: AdvisoryJson["recommendedNextActions"] = [
    { action: "Check disclaimer presence where required", priority: "P0" },
    { action: "Verify claim substantiation against evidence", priority: "P1" },
  ];
  if (inputAdvisory.retrieval.policyMatches.length > 0) {
    actions.push({ action: "Review policy and precedent matches", priority: "P2" });
  }
  return actions.slice(0, 8);
}

function buildSummary(
  claims: AdvisoryJson["claims"],
  evasionSignals: AdvisoryJson["evasionSignals"],
  policyConcerns: AdvisoryJson["policyConcerns"]
): string {
  const parts: string[] = [];
  parts.push(`Advisory identifies ${claims.length} claim(s) and ${evasionSignals.length} evasion signal(s).`);
  if (policyConcerns.length > 0) parts.push(`${policyConcerns.length} policy concern(s) cited from retrieval.`);
  parts.push("Reviewer should verify evidence and apply policy. This output is non-binding.");
  return parts.join(" ");
}
