/**
 * Policy-as-code rules config (stored in PolicyRule table via seed).
 * Used by rule runner to evaluate cases.
 */
export const RULES_CONFIG = [
  {
    id: "RULE_PROHIBITED_PHRASE",
    name: "Prohibited phrase in ad text",
    description: "Ad text must not contain prohibited phrases (regex list).",
    severity: "HIGH" as const,
    categoryScope: null,
    enabled: true,
    config: {
      patterns: [
        { regex: "\\bguaranteed\\s+results?\\b", flags: "gi" },
        { regex: "\\b100%\\s+free\\b", flags: "gi" },
        { regex: "\\bact\\s+now\\b", flags: "gi" },
      ],
    },
  },
  {
    id: "RULE_MISSING_DISCLAIMER",
    name: "Missing disclaimer (Health category)",
    description: "Health category ads must include a disclaimer phrase.",
    severity: "MEDIUM" as const,
    categoryScope: "HEALTH" as const,
    enabled: true,
    config: {
      requiredPhrases: ["consult your doctor", "not medical advice", "for informational purposes"],
      matchAny: true,
    },
  },
  {
    id: "RULE_LANDING_DOMAIN_RISK",
    name: "Landing URL domain risk",
    description: "Landing URL domain must not be on the risk denylist.",
    severity: "HIGH" as const,
    categoryScope: null,
    enabled: true,
    config: {
      deniedDomains: ["risky-example.com", "phish-demo.net", "blocked-test.org"],
    },
  },
  {
    id: "RULE_REDIRECT_COUNT",
    name: "Excessive redirects (placeholder)",
    description: "Landing page should not have excessive redirects. Phase 1: no crawl, redirect_count inferred as 0.",
    severity: "LOW" as const,
    categoryScope: null,
    enabled: true,
    config: {
      maxRedirects: 3,
      simulateRedirects: 0,
    },
  },
  {
    id: "RULE_HIDDEN_TEXT_HEURISTIC",
    name: "Hidden text heuristic (HTML)",
    description: "Detect display:none, visibility:hidden, font-size:0 in HTML snapshot; triggered if count exceeds threshold.",
    severity: "MEDIUM" as const,
    categoryScope: null,
    enabled: true,
    config: {
      threshold: 5,
      patterns: ["display:\\s*none", "visibility:\\s*hidden", "font-size:\\s*0"],
    },
  },
  {
    id: "RULE_SUSPICIOUS_REDIRECTS",
    name: "Suspicious redirects",
    description: "Triggered if redirect chain length >= 2 or final domain differs from initial domain.",
    severity: "HIGH" as const,
    categoryScope: null,
    enabled: true,
    config: {
      maxRedirects: 1,
    },
  },
] as const;

export type RuleId = (typeof RULES_CONFIG)[number]["id"];
