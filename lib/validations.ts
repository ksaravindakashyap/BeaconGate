import { z } from "zod";

const CATEGORIES = ["HEALTH", "FINANCE", "DATING", "GAMBLING", "GENERAL"] as const;
const OUTCOMES = ["APPROVE", "REJECT", "NEEDS_MORE_INFO"] as const;

const urlSchema = z.string().url("Invalid URL").max(2048, "URL too long");

export const submitCaseSchema = z.object({
  adText: z.string().min(1, "Ad text is required").max(10000, "Ad text too long"),
  category: z.enum(CATEGORIES),
  landingUrl: urlSchema,
});

export const decisionSchema = z.object({
  outcome: z.enum(OUTCOMES),
  reviewerNotes: z.string().max(5000).optional(),
});

export type SubmitCaseInput = z.infer<typeof submitCaseSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
