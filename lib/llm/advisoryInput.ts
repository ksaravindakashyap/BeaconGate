/**
 * Phase 4C: Canonical advisory input — case + evidence + rules + retrieval.
 * Used for prompt construction and input hashing (audit).
 */

export interface AdvisoryInputCase {
  id: string;
  category: string;
  adText: string;
  landingUrl: string;
}

export interface AdvisoryInputEvidence {
  finalUrl?: string | null;
  redirectChain: { url: string; status?: number }[];
  htmlSnippet: string;
  screenshotArtifactId?: string | null;
  evidenceHash: string;
  lastCapturedAt: string | null;
}

export interface AdvisoryInputRuleRun {
  id: string;
  ruleId: string;
  severity: string;
  triggered: boolean;
  matchedText: string | null;
  evidenceRef: string;
  explanation: string;
}

export interface AdvisoryInputRetrievalMatch {
  documentTitle: string;
  chunkId: string;
  score: number;
  snippet: string;
  outcome?: string;
}

export interface AdvisoryInputRetrieval {
  lastRunId: string | null;
  policyMatches: AdvisoryInputRetrievalMatch[];
  precedentMatches: AdvisoryInputRetrievalMatch[];
}

export interface AdvisoryInputGenerationParams {
  topKPolicy: number;
  topKPrecedent: number;
}

export interface AdvisoryInput {
  case: AdvisoryInputCase;
  evidence: AdvisoryInputEvidence;
  ruleRuns: AdvisoryInputRuleRun[];
  retrieval: AdvisoryInputRetrieval;
  generationParams: AdvisoryInputGenerationParams;
}

/** Build AdvisoryInput from case + evidence + ruleRuns + optional retrieval run. Caller provides htmlSnippet and redirectChain from artifacts. */
export function buildAdvisoryInput(params: {
  case: { id: string; category: string; adText: string; landingUrl: string };
  evidence: { evidenceHash: string; lastCapturedAt: Date | null };
  htmlSnippet: string;
  redirectChain: { url: string; status?: number }[];
  screenshotArtifactId: string | null;
  ruleRuns: { id: string; ruleId: string; triggered: boolean; matchedText: string | null; evidenceRef: string; explanation: string; rule: { severity: string } }[];
  retrievalRun: {
    id: string;
    results: { policy?: { chunkId: string; documentTitle: string; score: number; snippet: string }[]; precedent?: { chunkId: string; documentTitle: string; score: number; snippet: string; content?: string }[] };
  } | null;
  topKPolicy?: number;
  topKPrecedent?: number;
}): AdvisoryInput {
  const policyMatches = params.retrievalRun?.results
    ? (params.retrievalRun.results as { policy?: AdvisoryInputRetrievalMatch[] }).policy ?? []
    : [];
  const precedentMatches = params.retrievalRun?.results
    ? (params.retrievalRun.results as { precedent?: AdvisoryInputRetrievalMatch[] }).precedent ?? []
    : [];
  const finalUrl = params.redirectChain.length > 0 ? params.redirectChain[params.redirectChain.length - 1].url : null;
  return {
    case: {
      id: params.case.id,
      category: params.case.category,
      adText: params.case.adText,
      landingUrl: params.case.landingUrl,
    },
    evidence: {
      finalUrl: finalUrl ?? undefined,
      redirectChain: params.redirectChain,
      htmlSnippet: params.htmlSnippet.slice(0, 1500),
      screenshotArtifactId: params.screenshotArtifactId ?? undefined,
      evidenceHash: params.evidence.evidenceHash,
      lastCapturedAt: params.evidence.lastCapturedAt?.toISOString() ?? null,
    },
    ruleRuns: params.ruleRuns.map((r) => ({
      id: r.id,
      ruleId: r.ruleId,
      severity: r.rule.severity,
      triggered: r.triggered,
      matchedText: r.matchedText,
      evidenceRef: r.evidenceRef,
      explanation: r.explanation,
    })),
    retrieval: {
      lastRunId: params.retrievalRun?.id ?? null,
      policyMatches: policyMatches.slice(0, params.topKPolicy ?? 6),
      precedentMatches: precedentMatches.slice(0, params.topKPrecedent ?? 6),
    },
    generationParams: {
      topKPolicy: params.topKPolicy ?? 6,
      topKPrecedent: params.topKPrecedent ?? 6,
    },
  };
}
