import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-border bg-surface shadow-soft">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-text-primary hover:text-accent"
        >
          BeaconGate
        </Link>
        <div className="flex gap-4">
          <Link
            href="/submit"
            className="text-sm font-medium text-text-muted hover:text-text-primary"
          >
            Submit
          </Link>
          <Link
            href="/queue"
            className="text-sm font-medium text-text-muted hover:text-text-primary"
          >
            Queue
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-text-muted hover:text-text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/eval"
            className="text-sm font-medium text-text-muted hover:text-text-primary"
          >
            Eval
          </Link>
        </div>
      </div>
    </nav>
  );
}
