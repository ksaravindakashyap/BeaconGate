/**
 * Single source of truth for Badge variant names.
 * Use these helpers so pages don't pass custom className or hardcoded variant logic.
 */

export type CaseStatusVariant =
  | "status_capturing"
  | "status_ready"
  | "status_in_review"
  | "status_decided"
  | "status_open"
  | "status_closed"
  | "default";

export function caseStatusVariant(status: string): CaseStatusVariant {
  switch (status) {
    case "CAPTURING":
      return "status_capturing";
    case "READY_FOR_REVIEW":
      return "status_ready";
    case "IN_REVIEW":
      return "status_in_review";
    case "DECIDED":
      return "status_decided";
    case "NEW":
      return "status_open";
    case "CLOSED":
      return "status_closed";
    default:
      return "default";
  }
}

export type CaptureRunStatusVariant = "risk_low" | "risk_high" | "risk_medium";

export function captureStatusVariant(status: string): CaptureRunStatusVariant {
  switch (status) {
    case "SUCCEEDED":
      return "risk_low";
    case "FAILED":
      return "risk_high";
    case "RUNNING":
    case "QUEUED":
    default:
      return "risk_medium";
  }
}

export type SeverityVariant = "risk_high" | "risk_medium" | "risk_low";

export function severityVariant(severity: string): SeverityVariant {
  const s = severity?.toUpperCase() ?? "";
  switch (s) {
    case "HIGH":
      return "risk_high";
    case "MEDIUM":
      return "risk_medium";
    case "LOW":
      return "risk_low";
    default:
      return "risk_medium";
  }
}

export type TierVariant = "risk_high" | "risk_medium" | "risk_low";

export function tierVariant(tier: string): TierVariant {
  switch (tier) {
    case "HIGH":
      return "risk_high";
    case "MEDIUM":
      return "risk_medium";
    default:
      return "risk_low";
  }
}

export type QueueStatusVariant = "status_open" | "status_in_review" | "status_closed" | "default";

export function queueStatusVariant(status: string): QueueStatusVariant {
  switch (status) {
    case "OPEN":
      return "status_open";
    case "IN_REVIEW":
      return "status_in_review";
    case "CLOSED":
      return "status_closed";
    default:
      return "default";
  }
}
