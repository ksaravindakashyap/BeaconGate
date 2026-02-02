import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isDemoMode } from "@/lib/runtime/mode";

export default function Home() {
  const demo = isDemoMode();
  return (
    <div className="min-h-screen bg-background">
      {demo && (
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6">
          <Card className="border-border-soft bg-surface-elevated">
            <CardContent className="py-3 text-sm text-text-muted">
              This is a demo deployment. Use <Link href="/setup" className="text-accent hover:underline">/setup</Link> to enable full mode.
            </CardContent>
          </Card>
        </div>
      )}
      <main>
        {/* Hero: two columns — single H1 with orange highlight */}
        <section className="border-b border-border-soft py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
              {/* Left column */}
              <div>
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl md:text-5xl">
                  BeaconGate —
                  <br />
                  <span className="text-orange-600">Evidence-first</span>
                  <br />
                  ads enforcement
                </h1>
                <p className="mt-5 max-w-lg text-lg text-text-muted">
                  Capture reproducible evidence, run deterministic policy-as-code checks, and review with advisory policy & precedent retrieval.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button size="lg" variant="primary" asChild>
                    <Link href="/submit">Submit a Case</Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/queue">View Queue</Link>
                  </Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="default">Evidence Capture</Badge>
                  <Badge variant="default">Deterministic Rules</Badge>
                  <Badge variant="accent">RAG (advisory)</Badge>
                </div>
              </div>

              {/* Right column: stacked preview cards */}
              <div className="relative space-y-4">
                <Card className="relative z-10 border-border-soft shadow-card">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-text-primary">Capture Artifacts</p>
                    <p className="mt-0.5 text-xs text-text-muted">Playwright evidence bundle</p>
                    <p className="mt-2 text-xs text-text-muted">Screenshot · HTML Snapshot · Redirect Chain</p>
                  </CardContent>
                </Card>
                <Card className="relative left-2 z-0 border-border-soft shadow-card md:left-3">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-text-primary">Rule Runs</p>
                    <p className="mt-0.5 text-xs text-text-muted">Deterministic policy-as-code</p>
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-xs text-text-primary">rule_redirect</span>
                      <span className="rounded bg-border-soft px-1.5 py-0.5 font-mono text-xs text-text-primary">rule_claim</span>
                    </p>
                  </CardContent>
                </Card>
                <Card className="relative left-4 z-0 border-border-soft shadow-card md:left-6">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-text-primary">Policy & Precedent</p>
                    <p className="mt-0.5 text-xs text-text-muted">pgvector retrieval (advisory)</p>
                    <p className="mt-2 text-xs text-text-muted">Top matches · Similar cases</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          {/* 3-check row under hero */}
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-border-soft pt-8">
              <span className="flex items-center gap-2 text-sm text-text-primary">
                <span className="text-orange-500" aria-hidden>✓</span>
                Evidence-first
              </span>
              <span className="flex items-center gap-2 text-sm text-text-primary">
                <span className="text-orange-500" aria-hidden>✓</span>
                Deterministic traces
              </span>
              <span className="flex items-center gap-2 text-sm text-text-primary">
                <span className="text-orange-500" aria-hidden>✓</span>
                Audit-ready case files
              </span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border-soft py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-2xl font-semibold text-text-primary md:text-3xl">
              Everything you need for ads enforcement
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-text-muted">
              Built for review teams that value reproducibility and control.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Evidence Capture", desc: "Playwright-based capture with hashed artifacts.", icon: (<svg className="size-6 shrink-0 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 8h20v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z"/><path d="M7 5V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1"/><circle cx="12" cy="13" r="3"/></svg>) },
                { title: "Redirect & Cloaking Signals", desc: "Detect redirect chains and cloaking patterns.", icon: (<svg className="size-6 shrink-0 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>) },
                { title: "Policy-as-Code Rules", desc: "Deterministic rules with traceable rule IDs.", icon: (<svg className="size-6 shrink-0 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M16 18 22 12l-6-6"/><path d="M8 6 2 12l6 6"/></svg>) },
                { title: "Risk Queue Prioritization", desc: "Queue and triage by risk and category.", icon: (<svg className="size-6 shrink-0 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>) },
                { title: "Audit-ready Case Files", desc: "Case files linked to evidence and rule runs.", icon: (<svg className="size-6 shrink-0 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg>) },
                { title: "Policy & Precedent Assistant", desc: "RAG retrieval for policy and precedent (advisory).", icon: (<svg className="size-6 shrink-0 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h3"/><path d="M8 11h6"/><circle cx="17" cy="11" r="4"/><path d="m20 14 1.5 1.5"/></svg>) },
              ].map((item) => (
                <Card key={item.title} className="border-border-soft shadow-card">
                  <CardContent className="p-6">
                    <span className="inline-flex items-center" aria-hidden>{item.icon}</span>
                    <h3 className="mt-2 font-semibold text-text-primary">{item.title}</h3>
                    <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About / How it works */}
        <section id="about" className="border-b border-border-soft py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-xl font-semibold text-text-primary md:text-2xl">How it works</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <div>
                <h3 className="font-semibold text-text-primary">Capture evidence</h3>
                <p className="mt-1 text-sm text-text-muted">Submit a URL; we capture screenshots, HTML, and redirect chains with integrity hashes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Run deterministic checks</h3>
                <p className="mt-1 text-sm text-text-muted">Rules run as code. Every match has a rule ID and trace.</p>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Review + audit</h3>
                <p className="mt-1 text-sm text-text-muted">Queue cases, add decisions, and keep case files linked to evidence and rules.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact — Get in touch */}
        <section id="contact" className="border-b border-border-soft py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-2xl font-semibold text-text-primary">Get in touch</h2>
            <p className="mx-auto mt-2 text-center text-text-muted">Questions or feedback? Reach out anytime.</p>
            <Card className="mx-auto mt-10 max-w-2xl border-border-soft shadow-card">
              <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-text-primary">K S Aravinda Kashyap</p>
                </div>
                <div className="flex flex-col gap-2 text-sm text-text-muted">
                  <a href="mailto:ksaravindakashyap@gmail.com" className="inline-flex items-center gap-2 hover:text-text-primary">
                    <svg className="size-4 shrink-0 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    ksaravindakashyap@gmail.com
                  </a>
                  <a href="https://linkedin.com/in/ksaravindakashyap" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-text-primary">
                    <svg className="size-4 shrink-0 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                    linkedin.com/in/ksaravindakashyap
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Bottom CTA band — orange */}
        <section className="bg-orange-500 py-14 md:py-16">
          <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
            <h2 className="text-xl font-semibold text-white md:text-2xl">Ready to review with evidence?</h2>
            <p className="mt-2 text-orange-100">Submit a case or open the queue.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="min-w-0 bg-white text-stone-900 hover:bg-orange-50" asChild>
                <Link href="/submit">Submit a Case</Link>
              </Button>
              <Button size="lg" variant="secondary" className="min-w-0 border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/queue">Open Queue</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-soft py-10">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-text-primary">BeaconGate</p>
                <p className="mt-0.5 text-sm text-text-muted">Evidence-first enforcement workflow</p>
              </div>
              <div className="flex flex-wrap gap-6">
                <Link href="#about" className="text-sm text-text-muted hover:text-text-primary">About</Link>
                <Link href="#features" className="text-sm text-text-muted hover:text-text-primary">Features</Link>
                <Link href="/queue" className="text-sm text-text-muted hover:text-text-primary">Open Queue</Link>
              </div>
            </div>
            <div className="mt-8 border-t border-border-soft pt-6">
              <p className="text-xs text-text-muted">© {new Date().getFullYear()} BeaconGate. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
