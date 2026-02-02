import type {
  DemoQueueItem,
  DemoCase,
  DemoCaseFile,
  DemoDashboardStats,
  DemoEvalRun,
  DemoEvalCaseResult,
} from "./types";

const DEMO_CASE_IDS = ["demo-health", "demo-finance", "demo-redirect"] as const;
export type DemoCaseId = (typeof DEMO_CASE_IDS)[number];
export const DEMO_CASE_IDS_LIST: DemoCaseId[] = [...DEMO_CASE_IDS];

function d(iso: string): Date {
  return new Date(iso);
}

/** 10 queue items; 3 are our demo cases, 7 are synthetic. */
export const demoQueueItems: DemoQueueItem[] = [
  {
    id: "qi-1",
    caseId: "demo-health",
    riskScore: 72,
    tier: "HIGH",
    status: "IN_REVIEW",
    createdAt: d("2025-01-28T10:00:00Z"),
    case: {
      id: "demo-health",
      category: "HEALTH",
      status: "IN_REVIEW",
      createdAt: d("2025-01-28T10:00:00Z"),
    },
  },
  {
    id: "qi-2",
    caseId: "demo-finance",
    riskScore: 65,
    tier: "HIGH",
    status: "OPEN",
    createdAt: d("2025-01-28T11:00:00Z"),
    case: {
      id: "demo-finance",
      category: "FINANCE",
      status: "READY_FOR_REVIEW",
      createdAt: d("2025-01-28T11:00:00Z"),
    },
  },
  {
    id: "qi-3",
    caseId: "demo-redirect",
    riskScore: 58,
    tier: "MEDIUM",
    status: "OPEN",
    createdAt: d("2025-01-28T12:00:00Z"),
    case: {
      id: "demo-redirect",
      category: "GENERAL",
      status: "READY_FOR_REVIEW",
      createdAt: d("2025-01-28T12:00:00Z"),
    },
  },
  ...([45, 38, 52, 28, 61, 33, 41].map((riskScore, i) => ({
    id: `qi-synth-${i + 4}`,
    caseId: `synth-${i + 4}`,
    riskScore,
    tier: (["MEDIUM", "LOW", "MEDIUM", "LOW", "HIGH", "LOW", "MEDIUM"] as const)[i],
    status: (["OPEN", "IN_REVIEW", "CLOSED", "OPEN", "IN_REVIEW", "OPEN", "CLOSED"] as const)[i],
    createdAt: d(`2025-01-${27 - i}T09:00:00Z`),
    case: {
      id: `synth-${i + 4}`,
      category: (["HEALTH", "FINANCE", "GENERAL", "DATING", "HEALTH", "GAMBLING", "FINANCE"] as const)[i],
      status: (["IN_REVIEW", "READY_FOR_REVIEW", "DECIDED", "CAPTURING", "IN_REVIEW", "NEW", "DECIDED"] as const)[i],
      createdAt: d(`2025-01-${27 - i}T09:00:00Z`),
    },
  }))),
];

const demoHealthCase: DemoCase = {
  id: "demo-health",
  adText: "Lose 20 lbs in 2 weeks with our supplement. No diet needed. Results guaranteed.",
  category: "HEALTH",
  landingUrl: "https://example.com/health-landing",
  status: "IN_REVIEW",
  evidenceId: "ev-health",
  evidence: {
    id: "ev-health",
    landingUrl: "https://example.com/health-landing",
    evidenceHash: "a1b2c3d4e5f6",
    lastCapturedAt: d("2025-01-28T10:05:00Z"),
    screenshotPath: null,
    artifacts: [
      { id: "art-h1", type: "SCREENSHOT", path: null },
      { id: "art-h2", type: "HTML_SNAPSHOT", path: null },
    ],
    currentCaptureRun: {
      id: "cr-health",
      status: "SUCCEEDED",
      startedAt: d("2025-01-28T10:04:00Z"),
      finishedAt: d("2025-01-28T10:05:00Z"),
    },
    captureRuns: [],
  },
  ruleRuns: [
    {
      id: "rr-h1",
      ruleId: "RULE_PROHIBITED_PHRASE",
      rule: { id: "RULE_PROHIBITED_PHRASE", name: "Prohibited phrase", severity: "HIGH" },
      triggered: true,
      matchedText: "Results guaranteed",
      explanation: "Ad makes a guaranteed-results claim.",
      evidenceRef: "AD_TEXT",
    },
    {
      id: "rr-h2",
      ruleId: "RULE_MISSING_DISCLAIMER",
      rule: { id: "RULE_MISSING_DISCLAIMER", name: "Missing health disclaimer", severity: "MEDIUM" },
      triggered: true,
      matchedText: null,
      explanation: "Health ad lacks required disclaimer.",
      evidenceRef: "AD_TEXT",
    },
    {
      id: "rr-h3",
      ruleId: "RULE_HIDDEN_TEXT_HEURISTIC",
      rule: { id: "RULE_HIDDEN_TEXT_HEURISTIC", name: "Hidden text heuristic", severity: "LOW" },
      triggered: false,
      matchedText: null,
      explanation: "No hidden text detected.",
      evidenceRef: "LANDING_URL",
    },
  ],
  llmRuns: [
    {
      id: "llm-health",
      createdAt: d("2025-01-28T10:06:00Z"),
      provider: "mock",
      advisoryText: "Advisory: claims (weight loss, no diet) and policy concerns (disclaimer, guarantees). Citations to policy chunks 1–2.",
      advisoryJson: {
        claims: ["Weight loss in 2 weeks", "No diet needed", "Results guaranteed"],
        policyConcerns: ["Missing health disclaimer", "Guaranteed results claim"],
        citations: ["chk_policy_1", "chk_policy_2"],
      },
      latencyMs: 120,
    },
  ],
  queueItem: demoQueueItems[0],
  decision: null,
  caseFiles: [],
  retrievalRuns: [
    {
      id: "ret-health",
      createdAt: d("2025-01-28T10:05:30Z"),
      embedModel: "local",
      results: {
        policy: [
          { documentTitle: "Health claims policy", score: 0.92, snippet: "Health claims must include disclaimers. Guaranteed results are prohibited." },
        ],
        precedent: [
          { documentTitle: "Precedent: health disclaimer", score: 0.88, snippet: "Similar case: missing disclaimer led to rejection." },
        ],
      },
    },
  ],
};

const demoFinanceCase: DemoCase = {
  id: "demo-finance",
  adText: "Guaranteed 15% returns. No risk. Sign up now.",
  category: "FINANCE",
  landingUrl: "https://example.com/finance-landing",
  status: "READY_FOR_REVIEW",
  evidenceId: "ev-finance",
  evidence: {
    id: "ev-finance",
    landingUrl: "https://example.com/finance-landing",
    evidenceHash: "f6e5d4c3b2a1",
    lastCapturedAt: d("2025-01-28T11:05:00Z"),
    screenshotPath: null,
    artifacts: [
      { id: "art-f1", type: "SCREENSHOT", path: null },
      { id: "art-f2", type: "HTML_SNAPSHOT", path: null },
    ],
    currentCaptureRun: {
      id: "cr-finance",
      status: "SUCCEEDED",
      startedAt: d("2025-01-28T11:04:00Z"),
      finishedAt: d("2025-01-28T11:05:00Z"),
    },
    captureRuns: [],
  },
  ruleRuns: [
    {
      id: "rr-f1",
      ruleId: "RULE_PROHIBITED_PHRASE",
      rule: { id: "RULE_PROHIBITED_PHRASE", name: "Prohibited phrase", severity: "HIGH" },
      triggered: true,
      matchedText: "Guaranteed 15% returns",
      explanation: "Prohibited guaranteed-returns claim.",
      evidenceRef: "AD_TEXT",
    },
  ],
  llmRuns: [
    {
      id: "llm-finance",
      createdAt: d("2025-01-28T11:06:00Z"),
      provider: "mock",
      advisoryText: "Advisory: guaranteed returns and no-risk claims. Policy and precedent hits on financial guarantees.",
      advisoryJson: {
        claims: ["Guaranteed 15% returns", "No risk"],
        policyConcerns: ["Guaranteed returns", "No risk claim"],
        citations: ["chk_policy_fin"],
      },
      latencyMs: 95,
    },
  ],
  queueItem: demoQueueItems[1],
  decision: null,
  caseFiles: [],
  retrievalRuns: [
    {
      id: "ret-finance",
      createdAt: d("2025-01-28T11:05:30Z"),
      embedModel: "local",
      results: {
        policy: [
          { documentTitle: "Financial claims policy", score: 0.89, snippet: "Guaranteed returns and no-risk language are not allowed." },
        ],
        precedent: [
          { documentTitle: "Precedent: finance guarantee", score: 0.85, snippet: "Similar ad rejected for guaranteed returns." },
        ],
      },
    },
  ],
};

const demoRedirectCase: DemoCase = {
  id: "demo-redirect",
  adText: "Click here for a great offer.",
  category: "GENERAL",
  landingUrl: "https://example.com/redirect-a",
  status: "READY_FOR_REVIEW",
  evidenceId: "ev-redirect",
  evidence: {
    id: "ev-redirect",
    landingUrl: "https://example.com/redirect-a",
    evidenceHash: "r1r2r3r4",
    lastCapturedAt: d("2025-01-28T12:05:00Z"),
    screenshotPath: null,
    artifacts: [
      { id: "art-r1", type: "SCREENSHOT", path: null },
      { id: "art-r2", type: "HTML_SNAPSHOT", path: null },
      { id: "art-r3", type: "REDIRECT_CHAIN", path: null, contentJson: null },
      { id: "art-r4", type: "NETWORK_SUMMARY", path: null, contentJson: null },
    ],
    currentCaptureRun: {
      id: "cr-redirect",
      status: "FAILED",
      errorMessage: "Multi-hop redirect detected; partial evidence captured.",
      startedAt: d("2025-01-28T12:04:00Z"),
      finishedAt: d("2025-01-28T12:05:00Z"),
    },
    captureRuns: [],
  },
  ruleRuns: [
    {
      id: "rr-r1",
      ruleId: "RULE_SUSPICIOUS_REDIRECTS",
      rule: { id: "RULE_SUSPICIOUS_REDIRECTS", name: "Suspicious redirects", severity: "MEDIUM" },
      triggered: true,
      matchedText: "3",
      explanation: "Redirect chain length 3 >= 2. Evasion signal: multi-hop redirect.",
      evidenceRef: "REDIRECT_CHAIN",
    },
  ],
  llmRuns: [],
  queueItem: demoQueueItems[2],
  decision: null,
  caseFiles: [],
  retrievalRuns: [],
};

export const demoCases: Record<DemoCaseId, DemoCase> = {
  "demo-health": demoHealthCase,
  "demo-finance": demoFinanceCase,
  "demo-redirect": demoRedirectCase,
};

export function getDemoCase(id: string): DemoCase | null {
  if (DEMO_CASE_IDS_LIST.includes(id as DemoCaseId)) {
    return demoCases[id as DemoCaseId];
  }
  return null;
}

export const demoCaseFiles: Record<string, DemoCaseFile[]> = {
  "demo-health": [
    {
      id: "cf-health-1",
      caseId: "demo-health",
      version: 1,
      content: {
        decision: { outcome: "REJECT", reviewerNotes: "Health disclaimer missing; guaranteed claims." },
        evidenceRefs: [],
        ruleRunIds: ["rr-h1", "rr-h2"],
      },
    },
  ],
};

/** Pre-resolved redirect data for demo case page (demo-redirect). */
export const demoRedirectData: { id: string; data: { url: string; status?: number }[] | null }[] = [
  {
    id: "art-r3",
    data: [
      { url: "https://example.com/redirect-a", status: 302 },
      { url: "https://example.com/redirect-b", status: 302 },
      { url: "https://example.com/final", status: 200 },
    ],
  },
];

export const demoNetworkData: { id: string; data: { totalRequests: number; topDomains?: string[] } | null }[] = [
  {
    id: "art-r4",
    data: { totalRequests: 42, topDomains: ["example.com", "cdn.example.com"] },
  },
];

export const demoDashboardStats: DemoDashboardStats = {
  backlogCount: 6,
  avgTimeToDecisionHours: "2.3",
  decisionsLast7Days: 12,
  decisionsToday: 2,
  highRiskBacklog: 3,
  decisionsByDay: [
    { date: "2025-02-01", count: 2 },
    { date: "2025-01-31", count: 3 },
    { date: "2025-01-30", count: 1 },
    { date: "2025-01-29", count: 2 },
    { date: "2025-01-28", count: 4 },
    { date: "2025-01-27", count: 0 },
    { date: "2025-01-26", count: 0 },
  ],
};

const demoEvalCases: DemoEvalCaseResult[] = [
  {
    evalCaseId: "ec1",
    title: "Health disclaimer",
    category: "HEALTH",
    rules: { expected: ["RULE_MISSING_DISCLAIMER"], actual: ["RULE_MISSING_DISCLAIMER"], tp: 1, fp: 0, fn: 0 },
    retrieval: {
      policyHit: true,
      precedentHit: true,
      policyTop: [{ stableChunkId: "chk_1", documentTitle: "Policy", score: 0.9, snippet: "Snippet" }],
      precedentTop: [{ stableChunkId: "chk_2", documentTitle: "Precedent", score: 0.85, snippet: "Snippet" }],
    },
    advisory: { schemaValid: true, invalidCitations: 0, nonBindingOk: true, signalsHit: true },
  },
  {
    evalCaseId: "ec2",
    title: "Prohibited phrase",
    category: "FINANCE",
    rules: { expected: ["RULE_PROHIBITED_PHRASE"], actual: ["RULE_PROHIBITED_PHRASE"], tp: 1, fp: 0, fn: 0 },
    retrieval: { policyHit: true, precedentHit: true, policyTop: [], precedentTop: [] },
    advisory: { schemaValid: true, invalidCitations: 0, nonBindingOk: true, signalsHit: true },
  },
  {
    evalCaseId: "ec3",
    title: "Redirect chain",
    category: "GENERAL",
    rules: { expected: ["RULE_SUSPICIOUS_REDIRECTS"], actual: ["RULE_SUSPICIOUS_REDIRECTS"], tp: 1, fp: 0, fn: 0 },
    retrieval: { policyHit: false, precedentHit: true, policyTop: [], precedentTop: [] },
    advisory: { schemaValid: true, invalidCitations: 0, nonBindingOk: true, signalsHit: false },
  },
];

export const demoEvalRun: DemoEvalRun = {
  id: "eval-demo-1",
  suiteName: "phase5_v1",
  createdAt: d("2025-01-28T14:00:00Z"),
  summary: "Demo evaluation run. Connect DB and run eval:seed + eval:run for real metrics.",
  durationMs: 5000,
  results: {
    metrics: {
      rules: { precision: 1, recall: 1, f1: 1 },
      retrieval: { policyHitRate: 0.67, precedentHitRate: 1 },
      advisory: { schemaValidRate: 1, citationValidRate: 1, nonBindingComplianceRate: 1, signalHitRate: 0.67 },
    },
    cases: demoEvalCases,
  },
};
