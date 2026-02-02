import { isDemoMode } from "@/lib/runtime/mode";
import { demoEvalRun } from "@/lib/demo/data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EvalCasesTable } from "./EvalCasesTable";

export const dynamic = "force-dynamic";

export default async function EvalPage({
  searchParams,
}: {
  searchParams: Promise<{ failing?: string }>;
}) {
  const sp = await searchParams;
  const showOnlyFailing = sp.failing === "1" || sp.failing === "true";

  let run: {
    id: string;
    suite: { name: string };
    createdAt: Date;
    summary: string;
    durationMs: number;
    results: {
      config?: unknown;
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
      cases?: {
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
      }[];
    };
  } | null;

  if (isDemoMode()) {
    run = {
      id: demoEvalRun.id,
      suite: { name: demoEvalRun.suiteName },
      createdAt: demoEvalRun.createdAt,
      summary: demoEvalRun.summary,
      durationMs: demoEvalRun.durationMs,
      results: demoEvalRun.results,
    };
  } else {
    const { prisma } = await import("@/lib/db");
    const dbRun = await prisma.evalRun.findFirst({
      where: { suite: { name: "phase5_v1" } },
      orderBy: { createdAt: "desc" },
      include: { suite: true },
    });
    run = dbRun as typeof run;
  }

  if (!run) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-2xl border border-border-soft bg-surface/20 p-6 backdrop-blur-md md:p-8">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-primary">Evaluation</h1>
          <p className="text-text-muted">
            No evaluation run found. Run{" "}
            <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-sm">npm run eval:seed</code> then{" "}
            <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-sm">npm run eval:run</code> to generate results.
          </p>
        </div>
      </div>
    );
  }

  const results = run.results as {
    config?: unknown;
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
    cases?: {
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
    }[];
  };

  const metrics = results?.metrics ?? {};
  const cases = results?.cases ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-2xl border border-border-soft bg-surface/20 p-6 backdrop-blur-md md:p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-primary">Evaluation</h1>
        <p className="mb-6 text-sm text-text-muted">
          Latest run: {run.suite.name} — {run.createdAt.toISOString()}
        </p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="eval-metrics">
          <Card className="border-border-soft bg-surface-elevated/25 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base">Rules P/R/F1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg font-semibold text-text-primary">
                {metrics.rules
                  ? `${(metrics.rules.precision * 100).toFixed(1)}% / ${(metrics.rules.recall * 100).toFixed(1)}% / ${(metrics.rules.f1 * 100).toFixed(1)}%`
                  : "—"}
              </p>
              <p className="text-xs text-text-muted">Micro precision / recall / F1</p>
            </CardContent>
          </Card>
          <Card className="border-border-soft bg-surface-elevated/25 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base">Policy hit @K</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg font-semibold text-text-primary">
                {metrics.retrieval ? `${(metrics.retrieval.policyHitRate * 100).toFixed(1)}%` : "—"}
              </p>
              <p className="text-xs text-text-muted">Policy chunk hit rate</p>
            </CardContent>
          </Card>
          <Card className="border-border-soft bg-surface-elevated/25 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base">Precedent hit @K</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-lg font-semibold text-text-primary">
                {metrics.retrieval ? `${(metrics.retrieval.precedentHitRate * 100).toFixed(1)}%` : "—"}</p>
              <p className="text-xs text-text-muted">Precedent hit rate</p>
            </CardContent>
          </Card>
          <Card className="border-border-soft bg-surface-elevated/25 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base">Advisory hygiene</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm font-semibold text-text-primary">
                {metrics.advisory
                  ? `Schema ${(metrics.advisory.schemaValidRate * 100).toFixed(0)}% · Citations ${(metrics.advisory.citationValidRate * 100).toFixed(0)}% · Signals ${(metrics.advisory.signalHitRate * 100).toFixed(0)}%`
                  : "—"}
              </p>
              <p className="text-xs text-text-muted">Schema valid, citation valid, signal hit</p>
            </CardContent>
          </Card>
        </div>

        <section data-testid="eval-cases-section">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Cases</h2>
          <EvalCasesTable cases={cases} showOnlyFailing={showOnlyFailing} />
        </section>

        {run.summary && <p className="mt-6 text-sm text-text-muted">{run.summary}</p>}
      </div>
    </div>
  );
}
