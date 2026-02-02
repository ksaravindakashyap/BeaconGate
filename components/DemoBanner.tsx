import Link from "next/link";
import { isDemoMode } from "@/lib/runtime/mode";
import { Button } from "@/components/ui/button";

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="border-b border-border-soft bg-surface/20 px-4 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4">
        <p className="text-sm font-semibold text-text-muted">
          Demo mode — connect Postgres/Redis to enable persistence and evidence capture.
        </p>
        <Link href="/setup">
          <Button variant="outline" size="sm">
            Setup
          </Button>
        </Link>
      </div>
    </div>
  );
}
