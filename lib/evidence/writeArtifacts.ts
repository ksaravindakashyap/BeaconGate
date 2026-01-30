import type { ArtifactType } from "@prisma/client";
import type { CaptureResult } from "../capture/playwrightCapture";

export interface ArtifactRecord {
  type: ArtifactType;
  path: string;
  sha256: string;
  byteSize: number;
  mimeType: string | null;
}

export function getArtifactRecordsFromCapture(
  evidenceId: string,
  captureRunId: string,
  result: CaptureResult
): ArtifactRecord[] {
  const basePath = `${evidenceId}/${captureRunId}`;
  const mime: Record<string, string> = {
    "screenshot.png": "image/png",
    "page.html": "text/html",
    "redirects.json": "application/json",
    "network_summary.json": "application/json",
  };
  return result.artifactHashes.map((a) => ({
    type: a.type as ArtifactType,
    path: `${basePath}/${a.pathBasename}`,
    sha256: a.sha256,
    byteSize: a.byteSize,
    mimeType: mime[a.pathBasename] ?? null,
  }));
}
