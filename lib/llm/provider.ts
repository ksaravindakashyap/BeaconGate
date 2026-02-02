/**
 * Phase 4C: Advisory generation — OpenAI if key present, else mock.
 */

import type { AdvisoryInput } from "./advisoryInput";
import { hashAdvisoryInput } from "./hash";
import { generateMockAdvisory } from "./mock";
import { parseAdvisoryJson } from "./schema";
import { PROMPT_VERSION, SYSTEM_INSTRUCTION, buildUserMessage } from "./prompts";

export interface AdvisoryResult {
  provider: string;
  model: string;
  temperature: number;
  promptVersion: string;
  inputHash: string;
  advisoryText: string;
  advisoryJson: unknown;
  citationsJson: unknown;
  errorMessage: string | null;
  latencyMs: number | null;
}

const MOCK_MODEL = "mock-v1";
const OPENAI_MODEL = "gpt-4.1-mini";

export async function generateAdvisory(input: AdvisoryInput): Promise<AdvisoryResult> {
  const inputHash = hashAdvisoryInput(input);
  const start = Date.now();

  if (process.env.LLM_PROVIDER_FORCE === "mock") {
    return runMock(input, inputHash, start);
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await callOpenAI(input, inputHash, start);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        provider: "openai",
        model: OPENAI_MODEL,
        temperature: 0.2,
        promptVersion: PROMPT_VERSION,
        inputHash,
        advisoryText: "",
        advisoryJson: null,
        citationsJson: null,
        errorMessage,
        latencyMs: Date.now() - start,
      };
    }
  }

  return runMock(input, inputHash, start);
}

async function callOpenAI(input: AdvisoryInput, inputHash: string, start: number): Promise<AdvisoryResult> {
  const inputJson = JSON.stringify(input, null, 0);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: buildUserMessage(inputJson) },
      ],
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenAI ${res.status}: ${errBody}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error("OpenAI response missing content");

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error("OpenAI response was not valid JSON");
  }

  const validated = parseAdvisoryJson(parsed);
  const latencyMs = Date.now() - start;

  if (!validated.success) {
    return {
      provider: "openai",
      model: OPENAI_MODEL,
      temperature: 0.2,
      promptVersion: PROMPT_VERSION,
      inputHash,
      advisoryText: rawContent.slice(0, 2000),
      advisoryJson: null,
      citationsJson: null,
      errorMessage: `Schema validation failed: ${validated.error}`,
      latencyMs,
    };
  }

  const citationsJson = buildCitationsJson(input, validated.data);
  const advisoryText = validated.data.summary;

  return {
    provider: "openai",
    model: OPENAI_MODEL,
    temperature: 0.2,
    promptVersion: PROMPT_VERSION,
    inputHash,
    advisoryText,
    advisoryJson: validated.data,
    citationsJson,
    errorMessage: null,
    latencyMs,
  };
}

function runMock(input: AdvisoryInput, inputHash: string, start: number): AdvisoryResult {
  const advisoryJson = generateMockAdvisory(input);
  const latencyMs = Date.now() - start;
  const advisoryText = advisoryJson.summary;
  const citationsJson = buildCitationsJson(input, advisoryJson);
  return {
    provider: "mock",
    model: MOCK_MODEL,
    temperature: 0,
    promptVersion: PROMPT_VERSION,
    inputHash,
    advisoryText,
    advisoryJson,
    citationsJson,
    errorMessage: null,
    latencyMs,
  };
}

function buildCitationsJson(input: AdvisoryInput, advisory: { policyConcerns?: { policyCitations?: { chunkId: string; documentTitle: string }[] }[] }): unknown {
  const artifactIds = input.evidence.screenshotArtifactId ? [input.evidence.screenshotArtifactId] : [];
  const ruleRunIds = input.ruleRuns.map((r) => r.id);
  const chunkIds = advisory.policyConcerns?.flatMap((c) => c.policyCitations?.map((p) => p.chunkId) ?? []) ?? [];
  return {
    evidenceArtifactIds: artifactIds,
    ruleRunIds,
    chunkIds: [...new Set(chunkIds)],
  };
}
