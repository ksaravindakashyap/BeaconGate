export function SetupRequired() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-lg border border-border-soft bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-text-primary">
          Setup required
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          <code className="rounded bg-muted px-1.5 py-0.5">DATABASE_URL</code> is not set.
          Start Postgres and Redis, then add a <code className="rounded bg-muted px-1.5 py-0.5">.env</code> file.
        </p>
        <ol className="mt-4 list-inside list-decimal space-y-1 text-sm text-text-muted">
          <li>Copy <code className="rounded bg-muted px-1">.env.example</code> to <code className="rounded bg-muted px-1">.env</code></li>
          <li>Run <code className="rounded bg-muted px-1">docker-compose up -d</code></li>
          <li>Restart the dev server</li>
        </ol>
        <p className="mt-4 text-sm text-text-muted">
          See README for full setup.
        </p>
      </div>
    </div>
  );
}
