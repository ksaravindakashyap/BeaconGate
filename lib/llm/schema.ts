/**
 * Phase 4C: Zod schema for advisory JSON output (structured, validated).
 */

import { z } from "zod";

const NON_BINDING_NOTICE = "LLM Advisory (non-binding)" as const;

const evidenceRefSchema = z.object({
  source: z.enum(["ad_text", "html", "redirect_chain"]),
  quote: z.string().max(500).transform((s) => s.trim()),
  pointer: z.string().max(200).transform((s) => s.trim()),
});

const claimEvidenceSchema = z.object({
  source: z.enum(["ad_text", "html", "redirect_chain"]),
  quote: z.string().max(500).transform((s) => s.trim()),
  pointer: z.string().max(200).transform((s) => s.trim()),
});

const claimSchema = z.object({
  text: z.string().max(800).transform((s) => s.trim()),
  type: z.enum(["health", "finance", "pricing", "guarantee", "endorsement", "other"]),
  risk: z.enum(["low", "medium", "high"]),
  evidence: z.array(claimEvidenceSchema).max(5),
});

const evasionSignalSchema = z.object({
  signal: z.string().max(300).transform((s) => s.trim()),
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.array(evidenceRefSchema).max(5),
});

const policyCitationSchema = z.object({
  chunkId: z.string().max(100),
  documentTitle: z.string().max(300),
  snippet: z.string().max(600),
});

const policyConcernSchema = z.object({
  concern: z.string().max(500).transform((s) => s.trim()),
  severity: z.enum(["low", "medium", "high"]),
  policyCitations: z.array(policyCitationSchema).max(5),
});

const recommendedNextActionSchema = z.object({
  action: z.string().max(300).transform((s) => s.trim()),
  priority: z.enum(["P0", "P1", "P2"]),
});

export const advisoryJsonSchema = z.object({
  summary: z.string().max(1200).transform((s) => s.trim()),
  claims: z.array(claimSchema).max(10),
  evasionSignals: z.array(evasionSignalSchema).max(8),
  policyConcerns: z.array(policyConcernSchema).max(8),
  recommendedReviewerQuestions: z.array(z.string().max(400).transform((s) => s.trim())).max(8),
  recommendedNextActions: z.array(recommendedNextActionSchema).max(8),
  nonBindingNotice: z.literal(NON_BINDING_NOTICE),
});

export type AdvisoryJson = z.infer<typeof advisoryJsonSchema>;

export const NON_BINDING_NOTICE_VALUE = NON_BINDING_NOTICE;

export function parseAdvisoryJson(json: unknown): { success: true; data: AdvisoryJson } | { success: false; error: string } {
  const result = advisoryJsonSchema.safeParse(json);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}
