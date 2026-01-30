# Phase 2 Verification Checklist

Evidence capture + worker, SSRF guardrails, artifact integrity, UI gating.

## 0) Infra sanity

- [ ] `docker-compose up -d` brings up Postgres + Redis (both healthy)
- [ ] `.env` has working `DATABASE_URL`, `REDIS_URL`, `EVIDENCE_STORAGE_DIR`
- [ ] `npm run dev` starts without errors
- [ ] `npm run worker` starts and stays running (logs "ready" / processing)

## 1) Queue/job correctness

- [ ] Submitting at `/submit` creates Case + Evidence and enqueues one `evidence-capture` job
- [ ] Case immediately becomes `CAPTURING`
- [ ] Worker creates an `EvidenceCaptureRun` with: `status RUNNING`, `startedAt` set
- [ ] On completion: CaptureRun `SUCCEEDED`, `finishedAt` set; `Evidence.lastCapturedAt` set; Case status → `READY_FOR_REVIEW`

## 2) Artifact integrity + immutability

After a successful capture:

- [ ] Exactly 4 artifacts exist for the run: SCREENSHOT (png), HTML_SNAPSHOT (.html), REDIRECT_CHAIN (.json), NETWORK_SUMMARY (.json)
- [ ] Each `EvidenceArtifact` has: `sha256` populated, `byteSize` populated, `meta` includes viewport + userAgent
- [ ] Files exist on disk at `storage/evidence/<evidenceId>/<captureRunId>/...`
- [ ] `Evidence.evidenceHash` is set and stable across reloads
- [ ] Re-running capture creates new artifacts (new captureRun folder); old artifacts remain untouched

## 3) SSRF guardrails

**Blocked (must fail with clear error):**

- [ ] `http://localhost:3000` → CaptureRun FAILED, errorMessage explains blocked host / private IP
- [ ] `http://127.0.0.1` → same
- [ ] `http://169.254.169.254` → same  
  Case remains in failed-capture state with Retry button visible.

**Allowed:**

- [ ] `https://example.com` → Capture succeeds, artifacts created

## 4) Rules + risk score (post-capture, deterministic)

- [ ] Rules execute after capture (in worker) and create RuleRuns
- [ ] HTML-based rules fire when applicable: hidden-text heuristic (HTML snapshot), suspicious redirects (redirect chain)
- [ ] Risk score recomputed from triggered rules and stored on QueueItem; tier matches score bands
- [ ] Queue page reflects updated score/tier after capture completes

## 5) UI behavior

**`/queue`**

- [ ] CAPTURING cases show "Capturing…" and cannot be decided from queue
- [ ] READY_FOR_REVIEW cases show distinct status badge
- [ ] DECIDED cases show CLOSED queue status + DECIDED case status

**`/case/[id]`**

- [ ] While CAPTURING: decision controls disabled, capture progress shown (QUEUED or RUNNING)
- [ ] On SUCCEEDED: screenshot preview, redirect chain table, network summary, HTML snapshot link
- [ ] `GET /api/artifacts/[artifactId]`: screenshot → image/png, HTML → text/html, JSON → application/json (or safe render)
- [ ] If FAILED: clear error + Retry button; Retry enqueues new attempt

## 6) Failure + retry semantics

- [ ] On failed capture, Retry creates a new `EvidenceCaptureRun` with attempt incremented
- [ ] After successful retry: Case → `READY_FOR_REVIEW`, `Evidence.evidenceHash` updated to new bundle hash
- [ ] Old failed run + artifacts (if any) remain in DB for audit

## 7) Build/runtime hygiene

- [ ] No Redis/DB calls during Next static generation that crash `npm run build` (pages that query DB/Redis use `export const dynamic = "force-dynamic"`)
- [ ] Worker does not crash on navigation timeouts; writes best-effort artifacts, **stores artifact rows**, marks run FAILED with errorMessage e.g. "Navigation timeout (artifacts captured)", and does **not** set Case to READY_FOR_REVIEW (Case stays CAPTURING; UI shows "FAILED (partial evidence captured)" and still renders artifacts)

---

**Phase 3 entry gate:** Do not implement RAG/pgvector or semantic search until Phase 3. Say "phase 3" when ready to proceed.
