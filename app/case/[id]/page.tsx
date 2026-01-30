import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { submitDecision } from "@/app/actions/submit-decision";
import { generateAdvisory } from "@/app/actions/generate-advisory";
import { retryCaptureForm } from "@/app/actions/retry-capture";
import { runRetrievalFormAction } from "@/app/actions/run-retrieval";
import { DecisionForm } from "./decision-form";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import path from "path";
import fs from "fs/promises";

export default async function CasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ alreadyDecided?: string; error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const c = await prisma.case.findUnique({
    where: { id },
    include: {
      evidence: {
        include: {
          artifacts: true,
          captureRuns: true,
          currentCaptureRun: true,
        },
      },
      ruleRuns: { include: { rule: true } },
      llmRuns: true,
      queueItem: true,
      decision: true,
      caseFiles: true,
      retrievalRuns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!c) notFound();

  // Optional: when viewing a case, mark queue item OPEN → IN_REVIEW and case NEW/READY_FOR_REVIEW → IN_REVIEW (not when CAPTURING)
  if (c.queueItem?.status === "OPEN" && c.status !== "CAPTURING") {
    await prisma.queueItem.update({
      where: { id: c.queueItem.id },
      data: { status: "IN_REVIEW" },
    });
  }
  if (c.status === "NEW" || c.status === "READY_FOR_REVIEW") {
    await prisma.case.update({
      where: { id },
      data: { status: "IN_REVIEW" },
    });
  }
  // Re-fetch to reflect updated state in UI
  const cRefreshed = await prisma.case.findUnique({
    where: { id },
    include: {
      evidence: {
        include: {
          artifacts: true,
          captureRuns: true,
          currentCaptureRun: true,
        },
      },
      ruleRuns: { include: { rule: true } },
      llmRuns: true,
      queueItem: true,
      decision: true,
      caseFiles: true,
      retrievalRuns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const caseToRender = cRefreshed ?? c;
  const caseFile = caseToRender.caseFiles[0];
  const caseFileContent = caseFile?.content as Record<string, unknown> | null;

  const storageDir = process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "storage", "evidence");
  const redirectArtifacts = caseToRender.evidence.artifacts.filter((a) => a.type === "REDIRECT_CHAIN");
  const networkArtifacts = caseToRender.evidence.artifacts.filter((a) => a.type === "NETWORK_SUMMARY");
  const redirectData = await Promise.all(
    redirectArtifacts.map(async (a) => {
      if (!a.path) return { id: a.id, data: null };
      try {
        const fullPath = path.join(storageDir, ...a.path.split("/").filter(Boolean));
        const content = await fs.readFile(fullPath, "utf8");
        return { id: a.id, data: JSON.parse(content) as { url: string; status?: number }[] };
      } catch {
        return { id: a.id, data: null };
      }
    })
  );
  const networkData = await Promise.all(
    networkArtifacts.map(async (a) => {
      if (!a.path) return { id: a.id, data: null };
      try {
        const fullPath = path.join(storageDir, ...a.path.split("/").filter(Boolean));
        const content = await fs.readFile(fullPath, "utf8");
        return { id: a.id, data: JSON.parse(content) as { totalRequests: number; byType: Record<string, number>; topDomains: string[] } };
      } catch {
        return { id: a.id, data: null };
      }
    })
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {sp.alreadyDecided === "1" && (
        <div className="mb-4 rounded-md border border-warn bg-warn-muted px-4 py-3 text-sm text-warn" role="alert">
          This case is already decided. No second decision or case file was created.
        </div>
      )}
      {sp.error === "validation" && (
        <div className="mb-4 rounded-md border border-danger bg-danger-muted px-4 py-3 text-sm text-danger" role="alert">
          Invalid decision input. Please try again.
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Case {id.slice(0, 8)}…</h1>
        <Link href="/queue" className="text-sm text-accent hover:underline">
          ← Back to queue
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Evidence Capture card (Phase 2) */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence capture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseToRender.evidence.currentCaptureRun ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        caseToRender.evidence.currentCaptureRun.status === "SUCCEEDED"
                          ? "low"
                          : caseToRender.evidence.currentCaptureRun.status === "FAILED"
                            ? "high"
                            : "medium"
                      }
                    >
                      {caseToRender.evidence.currentCaptureRun.status}
                    </Badge>
                    {(caseToRender.evidence.currentCaptureRun.status === "RUNNING" ||
                      caseToRender.evidence.currentCaptureRun.status === "QUEUED") && (
                      <span className="text-sm text-text-muted">Capturing…</span>
                    )}
                  </div>
                  {caseToRender.evidence.lastCapturedAt && (
                    <p className="text-sm text-text-muted">
                      Last captured: {new Date(caseToRender.evidence.lastCapturedAt).toLocaleString()}
                    </p>
                  )}
                  {caseToRender.evidence.currentCaptureRun.status === "FAILED" && (
                    <div className="rounded-md border border-danger-muted bg-danger-muted/50 p-3 text-sm text-danger">
                      {caseToRender.evidence.artifacts.length > 0
                        ? "FAILED (partial evidence captured)"
                        : caseToRender.evidence.currentCaptureRun.errorMessage ?? "Capture failed."}
                      {caseToRender.evidence.artifacts.length > 0 &&
                        caseToRender.evidence.currentCaptureRun.errorMessage && (
                          <span className="block mt-1 text-text-muted">
                            {caseToRender.evidence.currentCaptureRun.errorMessage}
                          </span>
                        )}
                    </div>
                  )}
                  {caseToRender.evidence.currentCaptureRun.status === "FAILED" && (
                    <form action={retryCaptureForm}>
                      <input type="hidden" name="caseId" value={id} />
                      <Button type="submit" variant="secondary" size="sm">
                        Retry capture
                      </Button>
                    </form>
                  )}
                  {(caseToRender.evidence.currentCaptureRun.status === "SUCCEEDED" ||
                    (caseToRender.evidence.currentCaptureRun.status === "FAILED" &&
                      caseToRender.evidence.artifacts.length > 0)) &&
                    caseToRender.evidence.artifacts.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-text-primary">Artifacts</p>
                        {caseToRender.evidence.artifacts
                          .filter((a) => a.type === "SCREENSHOT")
                          .map((a) => (
                            <div key={a.id} className="rounded-md border border-border bg-background p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/artifacts/${a.id}`}
                                alt="Screenshot"
                                className="max-h-64 w-full object-contain"
                              />
                            </div>
                          ))}
                        {caseToRender.evidence.artifacts
                          .filter((a) => a.type === "HTML_SNAPSHOT")
                          .map((a) => (
                            <div key={a.id}>
                              <a
                                href={`/api/artifacts/${a.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-accent hover:underline"
                              >
                                Open HTML snapshot
                              </a>
                            </div>
                          ))}
                        {redirectData.map(
                          (r) =>
                            r.data && (
                              <div key={r.id} className="rounded-md border border-border bg-surface-elevated p-3">
                                <p className="text-sm font-medium text-text-primary mb-2">Redirect chain</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>URL</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {r.data.map((step, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="text-xs text-text-primary break-all">{step.url}</TableCell>
                                        <TableCell className="text-xs text-text-muted">{step.status ?? "—"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )
                        )}
                        {networkData.map(
                          (n) =>
                            n.data && (
                              <div key={n.id} className="rounded-md border border-border bg-surface-elevated p-3">
                                <p className="text-sm font-medium text-text-primary mb-2">Network summary</p>
                                <p className="text-xs text-text-muted">
                                  Total requests: {n.data.totalRequests}. Top domains: {n.data.topDomains?.slice(0, 5).join(", ")}
                                </p>
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs text-accent">View JSON</summary>
                                  <pre className="mt-2 overflow-auto rounded bg-background p-2 text-xs text-text-muted">
                                    {JSON.stringify(n.data, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )
                        )}
                      </div>
                    )}
                </>
              ) : caseToRender.status === "CAPTURING" ? (
                <div className="flex items-center gap-2">
                  <Badge variant="medium">QUEUED</Badge>
                  <span className="text-sm text-text-muted">Capturing evidence…</span>
                </div>
              ) : (
                <p className="text-sm text-text-muted">No capture run yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-muted">Landing URL</p>
                <a
                  href={caseToRender.evidence.landingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {caseToRender.evidence.landingUrl}
                </a>
              </div>
              {caseToRender.evidence.screenshotPath &&
              !caseToRender.evidence.screenshotPath.includes("/") &&
              caseToRender.evidence.screenshotPath.length > 20 ? (
                <div className="rounded-md border border-border bg-background p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/artifacts/${caseToRender.evidence.screenshotPath}`}
                    alt="Screenshot"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              ) : caseToRender.evidence.screenshotPath ? (
                <div className="rounded-md border border-border bg-background p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={caseToRender.evidence.screenshotPath}
                    alt="Screenshot"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-md border border-border bg-background p-8 text-center">
                  <p className="text-sm text-text-muted">
                    {caseToRender.status === "CAPTURING"
                      ? "Capturing evidence…"
                      : "No screenshot yet."}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Evidence hash: {caseToRender.evidence.evidenceHash.slice(0, 16)}…
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phase 3: Policy & Precedent Assistant */}
          <Card>
            <CardHeader>
              <CardTitle>Policy &amp; Precedent Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseToRender.retrievalRuns.length === 0 ? (
                <form action={runRetrievalFormAction}>
                  <input type="hidden" name="caseId" value={id} />
                  <Button type="submit" variant="secondary" size="sm">
                    Run Retrieval
                  </Button>
                </form>
              ) : (
                <>
                  {(() => {
                    const run = caseToRender.retrievalRuns[0];
                    const results = run.results as {
                      policy?: { documentTitle: string; score: number; snippet: string; content?: string }[];
                      precedent?: { documentTitle: string; score: number; snippet: string; content?: string }[];
                    };
                    const policy = results?.policy ?? [];
                    const precedent = results?.precedent ?? [];
                    return (
                      <>
                        <div className="flex gap-2 border-b border-border pb-2">
                          <span className="text-sm font-medium text-text-primary">Policy Matches</span>
                          <span className="text-sm text-text-muted">|</span>
                          <span className="text-sm font-medium text-text-primary">Similar Cases</span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-text-muted">Policy</p>
                            {policy.length === 0 ? (
                              <p className="text-sm text-text-muted">No policy matches.</p>
                            ) : (
                              policy.map((item, i) => (
                                <div key={i} className="rounded-md border border-border bg-surface-elevated p-3 text-sm">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-text-primary">{item.documentTitle}</span>
                                    <Badge variant="medium">{item.score.toFixed(2)}</Badge>
                                  </div>
                                  <p className="mt-1 text-text-muted line-clamp-2">{item.snippet}</p>
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-xs text-accent hover:underline">Open context</summary>
                                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-background p-2 text-xs text-text-muted whitespace-pre-wrap">
                                      {item.content ?? item.snippet}
                                    </pre>
                                  </details>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-text-muted">Similar Cases</p>
                            {precedent.length === 0 ? (
                              <p className="text-sm text-text-muted">No similar precedents.</p>
                            ) : (
                              precedent.map((item, i) => (
                                <div key={i} className="rounded-md border border-border bg-surface-elevated p-3 text-sm">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-text-primary">{item.documentTitle}</span>
                                    <Badge variant="medium">{item.score.toFixed(2)}</Badge>
                                  </div>
                                  <p className="mt-1 text-text-muted line-clamp-2">{item.snippet}</p>
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-xs text-accent hover:underline">Open context</summary>
                                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-background p-2 text-xs text-text-muted whitespace-pre-wrap">
                                      {item.content ?? item.snippet}
                                    </pre>
                                  </details>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-text-muted">
                          Last retrieval: {new Date(run.createdAt).toLocaleString()} · {run.embedModel}
                        </p>
                        <form action={runRetrievalFormAction}>
                          <input type="hidden" name="caseId" value={id} />
                          <Button type="submit" variant="secondary" size="sm">
                            Run Retrieval again
                          </Button>
                        </form>
                      </>
                    );
                  })()}
                </>
              )}
              <p className="text-xs text-text-muted border-t border-border pt-3">
                Retrieval is advisory; reviewer remains responsible.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rule hits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {caseToRender.ruleRuns.map((run) => (
                  <li
                    key={run.id}
                    className="rounded-md border border-border bg-surface-elevated p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-text-primary">{run.rule.name}</span>
                      <span className="text-xs text-text-muted font-mono">{run.ruleId}</span>
                      <Badge variant={run.rule.severity === "HIGH" ? "high" : run.rule.severity === "MEDIUM" ? "medium" : "low"}>
                        {run.rule.severity}
                      </Badge>
                      {run.triggered && (
                        <Badge variant="high">Triggered</Badge>
                      )}
                      <span className="text-xs text-text-muted">evidenceRef: {run.evidenceRef}</span>
                    </div>
                    <p className="mt-1 text-text-muted">{run.explanation}</p>
                    {run.matchedText && (
                      <p className="mt-1 text-xs text-text-muted">Matched: {run.matchedText}</p>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LLM Advisory (non-binding)</CardTitle>
            </CardHeader>
            <CardContent>
              {caseToRender.llmRuns.length > 0 ? (
                <div className="rounded-md border border-border bg-surface-elevated p-4">
                  <p className="text-xs font-medium text-text-muted mb-2">
                    Advisory only — not used as the basis for the final decision.
                  </p>
                  <p className="text-sm text-text-primary">{caseToRender.llmRuns[0].advisoryText}</p>
                </div>
              ) : (
                <div className="rounded-md border border-border bg-surface-elevated p-4">
                  <p className="text-sm text-text-muted mb-3">No advisory generated yet.</p>
                  <form action={generateAdvisory}>
                    <input type="hidden" name="caseId" value={id} />
                    <Button type="submit" variant="secondary" size="sm">
                      Generate advisory (mock)
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {(caseToRender.status === "READY_FOR_REVIEW" || caseToRender.status === "IN_REVIEW") && (
            <Card>
              <CardHeader>
                <CardTitle>Reviewer decision</CardTitle>
              </CardHeader>
              <CardContent>
                <DecisionForm caseId={id} />
              </CardContent>
            </Card>
          )}
          {caseToRender.status === "CAPTURING" && (
            <p className="text-sm text-text-muted">Decision form is available after evidence capture completes.</p>
          )}

          {caseToRender.status === "DECIDED" && caseToRender.decision && (
            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <strong>Outcome:</strong> {caseToRender.decision.outcome}
                </p>
                {caseToRender.decision.reviewerNotes && (
                  <p className="mt-2 text-sm text-text-muted">{caseToRender.decision.reviewerNotes}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Case file</CardTitle>
            </CardHeader>
            <CardContent>
              {caseFileContent ? (
                <div className="space-y-4">
                  <div className="rounded-md border border-border bg-surface-elevated p-4 text-sm">
                    <h4 className="font-semibold text-text-primary mb-2">Evidence summary</h4>
                    <pre className="whitespace-pre-wrap text-xs text-text-muted">
                      {JSON.stringify((caseFileContent as { evidence_summary?: unknown }).evidence_summary, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded-md border border-border bg-surface-elevated p-4 text-sm">
                    <h4 className="font-semibold text-text-primary mb-2">Rule run summary</h4>
                    <pre className="whitespace-pre-wrap text-xs text-text-muted">
                      {JSON.stringify((caseFileContent as { rule_run_summary?: unknown }).rule_run_summary, null, 2)}
                    </pre>
                  </div>
                  {"llm_advisory" in caseFileContent && caseFileContent.llm_advisory != null && (
                    <div className="rounded-md border border-border bg-surface-elevated p-4 text-sm">
                      <h4 className="font-semibold text-text-primary mb-2">LLM Advisory (non-binding)</h4>
                      <pre className="whitespace-pre-wrap text-xs text-text-muted">
                        {JSON.stringify(caseFileContent.llm_advisory, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="rounded-md border border-border bg-surface-elevated p-4 text-sm">
                    <h4 className="font-semibold text-text-primary mb-2">Reviewer decision</h4>
                    <pre className="whitespace-pre-wrap text-xs text-text-muted">
                      {JSON.stringify((caseFileContent as { reviewer_decision?: unknown }).reviewer_decision, null, 2)}
                    </pre>
                  </div>
                  <details className="rounded-md border border-border bg-background">
                    <summary className="cursor-pointer p-3 text-sm font-medium text-text-primary">
                      Raw JSON
                    </summary>
                    <pre className="overflow-auto p-3 text-xs text-text-muted">
                      {JSON.stringify(caseFileContent, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  Case file will be generated when a decision is submitted.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
