import { Button } from "@/components/ui/button";
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

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface shadow-soft">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
            BeaconGate
          </h1>
          <p className="mt-1 text-text-muted">
            Evidence-first ads enforcement: policy-as-code, LLM advisory checks, and audit-ready case files.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Feature cards */}
        <section className="mb-12">
          <h2 className="mb-6 text-lg font-semibold text-text-primary">
            Why BeaconGate
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <h3 className="font-semibold text-text-primary">
                Evidence-First
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Every decision is anchored to captured evidence: screenshots, redirect chains, and hashes. No judgment without a snapshot.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold text-text-primary">
                Policy-as-Code
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Rules run deterministically. Traceable outputs and rule IDs for every match. LLM input is advisory only and clearly labeled.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold text-text-primary">
                Audit-Ready Case Files
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                Case files link decisions to evidence and rule runs. Ready for compliance and investigations.
              </p>
            </Card>
          </div>
        </section>

        {/* Queue preview + Case preview side by side on larger screens */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Mock Queue preview table */}
          <Card>
            <CardHeader>
              <CardTitle>Queue preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Badge variant="high">High</Badge>
                    </TableCell>
                    <TableCell className="text-text-muted">Pending</TableCell>
                    <TableCell className="text-text-primary">Landing page</TableCell>
                    <TableCell className="text-text-muted">2h ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="medium">Medium</Badge>
                    </TableCell>
                    <TableCell className="text-text-muted">In review</TableCell>
                    <TableCell className="text-text-primary">Creative</TableCell>
                    <TableCell className="text-text-muted">5h ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="low">Low</Badge>
                    </TableCell>
                    <TableCell className="text-text-muted">Pending</TableCell>
                    <TableCell className="text-text-primary">Landing page</TableCell>
                    <TableCell className="text-text-muted">1d ago</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mock Case preview panel */}
          <Card>
            <CardHeader>
              <CardTitle>Case preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-background p-8 text-center">
                <p className="text-sm text-text-muted">
                  Screenshot / evidence placeholder
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Captured snapshot will appear here
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface-elevated p-4">
                <h3 className="text-sm font-semibold text-text-primary">
                  Rule hits
                </h3>
                <p className="mt-2 text-sm text-text-muted">
                  Policy-as-code results (deterministic). Rule IDs and match details.
                </p>
              </div>
              <div className="rounded-md border border-border bg-surface-elevated p-4">
                <h3 className="text-sm font-semibold text-text-primary">
                  LLM Advisory (non-binding)
                </h3>
                <p className="mt-2 text-sm text-text-muted">
                  Model-suggested guidance only. Not used as the basis for the final decision.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary CTA */}
        <div className="mt-10 flex justify-center">
          <Button size="lg">Create Case (Demo)</Button>
        </div>
      </main>
    </div>
  );
}
