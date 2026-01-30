import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [backlogCount, decidedCases, highRiskBacklog] = await Promise.all([
    prisma.queueItem.count({
      where: { status: { in: ["OPEN", "IN_REVIEW"] } },
    }),
    prisma.reviewDecision.findMany({
      include: {
        case: {
          include: { queueItem: true },
        },
      },
    }),
    prisma.queueItem.count({
      where: {
        tier: "HIGH",
        status: { in: ["OPEN", "IN_REVIEW"] },
      },
    }),
  ]);

  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const decisionsByDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() - i * oneDayMs);
    const key = d.toISOString().slice(0, 10);
    decisionsByDay[key] = 0;
  }
  for (const d of decidedCases) {
    const key = d.decidedAt.toISOString().slice(0, 10);
    if (key in decisionsByDay) decisionsByDay[key]++;
  }
  const decisionsLast7Days = Object.values(decisionsByDay).reduce((a, b) => a + b, 0);
  const decisionsToday = decisionsByDay[now.toISOString().slice(0, 10)] ?? 0;

  let avgTimeToDecisionMs: number | null = null;
  if (decidedCases.length > 0) {
    let totalMs = 0;
    for (const d of decidedCases) {
      const caseCreated = d.case.createdAt.getTime();
      const decidedAt = d.decidedAt.getTime();
      totalMs += decidedAt - caseCreated;
    }
    avgTimeToDecisionMs = totalMs / decidedCases.length;
  }
  const avgHours = avgTimeToDecisionMs != null ? (avgTimeToDecisionMs / (60 * 60 * 1000)).toFixed(1) : "—";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Dashboard</h1>
      <p className="mb-8 text-sm text-text-muted">
        Phase 1: backlog, avg time-to-decision, decisions per day, high-risk backlog.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-text-primary">{backlogCount}</p>
            <p className="text-xs text-text-muted">Open + In review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg time-to-decision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-text-primary">{avgHours}h</p>
            <p className="text-xs text-text-muted">Case created → decision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decisions (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-text-primary">{decisionsLast7Days}</p>
            <p className="text-xs text-text-muted">Today: {decisionsToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">High-risk backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-text-primary">{highRiskBacklog}</p>
            <p className="text-xs text-text-muted">HIGH tier, open or in review</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Decisions by day (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Decisions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(decisionsByDay)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, count]) => (
                  <TableRow key={date}>
                    <TableCell className="text-text-primary">{date}</TableCell>
                    <TableCell className="text-text-muted">{count}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
