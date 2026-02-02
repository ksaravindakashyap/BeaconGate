import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-border-soft bg-surface/20 shadow-soft backdrop-blur-md">
      <div className="mx-auto flex max-w-[90rem] items-center gap-6 px-6 py-4">
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-text-primary transition-colors duration-200 hover:text-accent"
        >
          BeaconGate
        </Link>
        <div className="flex gap-4">
          <Link
            href="/submit"
            className="text-sm font-semibold text-text-muted transition-colors duration-200 hover:text-accent hover:underline"
          >
            Submit
          </Link>
          <Link
            href="/queue"
            className="text-sm font-semibold text-text-muted transition-colors duration-200 hover:text-accent hover:underline"
          >
            Queue
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-text-muted transition-colors duration-200 hover:text-accent hover:underline"
          >
            Dashboard
          </Link>
          <Link
            href="/eval"
            className="text-sm font-semibold text-text-muted transition-colors duration-200 hover:text-accent hover:underline"
          >
            Eval
          </Link>
        </div>
      </div>
    </nav>
  );
}
