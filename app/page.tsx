import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroSection } from "@/components/HeroSection";
import { isDemoMode } from "@/lib/runtime/mode";

export default function Home() {
  const demo = isDemoMode();
  return (
    <div className="min-h-screen w-full">
      {demo && (
        <div className="relative z-0 mx-auto max-w-[90rem] px-4 pt-4 md:px-6">
          <Card className="border-border-soft bg-surface/40 backdrop-blur-md">
            <CardContent className="py-3 text-sm font-semibold text-text-muted">
              This is a demo deployment. Use{" "}
              <Link
                href="/setup"
                className="text-accent transition-colors duration-200 hover:underline hover:text-accent-hover"
              >
                /setup
              </Link>{" "}
              to enable full mode.
            </CardContent>
          </Card>
        </div>
      )}
      <main className="relative z-0 min-h-screen w-full">
        <HeroSection
          title="BeaconGate — Evidence-first ads enforcement"
          description="Capture reproducible evidence, run deterministic policy-as-code checks, and review with advisory policy & precedent retrieval."
          badgeText="Evidence-first"
          badgeLabel="Platform"
          ctaButtons={[
            { text: "Submit a Case", href: "/submit", primary: true },
            { text: "View Queue", href: "/queue" },
          ]}
          microDetails={[
            "Evidence-first",
            "Deterministic traces",
            "Audit-ready case files",
          ]}
        />

        <div className="relative z-0 border-b border-border-soft bg-surface/30 py-5 backdrop-blur-md">
          <div className="mx-auto max-w-[90rem] px-4 md:px-6">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <span className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <span className="text-accent" aria-hidden>✓</span>
                Evidence-first
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <span className="text-accent" aria-hidden>✓</span>
                Deterministic traces
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <span className="text-accent" aria-hidden>✓</span>
                Audit-ready case files
              </span>
            </div>
          </div>
        </div>

        <section
          id="features"
          className="relative z-0 border-b border-border-soft py-10 md:py-14"
        >
          <div className="mx-auto max-w-[90rem] px-4 md:px-6">
            <h2 className="text-center text-xl font-bold text-text-primary md:text-2xl">
              Everything you need for ads enforcement
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm font-semibold text-text-muted">
              Built for review teams that value reproducibility and control.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Evidence Capture",
                  desc: "Playwright-based capture with hashed artifacts.",
                  icon: (
                    <svg
                      className="size-5 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M2 8h20v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z" />
                      <path d="M7 5V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  ),
                },
                {
                  title: "Redirect & Cloaking Signals",
                  desc: "Detect redirect chains and cloaking patterns.",
                  icon: (
                    <svg
                      className="size-5 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  ),
                },
                {
                  title: "Policy-as-Code Rules",
                  desc: "Deterministic rules with traceable rule IDs.",
                  icon: (
                    <svg
                      className="size-5 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M16 18 22 12l-6-6" />
                      <path d="M8 6 2 12l6 6" />
                    </svg>
                  ),
                },
                {
                  title: "Risk Queue Prioritization",
                  desc: "Queue and triage by risk and category.",
                  icon: (
                    <svg
                      className="size-5 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  ),
                },
                {
                  title: "Audit-ready Case Files",
                  desc: "Case files linked to evidence and rule runs.",
                  icon: (
                    <svg
                      className="size-5 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="m9 15 2 2 4-4" />
                    </svg>
                  ),
                },
                {
                  title: "Policy & Precedent Assistant",
                  desc: "RAG retrieval for policy and precedent (advisory).",
                  icon: (
                    <svg
                      className="size-5 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      <path d="M8 7h3" />
                      <path d="M8 11h6" />
                      <circle cx="17" cy="11" r="4" />
                      <path d="m20 14 1.5 1.5" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  className="border-border-soft bg-surface-elevated/30 shadow-card backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg"
                >
                  <CardContent className="p-4">
                    <span className="inline-flex items-center" aria-hidden>
                      {item.icon}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm font-semibold text-text-muted">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="about"
          className="relative z-0 border-b border-border-soft py-10 md:py-14"
        >
          <div className="mx-auto max-w-[90rem] px-4 md:px-6">
            <h2 className="text-center text-xl font-bold text-text-primary md:text-2xl">
              How it works
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Capture evidence
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-text-muted">
                  Submit a URL; we capture screenshots, HTML, and redirect chains
                  with integrity hashes.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Run deterministic checks
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-text-muted">
                  Rules run as code. Every match has a rule ID and trace.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Review + audit
                </h3>
                <p className="mt-1.5 text-sm font-semibold text-text-muted">
                  Queue cases, add decisions, and keep case files linked to
                  evidence and rules.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="relative z-0 border-b border-border-soft py-10 md:py-14"
        >
          <div className="mx-auto max-w-[90rem] px-4 md:px-6">
            <h2 className="text-center text-xl font-bold text-text-primary md:text-2xl">
              Get in touch
            </h2>
            <p className="mx-auto mt-2 text-center text-sm font-semibold text-text-muted">
              Questions or feedback? Reach out anytime.
            </p>
            <Card className="mx-auto mt-8 max-w-2xl border-border-soft bg-surface-elevated/30 shadow-card backdrop-blur-md transition-all duration-200 hover:border-accent/30">
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                <div>
                  <p className="text-base font-bold text-text-primary">
                    K S Aravinda Kashyap
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 text-sm font-semibold text-text-muted">
                  <a
                    href="mailto:ksaravindakashyap@gmail.com"
                    className="inline-flex items-center gap-2 text-accent transition-colors duration-200 hover:text-accent-hover"
                  >
                    <svg
                      className="size-4 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    ksaravindakashyap@gmail.com
                  </a>
                  <a
                    href="https://linkedin.com/in/ksaravindakashyap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-accent transition-colors duration-200 hover:text-accent-hover"
                  >
                    <svg
                      className="size-4 shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                    linkedin.com/in/ksaravindakashyap
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="relative z-0 border-t border-border-soft bg-surface/40 py-10 md:py-12 backdrop-blur-md">
          <div className="mx-auto max-w-[90rem] px-4 text-center md:px-6">
            <h2 className="text-xl font-bold text-text-primary md:text-2xl">
              Ready to review with evidence?
            </h2>
            <p className="mt-2 text-base font-semibold text-text-muted">
              Submit a case or open the queue.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="min-w-0 bg-accent text-accent-foreground hover:bg-accent-hover"
                asChild
              >
                <Link href="/submit">Submit a Case</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-w-0 border-border-soft bg-transparent text-text-primary hover:bg-surface/50 hover:text-text-primary hover:border-accent/50"
                asChild
              >
                <Link href="/queue">Open Queue</Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="relative z-0 border-t border-border-soft py-8">
          <div className="mx-auto max-w-[90rem] px-4 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-bold text-text-primary">
                  BeaconGate
                </p>
                <p className="mt-0.5 text-sm font-semibold text-text-muted">
                  Evidence-first enforcement workflow
                </p>
              </div>
              <div className="flex flex-wrap gap-5">
                <Link
                  href="#about"
                  className="text-sm font-semibold text-text-muted transition-colors duration-200 hover:text-accent"
                >
                  About
                </Link>
                <Link
                  href="#features"
                  className="text-sm font-semibold text-text-muted transition-colors duration-200 hover:text-accent"
                >
                  Features
                </Link>
                <Link
                  href="/queue"
                  className="text-sm font-semibold text-text-muted transition-colors duration-200 hover:text-accent"
                >
                  Open Queue
                </Link>
              </div>
            </div>
            <div className="mt-6 border-t border-border-soft pt-4">
              <p className="text-xs font-semibold text-text-muted">
                © {new Date().getFullYear()} BeaconGate. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
