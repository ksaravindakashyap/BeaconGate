# Phase 2 Entry Criteria

Phase 2 introduces **real evidence capture** and a **background job model** without breaking Phase 1 determinism or audit properties. This document locks what we add and what we preserve.

---

## What Phase 2 Adds

### 1. Playwright evidence capture

- **Screenshots**: Full-page or viewport screenshot of the landing page.
- **HTML snapshot**: Captured HTML (or key DOM) for the page at capture time.
- **Redirect chain**: URLs + status codes from initial request to final URL (no crawl; follow redirects only).
- **Network summary**: Optional summary of requests (e.g. count, failed, timeout) for audit context.

Evidence record continues to store `landingUrl`, `screenshotPath`, `evidenceHash`, and gains fields for HTML snapshot path and redirect chain (e.g. JSON array).

### 2. BullMQ + Redis worker for capture jobs

- **Queue**: BullMQ (Redis-backed) for capture jobs; submit flow enqueues a job instead of creating evidence inline.
- **Worker**: Separate process (or same repo, different entry) that:
  - Picks up capture jobs.
  - Runs Playwright (or equivalent) to load URL, capture screenshot + HTML + redirect chain.
  - Computes evidence hash (see below).
  - Writes Evidence row and updates Case (and optionally QueueItem) when ready.
- **Case lifecycle**: Case may stay in a “capturing” state until worker completes; then becomes “ready for review.”

### 3. Evidence integrity

- **Hash**: `evidenceHash` must include (deterministically):
  - HTML snapshot bytes (or normalized representation).
  - Screenshot bytes (or file path + file hash).
  - Redirect chain (ordered list of URL + status).
  - Capture metadata (e.g. timestamp, user-agent, viewport).
- Same inputs → same hash; any tampering or re-capture changes the hash so audit can detect.

### 4. Case status lifecycle

- **Phase 1**: `NEW` → `IN_REVIEW` → `DECIDED`.
- **Phase 2**: `NEW` → `CAPTURING` → `READY_FOR_REVIEW` (or keep `IN_REVIEW`) → `DECIDED`.
- **Schema**: Add `CAPTURING` and optionally `READY_FOR_REVIEW` to `CaseStatus` enum; transition to `READY_FOR_REVIEW` when evidence capture completes; reviewer flow unchanged (open case → decide → DECIDED).

### 5. Basic SSRF safety (not “enterprise,” but not reckless)

- **Allowlist schemes**: Only `https` (and optionally `http` for dev); reject others.
- **Block private IP ranges**: Reject or do not resolve URLs to private/internal IPs (e.g. 10.x, 172.16–31, 192.168, 127, link-local).
- **Timeout limits**: Cap total time and redirect hops for capture (e.g. 30s, max 10 redirects).
- **No full crawl**: Evidence capture = load the one URL (and follow redirects); no outbound navigation to other domains for Phase 2.

---

## What We Preserve (Phase 1 invariants)

- **Determinism**: Policy-as-code rules still run on evidence (after capture); same evidence + same rules → same RuleRuns. LLM remains advisory only and labeled.
- **Auditability**: Every decision still points to evidence + rule runs; CaseFile v1 (and future versions) still contains evidence summary, rule run summary, LLM advisory (labeled), reviewer decision. Evidence hash in CaseFile ties to stored Evidence.
- **Decision immutability**: No second decision or CaseFile for the same case; server rejects/redirects with clear message if resubmitted.
- **Queue state transitions**: New case → OPEN; when viewed → IN_REVIEW; after decision → CLOSED, case DECIDED. Phase 2 may add “capturing” or “pending capture” before OPEN/IN_REVIEW.
- **RuleRuns**: Every case still has at least one RuleRun per enabled rule (run after evidence is ready).
- **Risk score**: Still computed from rule severities (10 + Σ weights, cap 100); tier bands unchanged.

---

## Implementation order (suggested)

1. Add `CAPTURING` (and optionally `READY_FOR_REVIEW`) to schema; add Evidence fields for HTML path, redirect chain JSON.
2. Introduce BullMQ + Redis; define capture job payload; submit flow enqueues job, creates Case in NEW/CAPTURING, no Evidence yet (or placeholder).
3. Implement worker: Playwright script → screenshot + HTML + redirect chain → hash (HTML + screenshot + redirect + metadata) → create/update Evidence, update Case to READY_FOR_REVIEW/IN_REVIEW, create QueueItem.
4. Run rules when evidence is ready (worker or API after worker completes); compute risk; update QueueItem.
5. Add SSRF checks: scheme allowlist, private-IP check, timeouts, max redirects.
6. UI: show “Capturing…” for CAPTURING cases; show evidence (screenshot, HTML snippet, redirect chain) when ready.

---

*Document version: Phase 2 entry. Update when scope or invariants change.*
