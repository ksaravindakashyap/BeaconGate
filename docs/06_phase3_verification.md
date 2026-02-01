# Phase 3 Verification Checklist

Policy + Precedent RAG assistant (pgvector, local embeddings, retrieval UI).

## Vector distance and normalization (verify once)

- **Cosine distance:** Retrieval uses pgvector `<=>` (cosine distance). SQL orders by `ke.embedding <=> query_embedding` (ASC = nearest first). Confirmed in `lib/rag/retrieve.ts`.
- **Score in UI:** Stored and displayed value is **similarity** = `(1 - cosine_distance)`, so higher = more similar. UI labels the badge as "similarity" so it is not confused with distance.
- **Embedding normalization:** `lib/rag/embeddings.ts` uses Xenova pipeline with `pooling: "mean"` and `normalize: true` (L2). Vectors are normalized before storage/query for consistent cosine distance.
- **KnowledgeEmbedding uniqueness:** Schema has `@@unique([chunkId, model])` so reindexing with a different model does not conflict (migration `20260201120000_knowledge_embedding_chunk_model_unique`).

## Phase 3 sign-off checklist (short)

- [ ] **rag:ingest:** `npm run rag:ingest` inserts docs > 0, chunks > 0, embeddings == chunks (after ingest, counts match).
- [ ] **Stable retrieval:** Same case/query yields same ordering across repeated runs (deterministic embeddings + ORDER BY distance).
- [ ] **Health claim case:** A case with health-related ad text reliably retrieves Health policy sections in Policy Matches.
- [ ] **Redirect/cloaking case:** A redirect- or cloaking-related case retrieves redirect-related policy + at least one precedent in Similar Cases.
- [ ] **RetrievalRun JSON:** Stored `results` include `chunkId`, `documentId`, and `snippet` (and score, documentTitle); UI displays snippet and "Open context" shows full chunk.
- [ ] **UI advisory:** Policy & Precedent card shows "Retrieval is advisory; reviewer remains responsible." Decisions are not gated on retrieval (submit-decision does not require retrieval).

## Infra

- [ ] pgvector enabled: `docker-compose up -d` uses `pgvector/pgvector:pg16` (or run migration that creates extension).
- [ ] Migration applied: `prisma migrate dev` applies RAG tables (KnowledgeDocument, KnowledgeChunk, KnowledgeEmbedding, RetrievalRun).
- [ ] Ingest script populates docs/chunks/embeddings: `npm run rag:ingest` runs without error; check document, chunk, and embedding counts.

## Retrieval

- [ ] Retrieval returns relevant policy sections for a health-claim test case: submit a case with health ad text + landing URL, run retrieval, confirm policy matches include health-related snippets.
- [ ] Retrieval returns at least one similar precedent for a seeded evasion case: use ad text/scenario similar to a precedent (e.g. redirect, hidden disclaimer), run retrieval, confirm similar cases appear.
- [ ] Retrieval run stored in DB and visible on case page: after "Run Retrieval", a RetrievalRun row exists; case page shows "Last retrieval" timestamp and embed model.

## UI

- [ ] Policy & Precedent Assistant card on `/case/[id]`: "Run Retrieval" button; after run, Policy Matches and Similar Cases with score badge and snippet; "Open context" expands full chunk.
- [ ] Footer note: "Retrieval is advisory; reviewer remains responsible."
- [ ] UI uses design tokens and Gowun Batang (no new fonts or token overrides).

## Safety and scope

- [ ] No user-provided document ingestion in Phase 3 UI; only ingest from local `/rag` folder via script.
- [ ] Embedding vectors not exposed in UI; only snippets and doc titles shown.
- [ ] No Phase 4: no automated decisions, no drift graphs expansion.

## Commands (end-to-end)

```bash
npm run db:up
npx prisma migrate dev
npx prisma db seed
npm run rag:ingest
npm run dev          # terminal 1
npm run worker       # terminal 2
```

## Manual tests

1. **Health claim → policy match:** Submit a case with ad text like "Consult your doctor for joint health" and category Health; after capture, run retrieval; confirm policy matches include health/disclaimer sections.
2. **Precedent similarity:** Submit a case similar to a precedent (e.g. redirect to different domain); run retrieval; confirm at least one similar precedent with matching outcome/rationale.
3. **Run retrieval twice:** Run retrieval, note timestamp; run again; confirm new RetrievalRun and updated "Last retrieval" line.
4. **Open context:** Expand "Open context" on a policy and a precedent; confirm full chunk content.
5. **Design:** Confirm case page (including RAG card) uses Gowun Batang and existing design tokens.
