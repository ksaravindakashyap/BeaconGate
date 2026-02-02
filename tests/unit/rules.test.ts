import { describe, it, expect } from "vitest";
import { runRulesOnInput, computeRiskScore } from "@/lib/rules/runner";
import { RULES_CONFIG } from "@/prisma/rules-config";
import type { CaseInput } from "@/lib/rules/runner";

const rules = RULES_CONFIG.map((r) => ({ id: r.id, config: r.config }));

describe("runRulesOnInput", () => {
  it("triggers RULE_PROHIBITED_PHRASE for act now", () => {
    const input: CaseInput = {
      adText: "Act now or miss out. Limited time.",
      category: "GENERAL",
      landingUrl: "https://example.com",
    };
    const result = runRulesOnInput(input, rules);
    const prohibited = result.find((r) => r.ruleId === "RULE_PROHIBITED_PHRASE");
    expect(prohibited?.triggered).toBe(true);
    expect(prohibited?.matchedText?.toLowerCase()).toContain("act now");
  });

  it("triggers RULE_PROHIBITED_PHRASE for guaranteed results", () => {
    const input: CaseInput = {
      adText: "Guaranteed results in 30 days.",
      category: "FINANCE",
      landingUrl: "https://example.com",
    };
    const result = runRulesOnInput(input, rules);
    const prohibited = result.find((r) => r.ruleId === "RULE_PROHIBITED_PHRASE");
    expect(prohibited?.triggered).toBe(true);
  });

  it("does not trigger RULE_MISSING_DISCLAIMER for non-HEALTH", () => {
    const input: CaseInput = {
      adText: "No disclaimer here.",
      category: "GENERAL",
      landingUrl: "https://example.com",
    };
    const result = runRulesOnInput(input, rules);
    const disclaimer = result.find((r) => r.ruleId === "RULE_MISSING_DISCLAIMER");
    expect(disclaimer?.triggered).toBe(false);
  });

  it("triggers RULE_MISSING_DISCLAIMER for HEALTH without disclaimer", () => {
    const input: CaseInput = {
      adText: "Best supplement. Order now.",
      category: "HEALTH",
      landingUrl: "https://example.com",
    };
    const result = runRulesOnInput(input, rules);
    const disclaimer = result.find((r) => r.ruleId === "RULE_MISSING_DISCLAIMER");
    expect(disclaimer?.triggered).toBe(true);
  });

  it("does not trigger RULE_MISSING_DISCLAIMER when consult your doctor present", () => {
    const input: CaseInput = {
      adText: "Consult your doctor before use.",
      category: "HEALTH",
      landingUrl: "https://example.com",
    };
    const result = runRulesOnInput(input, rules);
    const disclaimer = result.find((r) => r.ruleId === "RULE_MISSING_DISCLAIMER");
    expect(disclaimer?.triggered).toBe(false);
  });

  it("triggers RULE_HIDDEN_TEXT_HEURISTIC when html has display:none over threshold", () => {
    const hidden = '<span style="display:none">x</span>'.repeat(6);
    const input: CaseInput = {
      adText: "Ad text",
      category: "GENERAL",
      landingUrl: "https://example.com",
      htmlContent: hidden,
    };
    const result = runRulesOnInput(input, rules);
    const hiddenRule = result.find((r) => r.ruleId === "RULE_HIDDEN_TEXT_HEURISTIC");
    expect(hiddenRule?.triggered).toBe(true);
  });

  it("triggers RULE_SUSPICIOUS_REDIRECTS when redirect chain length >= 2", () => {
    const input: CaseInput = {
      adText: "Ad",
      category: "GENERAL",
      landingUrl: "https://example.com",
      redirectChain: [
        { url: "https://a.com" },
        { url: "https://b.com" },
      ],
    };
    const result = runRulesOnInput(input, rules);
    const suspicious = result.find((r) => r.ruleId === "RULE_SUSPICIOUS_REDIRECTS");
    expect(suspicious?.triggered).toBe(true);
  });

  it("triggers RULE_SUSPICIOUS_REDIRECTS when final domain differs from initial", () => {
    const input: CaseInput = {
      adText: "Ad",
      category: "GENERAL",
      landingUrl: "https://example.com",
      redirectChain: [
        { url: "https://initial.com" },
        { url: "https://final-other.com" },
      ],
    };
    const result = runRulesOnInput(input, rules);
    const suspicious = result.find((r) => r.ruleId === "RULE_SUSPICIOUS_REDIRECTS");
    expect(suspicious?.triggered).toBe(true);
  });

  it("triggers RULE_LANDING_DOMAIN_RISK for denied domain", () => {
    const input: CaseInput = {
      adText: "Ad",
      category: "GENERAL",
      landingUrl: "https://phish-demo.net/landing",
    };
    const result = runRulesOnInput(input, rules);
    const domain = result.find((r) => r.ruleId === "RULE_LANDING_DOMAIN_RISK");
    expect(domain?.triggered).toBe(true);
  });
});

describe("computeRiskScore", () => {
  it("base score 10, cap 100, tier 0-39 LOW 40-69 MEDIUM 70+ HIGH", () => {
    const noTrigger = computeRiskScore([
      { triggered: false, rule: { severity: "HIGH" } },
    ]);
    expect(noTrigger.score).toBe(10);
    expect(noTrigger.tier).toBe("LOW");

    const oneHigh = computeRiskScore([
      { triggered: true, rule: { severity: "HIGH" } },
    ]);
    expect(oneHigh.score).toBe(60);
    expect(oneHigh.tier).toBe("MEDIUM");

    const twoHigh = computeRiskScore([
      { triggered: true, rule: { severity: "HIGH" } },
      { triggered: true, rule: { severity: "HIGH" } },
    ]);
    expect(twoHigh.score).toBe(100);
    expect(twoHigh.tier).toBe("HIGH");

    const medium = computeRiskScore([
      { triggered: true, rule: { severity: "MEDIUM" } },
      { triggered: true, rule: { severity: "MEDIUM" } },
    ]);
    expect(medium.score).toBe(60);
    expect(medium.tier).toBe("MEDIUM");
  });
});
