# MVP User Flows

This document describes the main user flows for BeaconGate MVP: submit ad → queue → case → decision, dashboard views, and (future) RAG assistant.

---

## Flow 1: Submit ad → evidence capture → queue item

**Actor:** System (triggered by API or internal submit).

1. **Submit ad:** Client (or internal system) submits an ad: creative ID, destination URL, metadata. API validates input and enqueues a job.
2. **Evidence capture (worker):** Worker picks up job; runs Playwright (or equivalent) to:
   - Load destination URL in headless browser.
   - Capture screenshot (snapshot).
   - Record redirect chain (URLs + status codes).
   - Compute content hash(es) (e.g. SHA-256 of snapshot or key DOM).
   - Record timestamps (capture time) and env (e.g. geo, device if applicable).
3. **Persist evidence:** Worker writes **LandingEvidence** (screenshot blob, redirect chain, hashes, timestamps, env) to storage.
4. **Rule run (optional):** Worker runs policy-as-code rules against evidence; produces **RuleRun** records (rule ID, input ref, result).
5. **LLM advisory (optional):** Worker may call LLM for advisory output; result stored as **LLMRun** and clearly labeled as non-binding.
6. **Queue item:** Worker creates or updates **QueueItem**: links to AdCreative + LandingEvidence; risk score (derived from rules or default); status (e.g. Pending); category; created/updated time. Item appears in reviewer queue.

**Outcome:** Reviewer sees new or updated item in queue with risk badge, status, category, created time.

---

## Flow 2: Reviewer opens case → sees evidence + rules + LLM advisory → decides → case file generated

**Actor:** Reviewer.

1. **Open case:** Reviewer selects an item from the queue. UI loads **QueueItem** and linked **AdCreative**, **LandingEvidence**, **RuleRun**(s), and **LLMRun** (if any).
2. **Case view:** UI shows:
   - **Evidence:** Screenshot, redirect chain, hashes, timestamps (read-only).
   - **Rule hits:** Policy-as-code results with rule IDs and match details (deterministic; traceable).
   - **LLM Advisory (non-binding):** Model-suggested guidance in a separate, clearly labeled section; not mixed with rule hits.
3. **Decide:** Reviewer chooses **Approve**, **Reject**, or **Escalate** and (if required) enters a reason.
4. **Persist decision:** System creates **ReviewDecision** with: decision type, reason, references to evidence ID(s), rule run ID(s), and (if used) LLM run ID with “advisory only” note.
5. **Case file:** System generates **CaseFile** (audit-ready): decision + evidence refs + rule run refs; LLM output in separate section. Case file is stored and (later) exportable.

**Outcome:** Decision is recorded; case file is available for audit and investigations.

---

## Flow 3: Dashboard views (time-to-decision, agreement, drift)

**Actor:** Investigator or Policy Analyst.

1. **Time-to-decision:** Dashboard shows metrics (e.g. average time from queue entry to decision; distribution by category or risk level). No interaction required beyond viewing.
2. **Agreement:** Dashboard shows agreement metrics (e.g. rule outcome vs human decision: agree / disagree rates). Supports policy tuning.
3. **Drift:** Dashboard shows drift over time (systematic disagreement between rules and human decisions). Flags trends for policy review.

**Outcome:** Investigators and policy analysts can monitor efficiency and rule–human alignment without changing queue or case flow.

---

## Flow 4 (future): RAG assistant suggests policy / precedent

**Actor:** Policy Analyst (or Reviewer, if enabled).

1. **Query:** User asks a natural-language question (e.g. “What does policy say about X?” or “Similar precedent for Y?”).
2. **RAG retrieval:** System uses pgvector (or equivalent) to retrieve relevant **PolicyDoc**(s) and **PrecedentCase**(s) from storage.
3. **Response:** Assistant returns suggested policy text or precedent summary with source refs. Output is clearly advisory; user makes final judgment.

**Outcome:** Faster policy lookup and precedent discovery; no change to determinism or auditability of reviewer decisions.

---

*Document version: Phase 0. Flow 1–3 are in MVP scope; Flow 4 is Phase 3+.*
