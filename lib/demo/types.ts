/**
 * Demo data types aligned with UI expectations (queue, case, dashboard, eval).
 * Not Prisma types; used only when isDemoMode() is true.
 */

export type DemoCategory = "HEALTH" | "FINANCE" | "DATING" | "GAMBLING" | "GENERAL";
export type DemoCaseStatus = "NEW" | "CAPTURING" | "READY_FOR_REVIEW" | "IN_REVIEW" | "DECIDED";
export type DemoQueueTier = "LOW" | "MEDIUM" | "HIGH";
export type DemoQueueStatus = "OPEN" | "IN_REVIEW" | "CLOSED";
export type DemoCaptureStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface DemoCaseSummary {
  id: string;
  category: DemoCategory;
  status: DemoCaseStatus;
  createdAt: Date;
}

export interface DemoQueueItem {
  id: string;
  caseId: string;
  riskScore: number;
  tier: DemoQueueTier;
  status: DemoQueueStatus;
  createdAt: Date;
  case: DemoCaseSummary;
}

export interface DemoPolicyRule {
  id: string;
  name: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface DemoRuleRun {
  id: string;
  ruleId: string;
  rule: DemoPolicyRule;
  triggered: boolean;
  matchedText: string | null;
  explanation: string;
  evidenceRef: string;
}

export interface DemoArtifact {
  id: string;
  type: "SCREENSHOT" | "HTML_SNAPSHOT" | "REDIRECT_CHAIN" | "NETWORK_SUMMARY";
  path?: string | null;
  contentJson?: unknown;
}

export interface DemoCaptureRun {
  id: string;
  status: DemoCaptureStatus;
  errorMessage?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}

export interface DemoEvidence {
  id: string;
  landingUrl: string;
  evidenceHash: string;
  lastCapturedAt?: Date | null;
  screenshotPath?: string | null;
  artifacts: DemoArtifact[];
  currentCaptureRun: DemoCaptureRun | null;
  captureRuns: DemoCaptureRun[];
}

export interface DemoRetrievalResultItem {
  documentTitle: string;
  score: number;
  snippet: string;
  content?: string;
}

export interface DemoRetrievalRun {
  id: string;
  createdAt: Date;
  embedModel: string;
  results: {
    policy?: DemoRetrievalResultItem[];
    precedent?: DemoRetrievalResultItem[];
  };
}

export interface DemoLLMRun {
  id: string;
  createdAt: Date;
  provider: string;
  advisoryText: string;
  advisoryJson?: unknown;
  latencyMs?: number | null;
}

export interface DemoReviewDecision {
  id: string;
  decidedAt: Date;
  outcome: "APPROVE" | "REJECT" | "NEEDS_MORE_INFO";
  reviewerNotes?: string | null;
}

export interface DemoCaseFile {
  id: string;
  caseId: string;
  version: number;
  content: Record<string, unknown>;
}

export interface DemoCase {
  id: string;
  adText: string;
  category: DemoCategory;
  landingUrl: string;
  status: DemoCaseStatus;
  evidenceId: string;
  evidence: DemoEvidence;
  ruleRuns: DemoRuleRun[];
  llmRuns: DemoLLMRun[];
  queueItem: DemoQueueItem | null;
  decision: DemoReviewDecision | null;
  caseFiles: DemoCaseFile[];
  retrievalRuns: DemoRetrievalRun[];
}

/** Pre-resolved redirect/network for case page (no fs read in demo). */
export interface DemoRedirectStep {
  url: string;
  status?: number;
}

export interface DemoNetworkSummary {
  totalRequests: number;
  byType?: Record<string, number>;
  topDomains?: string[];
}

export interface DemoDashboardStats {
  backlogCount: number;
  avgTimeToDecisionHours: string;
  decisionsLast7Days: number;
  decisionsToday: number;
  highRiskBacklog: number;
  decisionsByDay: { date: string; count: number }[];
}

export interface DemoEvalCaseResult {
  evalCaseId: string;
  title: string;
  category: string;
  rules: { expected: string[]; actual: string[]; tp: number; fp: number; fn: number };
  retrieval: {
    policyHit: boolean;
    precedentHit: boolean;
    policyTop: { stableChunkId: string | null; documentTitle: string; score: number; snippet?: string }[];
    precedentTop: { stableChunkId: string | null; documentTitle: string; score: number; snippet?: string }[];
  };
  advisory: { schemaValid: boolean; invalidCitations: number; nonBindingOk: boolean; signalsHit: boolean };
}

export interface DemoEvalRun {
  id: string;
  suiteName: string;
  createdAt: Date;
  summary: string;
  durationMs: number;
  results: {
    metrics?: {
      rules?: { precision: number; recall: number; f1: number };
      retrieval?: { policyHitRate: number; precedentHitRate: number };
      advisory?: {
        schemaValidRate: number;
        citationValidRate: number;
        nonBindingComplianceRate: number;
        signalHitRate: number;
      };
    };
    cases?: DemoEvalCaseResult[];
  };
}
