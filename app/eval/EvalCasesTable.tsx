"use client";

import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CaseResult {
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

function isFailing(c: CaseResult): boolean {
  if (c.rules.fn > 0 || c.rules.fp > 0) return true;
  if (!c.retrieval.policyHit || !c.retrieval.precedentHit) return true;
  if (!c.advisory.schemaValid || c.advisory.invalidCitations > 0 || !c.advisory.nonBindingOk || !c.advisory.signalsHit)
    return true;
  return false;
}

export function EvalCasesTable({
  cases,
  showOnlyFailing: initialShowOnlyFailing,
}: {
  cases: CaseResult[];
  showOnlyFailing: boolean;
}) {
  const [showOnlyFailing, setShowOnlyFailing] = useState(initialShowOnlyFailing);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = showOnlyFailing ? cases.filter(isFailing) : cases;
  const failingCount = cases.filter(isFailing).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={showOnlyFailing}
            onChange={(e) => setShowOnlyFailing(e.target.checked)}
            className="rounded border-border"
            data-testid="eval-show-only-failing"
            aria-label="Show only failing cases"
          />
          Show only failing cases
        </label>
        {showOnlyFailing && (
          <span className="text-sm text-text-muted">
            Showing {filtered.length} of {cases.length} ({failingCount} failing)
          </span>
        )}
      </div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Rules FN/FP</TableHead>
              <TableHead className="text-center">Policy</TableHead>
              <TableHead className="text-center">Precedent</TableHead>
              <TableHead className="text-center">Signals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const open = expandedId === c.evalCaseId;
              return (
                <React.Fragment key={c.evalCaseId}>
                  <TableRow
                    className="cursor-pointer hover:bg-border-soft"
                    onClick={() => setExpandedId(open ? null : c.evalCaseId)}
                  >
                    <TableCell className="font-mono text-xs">
                      {open ? "▼" : "▶"}
                    </TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-xs">
                        {c.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {c.rules.fn > 0 || c.rules.fp > 0 ? (
                        <span className="text-danger">
                          {c.rules.fn}/{c.rules.fp}
                        </span>
                      ) : (
                        <span className="text-success">0/0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {c.retrieval.policyHit ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="text-danger">✗</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {c.retrieval.precedentHit ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="text-danger">✗</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {c.advisory.signalsHit ? (
                        <span className="text-success">✓</span>
                      ) : (
                        <span className="text-danger">✗</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow key={`${c.evalCaseId}-detail`}>
                      <TableCell colSpan={7} className="bg-border-soft/50 p-4">
                        <div className="grid gap-4 text-sm md:grid-cols-2">
                          <div>
                            <h4 className="mb-1 font-semibold text-text-primary">Rules</h4>
                            <p className="text-text-muted">
                              Expected: {c.rules.expected.length ? c.rules.expected.join(", ") : "—"}
                            </p>
                            <p className="text-text-muted">
                              Actual: {c.rules.actual.length ? c.rules.actual.join(", ") : "—"}
                            </p>
                          </div>
                          <div>
                            <h4 className="mb-1 font-semibold text-text-primary">Policy top</h4>
                            <ul className="list-inside list-disc space-y-0.5 text-text-muted">
                              {c.retrieval.policyTop.slice(0, 3).map((p, i) => (
                                <li key={i}>
                                  {p.stableChunkId ?? "—"} ({p.score.toFixed(2)}): {p.snippet?.slice(0, 80)}…
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="mb-1 font-semibold text-text-primary">Precedent top</h4>
                            <ul className="list-inside list-disc space-y-0.5 text-text-muted">
                              {c.retrieval.precedentTop.slice(0, 3).map((p, i) => (
                                <li key={i}>
                                  {p.stableChunkId ?? "—"} ({p.score.toFixed(2)}): {p.snippet?.slice(0, 80)}…
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
