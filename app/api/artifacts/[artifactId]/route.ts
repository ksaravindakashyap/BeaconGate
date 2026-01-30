import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import path from "path";
import fs from "fs";

const EVIDENCE_STORAGE_DIR = process.env.EVIDENCE_STORAGE_DIR || path.join(process.cwd(), "storage", "evidence");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await params;
  const artifact = await prisma.evidenceArtifact.findUnique({
    where: { id: artifactId },
  });
  if (!artifact || !artifact.path) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const pathSegments = artifact.path.split("/").filter(Boolean);
  const fullPath = path.join(EVIDENCE_STORAGE_DIR, ...pathSegments);
  const resolved = path.resolve(fullPath);
  const base = path.resolve(EVIDENCE_STORAGE_DIR);
  if (!resolved.startsWith(base) || resolved === base) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const stat = await fs.promises.stat(resolved);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 404 });
    }
    const buffer = await fs.promises.readFile(resolved);
    const contentType = artifact.mimeType || "application/octet-stream";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
