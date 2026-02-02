"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/submit", label: "Submit" },
  { href: "/queue", label: "Queue" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/eval", label: "Eval" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border-soft bg-surface/20 shadow-soft backdrop-blur-md">
      <div className="mx-auto flex max-w-[90rem] items-center gap-6 px-6 py-4">
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-text-primary transition-colors duration-200 hover:text-accent"
        >
          BeaconGate
        </Link>
        <div className="flex gap-2">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? "border border-border-soft bg-surface/25 text-text-primary backdrop-blur-md"
                    : "text-text-muted hover:bg-surface/15 hover:text-text-primary"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
