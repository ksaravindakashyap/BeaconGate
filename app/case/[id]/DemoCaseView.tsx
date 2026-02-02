import Link from "next/link";
import type { DemoCase } from "@/lib/demo/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export function DemoCaseView({
  case: c,
  id,
  redirectData,
  networkData,
}: {
  case: DemoCase;
  id: string;
  redirectData: { id: string; data: { url: string; status?: number }[] | null }[];
  networkData: { id: string; data: { totalRequests: number; topDomains?: string[] } | null }[];
}) {
  const run = c.retrievalRuns[0];
  const policy = run?.results?.policy ?? [];
  const precedent = run?.results?.precedent ?? [];
  const latestLlm = c.llmRuns[0];
  const advisory = latestLlm?.advisoryJson as Record<string, unknown> | null | undefined;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-text-primary">Case {id.slice(0, 8)}…</h1>
          <Badge variant={c.status === "DECIDED" ? "default" : c.status === "CAPTURING" ? "medium" : "accent"} data-testid="case-status">
            {c.status}
          </Badge>
        </div>
        <Link href="/queue" className="text-sm text-accent hover:underline">
          ← Back to queue
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence capture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {c.evidence.currentCaptureRun && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        c.evidence.currentCaptureRun.status === "SUCCEEDED"
                          ? "low"
                          : c.evidence.currentCaptureRun.status === "FAILED"
                            ? "high"
                            : "medium"
                      }
                      data-testid="capture-status"
                    >
                      {c.evidence.currentCaptureRun.status}
                    </Badge>
                  </div>
                  {c.evidence.currentCaptureRun.status === "FAILED" && c.evidence.artifacts.length > 0 && (
                    <div className="rounded-md border border-danger-muted bg-danger-muted/50 p-3 text-sm text-danger">
                      FAILED (partial evidence captured). {c.evidence.currentCaptureRun.errorMessage ?? ""}
                    </div>
                  )}
                  <p className="text-sm text-text-muted">Capture disabled in demo.</p>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-text-primary">Artifacts</p>
                    {c.evidence.artifacts.some((a) => a.type === "SCREENSHOT") && (
                      <div className="rounded-md border border-border bg-background p-8 text-center">
                        <p className="text-sm text-text-muted">Screenshot unavailable in demo.</p>
                      </div>
                    )}
                    {c.evidence.artifacts.some((a) => a.type === "HTML_SNAPSHOT") && (
                      <p className="text-sm text-text-muted">HTML snapshot: placeholder in demo.</p>
                    )}
                    {redirectData.map(
                      (r) =>
                        r.data && (
                          <div key={r.id} className="rounded-md border border-border bg-surface-elevated p-3">
                            <p className="mb-2 text-sm font-medium text-text-primary">Redirect chain</p>
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
                                    <TableCell className="break-all text-xs text-text-primary">{step.url}</TableCell>
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
                            <p className="mb-2 text-sm font-medium text-text-primary">Network summary</p>
                            <p className="text-xs text-text-muted">
                              Total requests: {n.data.totalRequests}. Top domains: {n.data.topDomains?.slice(0, 5).join(", ") ?? "—"}
                            </p>
                          </div>
                        )
                    )}
                  </div>
                </>
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
                <a href={c.evidence.landingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
                  {c.evidence.landingUrl}
                </a>
              </div>
              <div className="rounded-md border border-border bg-background p-8 text-center">
                <p className="text-sm text-text-muted">Screenshot unavailable in demo.</p>
                <p className="mt-1 text-xs text-text-muted">Evidence hash: {c.evidence.evidenceHash.slice(0, 16)}…</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Policy &amp; Precedent Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {run ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-text-muted">Policy</p>
                      {policy.length === 0 ? (
                        <p className="text-sm text-text-muted">No policy matches.</p>
                      ) : (
                        policy.map((item, i) => (
                          <div key={i} className="rounded-md border border-border bg-surface-elevated p-3 text-sm">
                            <span className="font-medium text-text-primary">{item.documentTitle}</span>
                            <Badge variant="medium" className="ml-2">{item.score.toFixed(2)}</Badge>
                            <p className="mt-1 text-text-muted line-clamp-2">{item.snippet}</p>
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
                            <span className="font-medium text-text-primary">{item.documentTitle}</span>
                            <Badge variant="medium" className="ml-2">{item.score.toFixed(2)}</Badge>
                            <p className="mt-1 text-text-muted line-clamp-2">{item.snippet}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">Already computed in demo.</p>
                </>
              ) : (
                <p className="text-sm text-text-muted">Run retrieval disabled in demo.</p>
              )}
              <p className="border-t border-border pt-3 text-xs text-text-muted">Retrieval is advisory; reviewer remains responsible.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rule hits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {c.ruleRuns.map((run) => (
                  <li key={run.id} className="rounded-md border border-border bg-surface-elevated p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-text-primary">{run.rule.name}</span>
                      <span className="font-mono text-xs text-text-muted">{run.ruleId}</span>
                      <Badge variant={run.rule.severity === "HIGH" ? "high" : run.rule.severity === "MEDIUM" ? "medium" : "low"}>
                        {run.rule.severity}
                      </Badge>
                      {run.triggered && <Badge variant="high">Triggered</Badge>}
                      <span className="text-xs text-text-muted">evidenceRef: {run.evidenceRef}</span>
                    </div>
                    <p className="mt-1 text-text-muted">{run.explanation}</p>
                    {run.matchedText && <p className="mt-1 text-xs text-text-muted">Matched: {run.matchedText}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LLM Advisory (non-binding)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestLlm ? (
                <>
                  <p className="text-xs text-text-muted">
                    {latestLlm.provider} · {new Date(latestLlm.createdAt).toLocaleString()}
                    {latestLlm.latencyMs != null && ` · ${latestLlm.latencyMs}ms`}
                  </p>
                  <p className="text-sm text-text-primary">{latestLlm.advisoryText}</p>
                  {Array.isArray(advisory?.claims) && advisory.claims.length > 0 && (
                    <details className="rounded border border-border bg-surface-elevated">
                      <summary className="cursor-pointer p-2 text-sm font-medium text-text-primary">Claims</summary>
                      <pre className="whitespace-pre-wrap p-2 text-xs text-text-muted">{JSON.stringify(advisory.claims, null, 2)}</pre>
                    </details>
                  )}
                  {Array.isArray(advisory?.policyConcerns) && advisory.policyConcerns.length > 0 && (
                    <details className="rounded border border-border bg-surface-elevated">
                      <summary className="cursor-pointer p-2 text-sm font-medium text-text-primary">Policy concerns</summary>
                      <pre className="whitespace-pre-wrap p-2 text-xs text-text-muted">{JSON.stringify(advisory.policyConcerns, null, 2)}</pre>
                    </details>
                  )}
                  <p className="text-xs text-text-muted">Generate advisory disabled in demo.</p>
                </>
              ) : (
                <p className="text-sm text-text-muted">No advisory in this demo case.</p>
              )}
              <p className="border-t border-border-soft pt-3 text-xs text-text-muted">Non-binding. Reviewer remains responsible.</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reviewer decision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">Decisions are disabled in demo.</p>
            </CardContent>
          </Card>

          {c.caseFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Case file</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded bg-background p-3 text-xs text-text-muted">
                  {JSON.stringify(c.caseFiles[0].content, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
