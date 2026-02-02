# Phase 6: Testing + CI + README verification

## Deterministic test/CI environment

To avoid accidental network or OpenAI usage in tests and CI, set:

- **`LLM_PROVIDER_FORCE=mock`** — Advisory generation always uses the mock provider (no OpenAI calls).
- **`EMBEDDING_PROVIDER=local`** — Embeddings always use local Xenova/transformers (no external embedding API).

These are set in:

- **CI** — `.github/workflows/ci.yml` sets both in `env` for all jobs (lint-typecheck-unit and e2e).
- **Local E2E** — `playwright.config.ts` passes them in `webServer.env` when Playwright starts the Next dev server, so local E2E runs are deterministic.
- **Manual E2E** — When running `npm run test:e2e` with an already-running dev server, set them in your shell (e.g. `LLM_PROVIDER_FORCE=mock EMBEDDING_PROVIDER=local npm run test:e2e`).

## DB-backed integration tests in CI

- **Lint-typecheck-unit job** — No database. Unit tests and integration tests that are skipped when `DATABASE_URL` is missing run here; DB-backed integration tests are skipped.
- **E2E job** — Postgres and Redis services are started. The job runs `npm run test:unit` **after** migrations, seed, and RAG ingest so that DB-backed integration tests (e.g. `tests/integration/rag-retrieval.test.ts`) run with a real DB before E2E.
- **Locally** — If `DATABASE_URL` is set, `npm run test:unit` runs DB-backed integration tests. If not set, they are skipped (e.g. `describe.skipIf(!hasDb)`).

## Stable E2E status hooks

- **`data-testid="case-status"`** — Case page: badge showing case status (NEW, CAPTURING, READY_FOR_REVIEW, IN_REVIEW, DECIDED).
- **`data-testid="capture-status"`** — Case page: badge showing capture run status (QUEUED, RUNNING, SUCCEEDED, FAILED).
- **`data-testid="queue-status-<caseId>"`** — Queue page: per-row case status badge (optional).

E2E specs use `expect.poll(() => page.getByTestId("case-status").textContent(), ...)` (and similarly for `capture-status`) instead of brittle free-text waits.

## Local E2E (self-contained)

Local E2E runs are **self-contained**. You only need Docker installed and running.

- Run: **`npm run test:e2e`**
- **Playwright globalSetup** (`e2e/global-setup.ts`) will:
  1. Verify Docker is available (fail with a clear error if not).
  2. Bring up Postgres and Redis via `docker-compose up -d` (this repo’s `docker-compose.yml` only).
  3. Wait for Postgres and Redis to be reachable (TCP, 60s timeout).
  4. Set env for the run: `DATABASE_URL`, `REDIS_URL`, `EVIDENCE_STORAGE_DIR`, `LLM_PROVIDER_FORCE=mock`, `EMBEDDING_PROVIDER=local`.
  5. Run `prisma migrate deploy`, `prisma generate`, `prisma db seed`, `rag:ingest`, `eval:seed`, `eval:run`.
  6. Start the worker as a child process (for capture-dependent tests).
  7. Write a marker file so **globalTeardown** only tears down this repo’s compose.

- **Playwright globalTeardown** (`e2e/global-teardown.ts`) will:
  1. Terminate the worker (SIGTERM, then SIGKILL if needed).
  2. Run `docker-compose down` **only if** the marker file exists (so unrelated containers are not touched).
  3. Remove the marker, worker PID file, and optional `.env.e2e` file.

No manual env file or DB/Redis/worker startup is required; the dev server is started by Playwright’s `webServer` with the same env set in globalSetup.

**CI:** When `CI=true`, globalSetup skips Docker and worker startup (CI already provides services and runs migrations/seed/worker); it only ensures env vars are set. Teardown does nothing destructive when the marker file is absent.
