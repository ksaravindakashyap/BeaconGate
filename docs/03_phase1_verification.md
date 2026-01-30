# Phase 1 Verification Checklist

Use this document to verify Phase 1 against the requirements. Each item maps to schema, code, or manual QA.

---

## Phase 1 Final Sign-off (5 quick checks)

| Check | Expected | Implementation |
|-------|----------|----------------|
| **Decision immutability** | Open a DECIDED case → try submitting the decision form again. UI disables decision controls or server rejects with a clear message; no second CaseFile v1. | Decision form is hidden when `caseToRender.status === "DECIDED"`. If a resubmit is attempted (e.g. stale form), `submit-decision` redirects to `/case/[id]?alreadyDecided=1`; case page shows banner: "This case is already decided. No second decision or case file was created." No second ReviewDecision (caseId unique) or CaseFile. |
| **RuleRuns always exist** | Submit a "clean" GENERAL case. RuleRuns table shows all rules (triggered=false for most), not empty. | `runRules()` in `lib/rules/runner.ts` loops over all enabled `PolicyRule` (4 rules) and creates one `RuleRun` per rule. Clean GENERAL case: prohibited phrase no match, missing-disclaimer N/A, domain not denylisted, redirect 0 → all triggered=false. |
| **Risk score determinism** | Pick a case with known triggered severities. riskScore = 10 + Σ(weights of triggered rules), capped at 100; tier matches bands. | `computeRiskScore()`: start 10; HIGH +50, MEDIUM +25, LOW +10; cap 100. Tiers: 70–100 HIGH, 40–69 MEDIUM, 0–39 LOW. Stored on QueueItem at submit. |
| **Queue state transitions** | New case → OPEN. When case is viewed → IN_REVIEW. After decision → CLOSED and case DECIDED. | Submit creates QueueItem with status OPEN. Case page load: if QueueItem.status === OPEN → update to IN_REVIEW; if Case.status === NEW → update to IN_REVIEW. `submit-decision`: Case → DECIDED, QueueItem → CLOSED. |
| **CaseFile reconstructability** | In /case/[id], Evidence panel + rule hits + advisory + decision vs CaseFile rendered + raw JSON. CaseFile contains everything needed to reproduce the decision context. | CaseFile content: `evidence_summary` (landingUrl, evidenceHash, screenshotPath), `rule_run_summary` (ruleId, severity, triggered, matchedText, explanation, evidenceRef), `llm_advisory` (label + advisoryText + model), `reviewer_decision` (outcome, notes, decidedAt). Rendered sections + raw JSON on case page. |

---

## 0) Setup sanity

| Check | How to verify |
|-------|----------------|
| `npm install` completes without errors | Run `npm install` in project root. |
| `docker-compose up -d` starts Postgres and stays healthy | Run `docker-compose up -d`; `docker compose ps` shows postgres running. |
| `.env` has valid `DATABASE_URL` pointing to docker Postgres | `.env`: `DATABASE_URL="postgresql://beacongate:beacongate_dev@localhost:5432/beacongate"`. |
| `npx prisma migrate dev` runs from a clean DB | Run `npx prisma migrate dev --name init` (or after reset). |
| `npx prisma db seed` succeeds and inserts PolicyRules + 10+ cases | Run `npx prisma db seed`; check DB: `PolicyRule` has 4 rows, `Case` has 12, `QueueItem` has 12, at least 2 `ReviewDecision` + `CaseFile`. |

---

## 1) Data correctness (DB invariants)

| Invariant | Where enforced |
|-----------|----------------|
| Every Case has exactly one Evidence (FK not null) | `prisma/schema.prisma`: `Case.evidenceId` required, `evidence` relation; `app/actions/submit-case.ts` creates Evidence then Case with `evidenceId`. |
| Every QueueItem has a unique caseId (no duplicates) | `schema.prisma`: `QueueItem.caseId` has `@unique`. |
| Every submitted case has at least one RuleRun row | `lib/rules/runner.ts` `runRules()`: loops over all enabled `PolicyRule` and creates one `RuleRun` per rule; seed ensures 4 rules, so every case gets 4 RuleRuns. |
| riskScore is 0–100 and matches deterministic formula | `lib/rules/runner.ts` `computeRiskScore()`: start 10, high +50, medium +25, low +10, `Math.min(100, score)`. Stored on `QueueItem.riskScore`. |
| tier matches score bands: 0–39 LOW, 40–69 MEDIUM, 70–100 HIGH | `computeRiskScore()`: `score >= 70` → HIGH, `score >= 40` → MEDIUM, else LOW. Stored on `QueueItem.tier`. |
| CaseFile.content is JSON and never updated after creation | `schema.prisma`: `CaseFile.content` is `Json`; only `prisma.caseFile.create()` in `app/actions/submit-decision.ts`; no update/upsert of CaseFile. Append-only by version (Phase 1 only v1). |

---

## 2) UI + UX checks (pages)

### /submit

| Check | Where |
|-------|--------|
| Form loads with Gowun Batang and token-based styling | `app/layout.tsx` (font); `app/globals.css` (tokens); `app/submit/page.tsx` uses Card, Label, Input, Button. |
| Required fields validated: adText, category, landingUrl (basic URL validation) | `lib/validations.ts` `submitCaseSchema`: adText min 1, category enum, landingUrl `.url()`; `app/submit/submit-form.tsx` uses `useActionState(submitCase)` and displays `state?.error?.adText` / `state?.error?.landingUrl`. |
| Submitting creates Case + Evidence + RuleRuns + QueueItem, then redirects to /case/[id] | `app/actions/submit-case.ts`: create Evidence → Case → `runRules(caseId)` → compute risk → create QueueItem → `redirect(\`/case/${c.id}\`)`. |

### /queue

| Check | Where |
|-------|--------|
| Lists seeded + newly created cases | Server-rendered `app/queue/page.tsx`: `prisma.queueItem.findMany({ include: { case: true } })`. |
| Shows: risk badge, status badge, category, created time | Table columns: Risk (Badge by tier), Status (Badge by status), Category, Created (formatted date); "Open case" link. |
| Sorting works (at minimum by riskScore desc) | `searchParams.sort`: riskDesc, riskAsc, createdDesc, createdAsc; `orderBy` in `findMany`. |
| Filter works (at minimum by OPEN / IN_REVIEW / CLOSED) | `searchParams.status`; `where: { status: statusFilter }`; Filter links All, Open, In review, Closed. |

### /case/[id]

| Check | Where |
|-------|--------|
| Evidence panel: landing URL + screenshot placeholder if none | Evidence card: `c.evidence.landingUrl` (link), screenshot img or placeholder text + evidenceHash snippet. |
| Rule hits: rule id/name, severity, triggered, matchedText, evidenceRef, explanation | Rule hits list: `run.rule.name`, `run.ruleId`, `run.rule.severity` (Badge), Triggered badge, `run.evidenceRef`, `run.explanation`, `run.matchedText`. |
| "LLM Advisory (non-binding)" section (even if empty) | Card title "LLM Advisory (non-binding)"; shows advisory text or "No advisory generated yet" + "Generate advisory (mock)" button. |
| Decision form: APPROVE / REJECT / NEEDS_MORE_INFO + notes | `app/case/[id]/decision-form.tsx`: select outcome, textarea reviewerNotes; `app/actions/submit-decision.ts`. |
| On decision submit: ReviewDecision created, CaseFile v1 created, Case DECIDED, QueueItem CLOSED | `submit-decision.ts`: create ReviewDecision, update Case status DECIDED, update QueueItem status CLOSED, create CaseFile (version 1, content jsonb). |
| Page reflects updated state (no stale UI) | `revalidatePath(\`/case/${caseId}\`)` and `redirect(\`/case/${caseId}\`)` after decision; server-rendered page refetches. |

### /dashboard

| Check | Where |
|-------|--------|
| Backlog count = OPEN + IN_REVIEW queue items | `prisma.queueItem.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } })`. |
| Avg time-to-decision from decided cases | `reviewDecision.findMany` with case; avg(decidedAt - case.createdAt); displayed in hours. |
| Decisions per day (simple table) with real data | "Decisions by day (last 7 days)" table: keys from last 7 days, counts from `decidedAt` date; sorted by date desc. |
| High-risk backlog count with correct tier logic | `prisma.queueItem.count({ where: { tier: "HIGH", status: { in: ["OPEN", "IN_REVIEW"] } } })`. |

---

## 3) Auditability / labeling

| Check | Where |
|-------|--------|
| UI separates Policy-as-code (RuleRuns) = deterministic | Case page: "Rule hits" card; each run shows ruleId, severity, evidenceRef, explanation; no LLM content in this section. |
| LLMRun = labeled non-binding | Case page: card title "LLM Advisory (non-binding)"; body text "Advisory only — not used as the basis for the final decision." Case file: `llm_advisory.label` "LLM Advisory (non-binding)". |
| Case file preview: evidence summary (landingUrl, evidenceHash, screenshotPath if any) | `submit-decision.ts` caseFile content: `evidence_summary: { landingUrl, evidenceHash, screenshotPath }`. Case page renders "Evidence summary" section. |
| Case file: rule run summary (ruleId, triggered, severity, evidenceRef) | `rule_run_summary` array: ruleId, severity, triggered, matchedText, explanation, evidenceRef. |
| Case file: LLM advisory (if present) labeled as advisory | `llm_advisory: { label: "LLM Advisory (non-binding)", advisoryText, model }`. |
| Case file: reviewer decision + notes + timestamps | `reviewer_decision: { outcome, notes, decidedAt }`. |

---

## 4) Click-through test flows (manual QA)

| Flow | Steps |
|------|--------|
| **A** | Queue → open a seeded OPEN case → submit decision → confirm item no longer in OPEN filter; case status DECIDED; Case file v1 visible. |
| **B** | Submit → ad text "Guaranteed results! Act now" (prohibited phrase) → submit → case page shows at least one HIGH/MED rule triggered, riskScore elevated. |
| **C** | Submit → category Health, ad text without "consult your doctor" / "not medical advice" → submit → RULE_MISSING_DISCLAIMER triggered (Medium). |
| **D** | Submit → category General, clean ad text, safe landing URL → submit → low riskScore (near base 10). |
| **E** | After 2–3 decisions, Dashboard: backlog and high-risk backlog decrease; decisions last 7 days and "Decisions by day" table update; avg time-to-decision reflects new decisions. |

---

## 5) Guardrails (don’t silently break later)

| Check | Where |
|-------|--------|
| Prisma client singleton | `lib/db.ts`: `globalThis.prisma ?? new PrismaClient()`; only one client in dev. |
| Server Actions only (no mixed Route Handlers for forms) | Submit: `app/actions/submit-case.ts` (Server Action). Decision: `app/actions/submit-decision.ts` (Server Action). Generate advisory: `app/actions/generate-advisory.ts` (Server Action). No `app/api/*/route.ts` for these flows. |
| No Playwright, BullMQ/Redis, pgvector/RAG in Phase 1 | No imports or usage of Playwright, BullMQ, Redis, pgvector in `app/`, `lib/` (only in docs and package-lock transitive deps if any). |

---

*Document version: Phase 1. Update when checklist or implementation changes.*
