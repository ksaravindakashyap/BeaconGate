import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const EVIDENCE_CAPTURE_QUEUE_NAME = "evidence-capture";

let _connection: IORedis | null = null;
function getConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return _connection;
}

let _queue: Queue | null = null;
function getQueue(): Queue {
  if (!_queue) {
    _queue = new Queue(EVIDENCE_CAPTURE_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 100 },
      },
    });
  }
  return _queue;
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
  return getQueue().add("capture", data, {
    jobId: data.evidenceId,
  });
}

export function createWorker(
  processor: (job: Job<EvidenceCaptureJobData>) => Promise<void>
): Worker<EvidenceCaptureJobData> {
  return new Worker(EVIDENCE_CAPTURE_QUEUE_NAME, processor, {
    connection: getConnection(),
    concurrency: 2,
  });
}
