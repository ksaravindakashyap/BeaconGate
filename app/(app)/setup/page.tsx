import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-border-soft bg-surface/20 p-6 backdrop-blur-md md:p-8">
        <h1 className="mb-6 text-2xl font-bold text-text-primary">Setup</h1>
        <p className="mb-6 text-sm text-text-muted">
          In demo mode, data is static and not persisted. To enable full mode (persistence and evidence capture), set the following and restart.
        </p>

        <Card className="mb-6 border-border-soft bg-surface-elevated/25 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Required environment variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <code className="rounded border border-border-soft bg-surface-elevated/60 px-1.5 py-0.5 font-mono text-text-primary">
                DATABASE_URL
              </code>
              <p className="mt-1 text-text-muted">PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/db).</p>
            </div>
            <div>
              <code className="rounded border border-border-soft bg-surface-elevated/60 px-1.5 py-0.5 font-mono text-text-primary">
                REDIS_URL
              </code>
              <p className="mt-1 text-text-muted">Redis connection string (e.g. redis://localhost:6379). Used for the capture job queue.</p>
            </div>
            <div>
              <code className="rounded border border-border-soft bg-surface-elevated/60 px-1.5 py-0.5 font-mono text-text-primary">
                EVIDENCE_STORAGE_DIR
              </code>
              <p className="mt-1 text-text-muted">Path where screenshots and artifacts are stored (e.g. ./storage/evidence).</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft bg-surface-elevated/25 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Deploy checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-decimal space-y-2 text-sm text-text-muted">
              <li>
                Copy <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">.env.example</code> to{" "}
                <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">.env</code>
              </li>
              <li>
                Set <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">DATABASE_URL</code>,{" "}
                <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">REDIS_URL</code>,{" "}
                <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">EVIDENCE_STORAGE_DIR</code>
              </li>
              <li>
                Start Postgres and Redis (e.g.{" "}
                <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">docker-compose up -d</code>)
              </li>
              <li>
                Run <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">npx prisma migrate deploy</code> and{" "}
                <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">npm run db:seed</code>
              </li>
              <li>
                Run <code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">npm run rag:ingest</code>
              </li>
              <li>
                Start the worker (<code className="rounded border border-border-soft bg-surface-elevated/60 px-1 font-mono text-text-primary">npm run worker</code>) for evidence capture
              </li>
              <li>Restart the app</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
