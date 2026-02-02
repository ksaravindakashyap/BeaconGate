# Phase 4C Verification — LLM Advisory Generation

Structured, auditable, non-binding LLM advisory on the case page.

## Deliverables

- **LLMRun** (append-only): provider, model, temperature, promptVersion, inputHash, advisoryText, advisoryJson, citationsJson, errorMessage, latencyMs.
- **Provider**: OpenAI if `OPENAI_API_KEY`; else mock (deterministic from rules + retrieval + evidence).
- **Advisory input**: case + evidence + ruleRuns + retrieval (last run); canonical hash via `lib/llm/hash.ts`.
- **Output schema**: Zod-validated `AdvisoryJson` (summary, claims, evasionSignals, policyConcerns, recommendedReviewerQuestions, recommendedNextActions, nonBindingNotice).
- **UI**: "LLM Advisory (non-binding)" card; Generate advisory (enabled when READY_FOR_REVIEW or IN_REVIEW); latest run with structured sections; "Non-binding. Reviewer remains responsible."
- **Decision**: submit-decision does **not** read or gate on LLMRun; decisions work with or without advisory.
- **Case file pins advisory:** `llm_advisory` includes `llmRunId` (LLMRun.id at decision time) plus full copied content so the case file is self-contained and auditable; it does not change if a new advisory is generated later.
- **Citation integrity:** Before storing LLMRun, every `policyConcerns[].policyCitations[].chunkId` is verified to exist in KnowledgeChunk. Invalid citations are stripped; `removedChunkIds` is recorded in citationsJson and a note is added to errorMessage.

## Verification checklist

- [ ] **DB migration:** `npx prisma migrate dev` applies `20260201140000_llm_run_phase4c` (LLMRun columns) without error.
- [ ] **Generate advisory (mock):** With no `OPENAI_API_KEY`, on a READY_FOR_REVIEW case click "Generate advisory"; a new LLMRun row is created with provider "mock", model "mock-v1", advisoryJson populated, inputHash set.
- [ ] **OpenAI path (optional):** With `OPENAI_API_KEY` set, Generate advisory uses OpenAI and returns valid AdvisoryJson (or errorMessage if schema validation fails).
- [ ] **Append-only:** Running Generate advisory twice creates two LLMRun rows; UI shows latest (most recent createdAt).
- [ ] **UI label:** Card title is "LLM Advisory (non-binding)"; footer note "Non-binding. Reviewer remains responsible."
- [ ] **Structured display:** Latest run shows model, promptVersion, createdAt, inputHash (shortened), summary; expandable sections for Claims, Evasion signals, Policy concerns (with chunk citations), Reviewer questions, Next actions.
- [ ] **Decision unaffected:** Submit a decision with no advisory; submit a decision after generating advisory. Outcome is never gated on advisory presence or content.
- [ ] **No invented citations:** All policyCitations in advisoryJson reference chunkIds that appear in the retrieval input (from RetrievalRun). Mock only cites provided policy matches.
- [ ] **Case file pins by ID:** Case file `llm_advisory` includes `llmRunId`; content is the full snapshot at decision time (auditable, does not change if new advisory generated later).
- [ ] **Citations server-verified:** Each policyCitations[].chunkId is checked against KnowledgeChunk; invalid citations are stripped and recorded in citationsJson.removedChunkIds with a note in errorMessage.

## Commands

```bash
npx prisma migrate dev   # apply Phase 4C migration
npm run build            # must pass
npm run dev              # terminal 1
npm run worker           # terminal 2 (if using queue)
```

## Manual tests

1. **Health claim case:** Submit a case with health-related ad text; complete capture; run retrieval (optional); open case page; click "Generate advisory". Confirm mock advisory includes claims and, if retrieval was run, policy concerns citing policy chunks.
2. **Redirect case:** Submit a case that triggers redirect capture (multi-hop); run retrieval; Generate advisory. Confirm evasion signal "multi-hop redirect" and policy/precedent citations when retrieval present.
3. **Run twice:** Generate advisory, note timestamp; Generate again. Confirm two LLMRun rows and UI shows the latest.
4. **Decision without advisory:** Submit a case, do not generate advisory; submit decision. Confirm decision is saved and case file has null llm_advisory.
5. **Decision with advisory:** Generate advisory then submit decision. Confirm case file llm_advisory contains llmRunId, label, advisoryText, model, provider, promptVersion, inputHash, advisoryJson, citationsJson.

## Limitations

- **Mock quality:** Mock is deterministic and keyword-based; claims extraction is simple; policy concerns only use top 3 retrieval matches. For production-quality advisory, use OpenAI (or another provider) with `OPENAI_API_KEY`.
- **OpenAI model:** Default model is `gpt-4.1-mini`; change in `lib/llm/provider.ts` if needed.
- **No streaming:** Advisory is generated in one shot; no streaming UI.
