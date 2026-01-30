import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const EVIDENCE_CAPTURE_QUEUE_NAME = "evidence-capture";

export const evidenceCaptureQueue = new Queue(EVIDENCE_CAPTURE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
  },
});

export function getConnection(): IORedis {
  return connection;
}

export type EvidenceCaptureJobData = {
  caseId: string;
  evidenceId: string;
  landingUrl: string;
  adText: string;
  category: string;
  attempt?: number;
};

export async function addEvidenceCaptureJob(data: EvidenceCaptureJobData) {
  return evidenceCaptureQueue.add("capture", data, {
    jobId: data.evidenceId,
  });
}

export function createWorker(
  processor: (job: Job<EvidenceCaptureJobData>) => Promise<void>
): Worker<EvidenceCaptureJobData> {
  return new Worker(
    EVIDENCE_CAPTURE_QUEUE_NAME,
    processor,
    { connection, concurrency: 2 }
  );
}
