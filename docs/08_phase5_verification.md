# Phase 5: Evaluation harness verification

This document describes how to seed and run the evaluation harness, expected metric ranges, and how to interpret failures.

---

## How to seed the eval suite

1. **Build the eval dataset** (optional; already committed at `eval/phase5_v1/eval_cases.json`):
   ```bash
   npm run eval:build-cases
   ```
   This regenerates `eval/phase5_v1/eval_cases.json` with deterministic stableIds from policy and precedent chunking. Only re-run if you change policy/precedent content or chunking.

2. **Seed the suite and cases into the DB**:
   ```bash
   npm run eval:seed
   ```
   This creates or reuses the `phase5_v1` EvalSuite and inserts all cases from `eval_cases.json` (30 cases). Existing cases for that suite are deleted and re-inserted.

**Prerequisites:** Database must be running and migrated; RAG corpus should be ingested so that `stableId`s in eval cases match chunks in the DB (run `npm run rag:reindex` first if you changed policy/precedents).

---

## How to run evaluation

1. **Run the evaluation** (no network required; uses mock advisory):
   ```bash
   npm run eval:run
   ```
   For each EvalCase this:
   - Runs deterministic rules via `runRulesOnInput()`
   - Runs retrieval via `runRetrievalQueryOnly()` (same logic as product retrieval)
   - Builds advisory input and calls `generateAdvisory()` (mock provider; `OPENAI_API_KEY` is unset during the run)
   - Computes per-case and aggregate metrics and stores an EvalRun

2. **Print latest run summary**:
   ```bash
   npm run eval:latest
   ```

3. **View in UI**: Open `/eval`. The page shows the latest EvalRun: suite name, createdAt, key metrics cards, and a table of cases. Use “Show only failing cases” to filter. Click a row to expand expected vs actual rule IDs and top retrieval snippets.

---

## Expected metric ranges (rough)

| Metric | Expected (seeded corpus + mock) |
|--------|----------------------------------|
| **Schema validity** | 100% (mock output always passes Zod) |
| **Non-binding compliance** | 100% (mock always emits required notice) |
| **Citation validity** | 100% (mock cites only retrieval results; eval uses stableChunkId as chunkId) |
| **Policy hit rate @K** | High (≥70%) — seeded cases expect at least one policy chunk in topK; depends on embedding and chunking |
| **Precedent hit rate @K** | High (≥70%) — same |
| **Rules precision/recall/F1** | Depends on rule config and case design; aim for high recall on expected triggers |
| **Signal hit rate** | High for cases with `mustContainSignals` (mock adds “multi-hop redirect”, “hidden text” when rules/evidence match) |

If schema validity or non-binding compliance drop below 100%, the mock or schema may have changed. If policy/precedent hit rates are low, tune chunking, retrieval topK, or embedding; or relax ground-truth expectations in eval cases.

---

## How to interpret failures

- **Rules FN (false negatives):** Expected rule was not triggered. Check rule config (regex, threshold, category scope) and case inputs (adText, htmlText, redirectChain).
- **Rules FP (false positives):** Rule triggered but not expected. Align ground truth with rule behavior or tighten rule config.
- **Policy hit = false:** None of the expected policy chunk stableIds appeared in topK. Improve query (adText/category/landingUrl/html), increase topK, or adjust expected chunks in ground truth.
- **Precedent hit = false:** Same for precedent chunks or documentIds.
- **Advisory signalsHit = false:** Required `mustContainSignals` (e.g. “multi-hop redirect”, “hidden text”) were not present in mock evasionSignals. Mock adds these from rule runs and redirect chain; check expectedAdvisory.mustContainSignals vs mock logic in `lib/llm/mock.ts`.
- **Invalid citations:** Advisory cited a chunkId not in retrieval results. With mock and eval using stableChunkId as chunkId, this should be 0; if not, check retrieval results shape or citation validation.

Tuning: adjust `prisma/rules-config.ts`, `rag/policies/`, `rag/precedents/`, or `eval/phase5_v1/eval_cases.json` (and re-run `eval:build-cases` if you change policy/precedent content), then re-seed and re-run eval.
