import { prisma } from "../db";
import type { Category } from "@prisma/client";
import { EvidenceRef } from "@prisma/client";
import { RULES_CONFIG } from "../../prisma/rules-config";

export type CaseInput = {
  adText: string;
  category: Category;
  landingUrl: string;
  htmlContent?: string;
  redirectChain?: { url: string; status?: number }[];
};

function runProhibitedPhrase(adText: string, config: { patterns: { regex: string; flags: string }[] }) {
  for (const { regex, flags } of config.patterns) {
    const re = new RegExp(regex, flags);
    const match = adText.match(re);
    if (match) {
      return { triggered: true, matchedText: match[0], explanation: `Prohibited phrase found: "${match[0]}"` };
    }
  }
  return { triggered: false, matchedText: null, explanation: "No prohibited phrases found in ad text." };
}

function runMissingDisclaimer(adText: string, category: Category, config: { requiredPhrases: string[]; matchAny: boolean }) {
  if (category !== "HEALTH") {
    return { triggered: false, matchedText: null, explanation: "Rule applies only to Health category." };
  }
  const lower = adText.toLowerCase();
  const found = config.requiredPhrases.filter((p) => lower.includes(p.toLowerCase()));
  if (config.matchAny && found.length > 0) {
    return { triggered: false, matchedText: null, explanation: `Disclaimer phrase found: "${found[0]}"` };
  }
  if (config.matchAny && found.length === 0) {
    return {
      triggered: true,
      matchedText: null,
      explanation: "Health category ad must include at least one disclaimer phrase (e.g. 'consult your doctor', 'not medical advice').",
    };
  }
  return { triggered: false, matchedText: null, explanation: "Disclaimer check passed." };
}

function runLandingDomainRisk(landingUrl: string, config: { deniedDomains: string[] }) {
  const domain = getDomain(landingUrl);
  const denied = (config.deniedDomains as string[]).map((d) => d.toLowerCase());
  if (denied.includes(domain)) {
    return { triggered: true, matchedText: domain, explanation: `Domain "${domain}" is on the risk denylist.` };
  }
  return { triggered: false, matchedText: null, explanation: `Domain "${domain}" not on denylist.` };
}

function runRedirectCount(
  config: { maxRedirects: number; simulateRedirects?: number },
  redirectChain?: { url: string }[]
) {
  const count = redirectChain ? redirectChain.length : (config.simulateRedirects ?? 0);
  if (count > config.maxRedirects) {
    return { triggered: true, matchedText: String(count), explanation: `Redirect count ${count} exceeds max ${config.maxRedirects}.` };
  }
  return { triggered: false, matchedText: null, explanation: `Redirect count ${count} within limit (max ${config.maxRedirects}).` };
}

function runHiddenTextHeuristic(htmlContent: string, config: { threshold: number; patterns: string[] }) {
  const lower = htmlContent.toLowerCase();
  let count = 0;
  for (const pattern of config.patterns) {
    const re = new RegExp(pattern, "gi");
    const matches = lower.match(re);
    if (matches) count += matches.length;
  }
  if (count >= config.threshold) {
    return { triggered: true, matchedText: null, explanation: `Hidden-style patterns found ${count} times (threshold ${config.threshold}).` };
  }
  return { triggered: false, matchedText: null, explanation: `Hidden-style count ${count} below threshold ${config.threshold}.` };
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function runSuspiciousRedirects(
  redirectChain: { url: string }[],
  config: { maxRedirects: number }
) {
  const len = redirectChain.length;
  if (len >= 2) {
    return { triggered: true, matchedText: String(len), explanation: `Redirect chain length ${len} >= 2.` };
  }
  if (len >= 1) {
    const initial = getDomain(redirectChain[0].url);
    const final = getDomain(redirectChain[redirectChain.length - 1].url);
    if (initial !== final) {
      return { triggered: true, matchedText: `${initial} → ${final}`, explanation: `Final domain ${final} differs from initial ${initial}.` };
    }
  }
  return { triggered: false, matchedText: null, explanation: "Redirect chain within limits." };
}

export async function runRules(caseId: string, input: CaseInput): Promise<void> {
  const rules = await prisma.policyRule.findMany({ where: { enabled: true } });
  const ruleConfigMap = new Map(RULES_CONFIG.map((r) => [r.id, r]));

  for (const rule of rules) {
    const cfg = ruleConfigMap.get(rule.id as (typeof RULES_CONFIG)[number]["id"]);
    const config = (rule.config ?? cfg?.config) as Record<string, unknown> | null;
    if (!config) continue;

    let result: { triggered: boolean; matchedText: string | null; explanation: string };
    let evidenceRef: EvidenceRef = EvidenceRef.AD_TEXT;

    switch (rule.id) {
      case "RULE_PROHIBITED_PHRASE":
        result = runProhibitedPhrase(input.adText, config as { patterns: { regex: string; flags: string }[] });
        evidenceRef = EvidenceRef.AD_TEXT;
        break;
      case "RULE_MISSING_DISCLAIMER":
        result = runMissingDisclaimer(input.adText, input.category, config as { requiredPhrases: string[]; matchAny: boolean });
        evidenceRef = EvidenceRef.AD_TEXT;
        break;
      case "RULE_LANDING_DOMAIN_RISK":
        result = runLandingDomainRisk(input.landingUrl, config as { deniedDomains: string[] });
        evidenceRef = EvidenceRef.LANDING_URL;
        break;
      case "RULE_REDIRECT_COUNT":
        result = runRedirectCount(config as { maxRedirects: number; simulateRedirects?: number }, input.redirectChain);
        evidenceRef = EvidenceRef.REDIRECT_CHAIN;
        break;
      case "RULE_HIDDEN_TEXT_HEURISTIC":
        if (input.htmlContent) {
          result = runHiddenTextHeuristic(input.htmlContent, config as { threshold: number; patterns: string[] });
          evidenceRef = EvidenceRef.HTML_SNAPSHOT;
        } else {
          result = { triggered: false, matchedText: null, explanation: "No HTML snapshot available." };
        }
        break;
      case "RULE_SUSPICIOUS_REDIRECTS":
        if (input.redirectChain && input.redirectChain.length > 0) {
          result = runSuspiciousRedirects(input.redirectChain, config as { maxRedirects: number });
          evidenceRef = EvidenceRef.REDIRECT_CHAIN;
        } else {
          result = { triggered: false, matchedText: null, explanation: "No redirect chain available." };
        }
        break;
      default:
        result = { triggered: false, matchedText: null, explanation: "Unknown rule." };
    }

    await prisma.ruleRun.create({
      data: {
        caseId,
        ruleId: rule.id,
        triggered: result.triggered,
        matchedText: result.matchedText,
        explanation: result.explanation,
        evidenceRef,
      },
    });
  }
}

/**
 * Risk score: start 10, high +50, medium +25, low +10, cap 100.
 * Tiers: 0-39 low, 40-69 medium, 70-100 high.
 */
export function computeRiskScore(ruleRuns: { triggered: boolean; rule: { severity: string } }[]): { score: number; tier: "LOW" | "MEDIUM" | "HIGH" } {
  let score = 10;
  for (const run of ruleRuns) {
    if (!run.triggered) continue;
    switch (run.rule.severity) {
      case "HIGH":
        score += 50;
        break;
      case "MEDIUM":
        score += 25;
        break;
      case "LOW":
        score += 10;
        break;
    }
  }
  score = Math.min(100, score);
  let tier: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (score >= 70) tier = "HIGH";
  else if (score >= 40) tier = "MEDIUM";
  return { score, tier };
}
