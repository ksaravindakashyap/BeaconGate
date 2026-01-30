# BeaconGate

Ads review queue with evidence capture, policy rules, and a policy/precedent retrieval assistant. Reviewers get a case queue, captured landing pages, rule hits, and optional retrieval for policy and similar cases. Decisions are recorded and case files are generated for audit.

## Setup

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://beacongate:beacongate_dev@localhost:5432/beacongate"
REDIS_URL="redis://localhost:6379"
EVIDENCE_STORAGE_DIR="./storage/evidence"
```

Start Postgres and Redis:

```bash
docker-compose up -d
```

Install dependencies, run migrations, and seed the database:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

Populate the policy and precedent index for retrieval:

```bash
npm run rag:ingest
```

Run the app and the evidence capture worker (separate terminals):

```bash
npm run dev
```

```bash
npm run worker
```

Open http://localhost:3000.

## What it does

- **Submit** – Ad text, category, and landing URL. The worker captures the page (screenshot, HTML, redirects, network summary), runs policy rules, and updates risk. Case moves to the queue.
- **Queue** – Filter and sort by status and risk. Open a case to review evidence, rule hits, retrieval results, and (optionally) an LLM advisory. Submit a decision (Approve / Reject / Needs more info). A case file is generated.
- **Retrieval** – On a case page, "Run Retrieval" runs a vector search over ingested policy docs and precedent cases. Results are advisory only; the reviewer is responsible for the decision.

## Tech

- Next.js (App Router), TypeScript, Tailwind, Prisma, Postgres (with pgvector for retrieval), Redis, BullMQ, Playwright for capture. Local embeddings via Xenova/transformers; no OpenAI required.
