import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
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

function tierVariant(tier: string) {
  switch (tier) {
    case "HIGH":
      return "high";
    case "MEDIUM":
      return "medium";
    default:
      return "low";
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "OPEN":
      return "accent";
    case "IN_REVIEW":
      return "medium";
    case "CLOSED":
      return "default";
    default:
      return "default";
  }
}

function caseStatusVariant(status: string) {
  switch (status) {
    case "CAPTURING":
      return "medium";
    case "READY_FOR_REVIEW":
    case "IN_REVIEW":
      return "accent";
    case "DECIDED":
      return "default";
    default:
      return "default";
  }
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status as string | undefined;
  const sort = params.sort ?? "riskDesc";

  const items = await prisma.queueItem.findMany({
    where: statusFilter ? { status: statusFilter as "OPEN" | "IN_REVIEW" | "CLOSED" } : undefined,
    include: {
      case: true,
    },
    orderBy:
      sort === "riskDesc"
        ? { riskScore: "desc" }
        : sort === "riskAsc"
          ? { riskScore: "asc" }
          : sort === "createdDesc"
            ? { createdAt: "desc" }
            : { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">Queue</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Queue items</CardTitle>
          <div className="flex gap-2">
            <span className="text-sm text-text-muted">Filter:</span>
            <Link
              href="/queue"
              className={`rounded px-2 py-1 text-sm ${!statusFilter ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text-primary"}`}
            >
              All
            </Link>
            <Link
              href="/queue?status=OPEN"
              className={`rounded px-2 py-1 text-sm ${statusFilter === "OPEN" ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text-primary"}`}
            >
              Open
            </Link>
            <Link
              href="/queue?status=IN_REVIEW"
              className={`rounded px-2 py-1 text-sm ${statusFilter === "IN_REVIEW" ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text-primary"}`}
            >
              In review
            </Link>
            <Link
              href="/queue?status=CLOSED"
              className={`rounded px-2 py-1 text-sm ${statusFilter === "CLOSED" ? "bg-accent-muted text-accent" : "text-text-muted hover:text-text-primary"}`}
            >
              Closed
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 text-sm text-text-muted">
            Sort:{" "}
            <Link
              href={`/queue${statusFilter ? `?status=${statusFilter}` : ""}?sort=riskDesc`}
              className="hover:text-text-primary"
            >
              Risk (high first)
            </Link>
            {" · "}
            <Link
              href={`/queue${statusFilter ? `?status=${statusFilter}` : ""}?sort=riskAsc`}
              className="hover:text-text-primary"
            >
              Risk (low first)
            </Link>
            {" · "}
            <Link
              href={`/queue${statusFilter ? `?status=${statusFilter}` : ""}?sort=createdDesc`}
              className="hover:text-text-primary"
            >
              Newest
            </Link>
            {" · "}
            <Link
              href={`/queue${statusFilter ? `?status=${statusFilter}` : ""}?sort=createdAsc`}
              className="hover:text-text-primary"
            >
              Oldest
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk</TableHead>
                <TableHead>Case status</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant={tierVariant(item.tier)}>
                      {item.tier} ({item.riskScore})
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={caseStatusVariant(item.case.status)}>{item.case.status}</Badge>
                    {item.case.status === "CAPTURING" && (
                      <span className="ml-2 text-xs text-text-muted">Capturing evidence…</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {item.case.category}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/case/${item.caseId}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Open case
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-text-muted">
              No queue items match the filter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
