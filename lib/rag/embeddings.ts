/**
 * Phase 3: Local embeddings via Xenova/transformers (feature-extraction).
 * Model: Xenova/all-MiniLM-L6-v2 — 384 dimensions.
 * Deterministic given same model and text.
 */

export const EMBEDDING_DIMS = 384;
export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

let pipelineInstance: Awaited<ReturnType<typeof import("@xenova/transformers").pipeline>> | null = null;

async function getPipeline() {
  if (pipelineInstance) return pipelineInstance;
  const { pipeline } = await import("@xenova/transformers");
  pipelineInstance = await pipeline("feature-extraction", EMBEDDING_MODEL, {
    pooling: "mean",
    normalize: true,
  } as Record<string, unknown>);
  return pipelineInstance;
}

/**
 * Embed one or more texts. Returns array of 384-dim vectors.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const pipe = await getPipeline();
  const results: number[][] = [];
  for (const text of texts) {
    const truncated = text.slice(0, 512); // model has max length
    const out = await (pipe as (t: string, o?: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>)(
      truncated,
      { pooling: "mean", normalize: true }
    );
    const data = Array.from(out.data);
    results.push(data);
  }
  return results;
}

/**
 * Single-text convenience.
 */
export async function embedOne(text: string): Promise<number[]> {
  const [vec] = await embed([text]);
  return vec ?? [];
}
