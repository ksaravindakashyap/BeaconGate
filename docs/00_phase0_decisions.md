# Phase 0 — Decisions & Product/Engineering Spec

This document is the canonical decision record for BeaconGate. It locks scope, stack, architecture, and operational constraints before implementation.

---

## Product definition

**BeaconGate** is an evidence-first ads enforcement workflow: ads and landing pages are submitted, evidence is captured (screenshots, redirect chains, hashes), policy-as-code rules run deterministically, and optional LLM checks provide advisory (non-binding) input. Reviewers work from a queue, see evidence + rule hits + LLM advisory in one place, and make decisions that produce audit-ready case files. Later, an investigations/efficiency dashboard and a RAG policy assistant extend the product.

---

## MVP scope (IN)

- **Submit ad** → evidence capture (screenshot, redirect chain, env, hashes, timestamps) → queue item created.
- **Reviewer queue**: list of items with risk score, status, category, created time; open case from queue.
- **Case view**: evidence snapshot, rule hits (policy-as-code output with rule IDs), LLM advisory (clearly labeled as non-binding).
- **Review decision**: approve / reject / escalate with reason; decision stored with references to evidence IDs and rule run IDs.
- **Case file**: generated case file (audit-ready) linking decision → evidence → rule runs; LLM output separated.
- **Investigations/efficiency dashboard**: time-to-decision, agreement metrics, drift (rule vs human) views.
- **Operational constraints**: evidence hashing, determinism for rules, labeling of LLM output, auditability (every decision points to evidence and rule IDs).

---

## Non-goals (OUT for MVP)

- RAG policy assistant (Phase 3+).
- Full SSRF/input hardening and PII redaction (later phase).
- Multi-tenant or complex RBAC (MVP: Reviewer, Investigator, Policy Analyst roles only).
- Real-time collaboration or live notifications (MVP: queue + case view is sufficient).
- Custom rule authoring UI (MVP: rules as code/config only).

---

## Primary user roles

| Role | Responsibility |
|------|----------------|
| **Reviewer** | Opens cases from queue, views evidence + rules + LLM advisory, makes approve/reject/escalate decisions. |
| **Investigator** | Uses dashboard and case files for investigations; may drill into evidence and rule runs. |
| **Policy Analyst** | Defines/maintains policy-as-code rules; may consume RAG assistant later. |

---

## Core objects

| Object | Purpose |
|--------|---------|
| **AdCreative** | Submitted ad payload (creative ID, destination URL, metadata). |
| **LandingEvidence** | Captured evidence: screenshot, redirect chain, hashes (e.g. SHA-256 of snapshot), timestamps, env (e.g. geo, device). |
| **PolicyRule** | Policy-as-code rule definition (ID, name, condition, action). |
| **RuleRun** | Single run of a rule against evidence; deterministic output; traceable (rule ID, input hash, result). |
| **LLMRun** | LLM advisory run; output must be labeled as non-binding; stored separately from rule outputs. |
| **QueueItem** | Item in reviewer queue: links to AdCreative + LandingEvidence; risk score, status, category, created time. |
| **CaseFile** | Audit-ready artifact: decision + evidence refs + rule run refs; LLM output in separate section. |
| **ReviewDecision** | Approve / Reject / Escalate + reason; references evidence IDs and rule run IDs. |
| **PolicyDoc** | Policy document (for RAG later). |
| **PrecedentCase** | Past case (for RAG precedent search later). |

---

## Evidence-first principle

- **What is captured:** Snapshot of landing page (screenshot), redirect chain (URLs + status codes), content hashes (e.g. SHA-256 of snapshot or key DOM), timestamps (capture time, submission time), environment (e.g. geo, device if applicable).
- **How stored:** Immutable blob + metadata; hashes stored for integrity and dedup; timestamps for audit trail.
- **Why:** Every reviewer decision must point to concrete evidence. No “I think the page looked bad”—only “this snapshot and this rule run led to this decision.”

---

## Determinism principle

- **Policy-as-code** produces traceable, deterministic outputs: same evidence + same rules → same rule hits. Rule runs are logged with rule ID, input refs, and result.
- **LLM** is strictly advisory. Its output must not be used as the sole basis for a decision; it must be clearly labeled (e.g. “LLM Advisory (non-binding)”) and stored separately from rule outputs. Decisions are attributed to human + rules + evidence, not to the model.

---

## Auditability requirements

- Every **review decision** must reference: evidence ID(s), rule run ID(s), and (if used) a pointer to LLM run with a clear “advisory only” label.
- **Case files** must be able to reconstruct: who decided what, on which evidence, and which rules fired. LLM output appears in a distinct section, not mixed with rule hits.
- **Logging:** Decision events, rule runs, and evidence capture events are logged for audit (detailed logging/retention in later phase).

---

## Architecture overview

- **UI (Next.js App Router):** Reviewer queue, case view, dashboard; all consume API.
- **API (Next.js route handlers):** Submit ad, get queue, get case, submit decision, get dashboard metrics. Later: separate worker for heavy jobs.
- **Worker (later):** Evidence capture (e.g. Playwright), rule execution, optional LLM advisory calls; publishes results back to storage.
- **Storage (later):** Postgres (Prisma) for structured data; blob store for screenshots/artifacts; Redis for queue (BullMQ).
- **“Submit ad” flow (target):** Client calls API → API enqueues job → Worker picks up → captures evidence → runs rules (and optionally LLM) → writes LandingEvidence, RuleRuns, LLMRun → creates/updates QueueItem. Reviewer sees updated queue and can open case.

---

## Security basics

- **Input validation:** All API inputs validated (URLs, payloads); reject malformed or oversized requests.
- **SSRF guardrails (later):** Evidence capture must restrict outbound requests (allowlist, no internal IPs in redirect chain if policy says so).
- **Sandboxing (later):** Evidence capture (Playwright) runs in isolated env; rule execution sandboxed where applicable.
- **PII (later):** Policy for PII in screenshots/logs; redaction or retention limits as needed.

---

## Observability (later)

- **Logs:** Structured logs for API, worker, and key events (submit, capture, rule run, decision).
- **Metrics:** Queue depth, time-to-decision, rule run latency, error rates.
- **Drift monitoring:** Compare rule outcomes vs human decisions over time; flag systematic disagreement for policy review.

---

## Chosen stack & rationale

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js (App Router) + TypeScript | Single repo, SSR/SSG options, good DX; App Router for layouts and RSC. |
| **Styling** | Tailwind CSS | Utility-first, design tokens, fast iteration; aligns with design system. |
| **UI primitives** | shadcn/ui (Radix) | Accessible, consistent components; copy-paste into repo, full control. |
| **API** | Next.js route handlers | Same deploy, no extra service for MVP; worker can be added later. |
| **DB (later)** | Postgres + Prisma | Relational model fits cases, evidence, rules; Prisma for type-safe access. |
| **Queue (later)** | BullMQ + Redis | Reliable job queue for evidence capture and rule runs. |
| **Evidence capture (later)** | Playwright | Headless browser for screenshots and redirect chain; well maintained. |
| **RAG (later)** | pgvector in Postgres | Policy docs and precedent cases in same DB; vector search for assistant. |

---

## Phase gating

- **Phase 0 (this):** Decisions, design system, repo skeleton, minimal landing page. No DB, no API, no workers.
- **Phase 1:** DB schema (Prisma), core API routes (submit ad, queue, case, decision), evidence capture worker (Playwright), rule runner; end-to-end “submit → queue → case → decision” flow.
- **Phase 2:** Dashboard (time-to-decision, agreement, drift); case file export; hardening (SSRF, PII, sandboxing).
- **Phase 3:** RAG policy assistant (pgvector, policy docs, precedent cases); observability (logs, metrics, drift alerts).

---

## Decision log / tradeoffs

- **Next.js API routes vs separate backend:** Chose Next.js route handlers for MVP to keep one deploy and one repo; worker can run as a separate process or service later. Revisit if API scale or language (e.g. Go) demands a dedicated backend.
- **Postgres + pgvector vs dedicated vector DB:** Chose pgvector in Postgres so policy docs and precedent cases live with relational data; fewer moving parts and one DB to operate. Revisit if embedding scale or latency requires Pinecone/Weaviate/etc.
- **shadcn/ui copy-paste vs full design system lib:** Chose shadcn (Radix + Tailwind) for accessible primitives and full control in-repo; no version lock to an external component library. Custom Button/Badge/Card/Table in `/components/ui` align to our tokens and Gowun Batang.
- **Evidence capture in-process vs worker:** Chose worker (BullMQ) for capture so long-running Playwright runs don’t block API; allows retries and backpressure. In-process capture would simplify deploy but hurt latency and reliability.

---

*Document version: Phase 0. No implementation beyond repo skeleton and landing page until Phase 1.*
