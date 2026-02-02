import { describe, it, expect } from "vitest";
import {
  parseAdvisoryJson,
  NON_BINDING_NOTICE_VALUE,
  advisoryJsonSchema,
} from "@/lib/llm/schema";

describe("parseAdvisoryJson", () => {
  it("rejects missing nonBindingNotice", () => {
    const bad = {
      summary: "Summary",
      claims: [],
      evasionSignals: [],
      policyConcerns: [],
      recommendedReviewerQuestions: [],
      recommendedNextActions: [],
      nonBindingNotice: "Wrong value",
    };
    const result = parseAdvisoryJson(bad);
    expect(result.success).toBe(false);
  });

  it("accepts valid advisory with exact nonBindingNotice", () => {
    const good = {
      summary: "Summary",
      claims: [],
      evasionSignals: [],
      policyConcerns: [],
      recommendedReviewerQuestions: [],
      recommendedNextActions: [],
      nonBindingNotice: NON_BINDING_NOTICE_VALUE,
    };
    const result = parseAdvisoryJson(good);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.nonBindingNotice).toBe(NON_BINDING_NOTICE_VALUE);
  });

  it("enforces nonBindingNotice literal", () => {
    const result = advisoryJsonSchema.safeParse({
      summary: "S",
      claims: [],
      evasionSignals: [],
      policyConcerns: [],
      recommendedReviewerQuestions: [],
      recommendedNextActions: [],
      nonBindingNotice: "LLM Advisory (non-binding)",
    });
    expect(result.success).toBe(true);
  });
});
