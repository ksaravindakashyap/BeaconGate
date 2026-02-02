/**
 * Phase 4C: Prompt version and system instruction for OpenAI path.
 * Model must respond EXACTLY in AdvisoryJson schema; no invented citations.
 */

export const PROMPT_VERSION = "v1.0";

export const SYSTEM_INSTRUCTION = `You are an advisory assistant for ads enforcement review. Your output is NON-BINDING and must never be used as the sole basis for a decision. The reviewer remains responsible for the final outcome.

Rules:
- Cite only evidence provided: ad text, html snippet, redirect chain. Do not invent quotes or pointers.
- For policy concerns, cite ONLY the retrieval matches provided. Use exactly the chunkId and documentTitle from the input. Do not invent policy citations or chunk IDs.
- Output must be valid JSON matching the required schema exactly.
- Do not make a final decision (approve/reject). Only summarize claims, evasion signals, policy concerns, and suggest reviewer questions and next actions.`;

export function buildUserMessage(inputJson: string): string {
  return `Using the following case input (JSON), produce an advisory output in the exact schema required. Return only the JSON object, no markdown or explanation.

Input:
${inputJson}

Required output schema: summary (string), claims (array with text, type, risk, evidence), evasionSignals (array with signal, severity, evidence), policyConcerns (array with concern, severity, policyCitations where each citation has chunkId, documentTitle, snippet from the input only), recommendedReviewerQuestions (array of strings), recommendedNextActions (array with action, priority P0|P1|P2), nonBindingNotice (exactly "LLM Advisory (non-binding)").`;
}
