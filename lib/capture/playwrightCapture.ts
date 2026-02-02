import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { validateUrlForCapture } from "./ssrfGuards";
import { sha256File, sha256Bundle } from "./hash";

const VIEWPORT = { width: 1280, height: 720 };
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const GOTO_TIMEOUT = 20000;

export interface RedirectStep {
  url: string;
  status?: number;
  location?: string;
}

export interface NetworkSummary {
  totalRequests: number;
  byType: Record<string, number>;
  topDomains: string[];
}

export interface CaptureResult {
  success: true;
  finalUrl: string;
  screenshotPath: string;
  htmlPath: string;
  redirectChainPath: string;
  networkSummaryPath: string;
  artifactHashes: { type: string; sha256: string; byteSize: number; pathBasename: string }[];
  bundleHash: string;
  capturedAt: string;
  viewport: typeof VIEWPORT;
  userAgent: string;
  /** When true, navigation timed out but best-effort artifacts were captured; worker should mark run FAILED and keep Case CAPTURING. */
  timedOut?: true;
  /** Set when timedOut; used for CaptureRun.errorMessage. */
  error?: string;
}

interface CaptureError {
  success: false;
  error: string;
}

export type CaptureOutcome = CaptureResult | CaptureError;

export interface CaptureOptions {
  evidenceId: string;
  captureRunId: string;
  landingUrl: string;
  storageDir: string;
}

export async function runPlaywrightCapture(options: CaptureOptions): Promise<CaptureOutcome> {
  const { evidenceId, captureRunId, landingUrl, storageDir } = options;

  const ssrf = await validateUrlForCapture(landingUrl);
  if (!ssrf.ok) {
    return { success: false, error: ssrf.error ?? "SSRF validation failed" };
  }

  const runDir = path.join(storageDir, evidenceId, captureRunId);
  await mkdir(runDir, { recursive: true });

  const redirectChain: RedirectStep[] = [];
  const requests: { url: string; resourceType: string }[] = [];
  let finalUrl = landingUrl;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      userAgent: USER_AGENT,
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    page.on("request", (req) => {
      requests.push({ url: req.url(), resourceType: req.resourceType() });
    });

    let mainResponse: { status: number } | null = null;
    let timedOut = false;
    page.on("response", (response) => {
      const req = response.request();
      if (req.resourceType() === "document" && req.url() === landingUrl) {
        mainResponse = { status: Number(response.status()) };
      }
    });

    await page.goto(landingUrl, {
      waitUntil: "networkidle",
      timeout: GOTO_TIMEOUT,
    }).catch(() => {
      timedOut = true;
      // best-effort: continue to capture what we have
    });

    finalUrl = page.url();
    const initialStatus: number | undefined =
      mainResponse === null ? undefined : (mainResponse as { status: number }).status;
    redirectChain.push({ url: landingUrl, status: initialStatus });
    if (finalUrl !== landingUrl) {
      redirectChain.push({ url: finalUrl, status: 200 });
    }

    const screenshotPath = path.join(runDir, "screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const html = await page.content();
    const htmlPath = path.join(runDir, "page.html");
    await writeFile(htmlPath, html, "utf8");

    const redirectChainPath = path.join(runDir, "redirects.json");
    await writeFile(redirectChainPath, JSON.stringify(redirectChain, null, 2), "utf8");

    const byType: Record<string, number> = {};
    const domainCount: Record<string, number> = {};
    for (const r of requests) {
      byType[r.resourceType] = (byType[r.resourceType] ?? 0) + 1;
      try {
        const d = new URL(r.url).hostname;
        domainCount[d] = (domainCount[d] ?? 0) + 1;
      } catch {
        // ignore
      }
    }
    const topDomains = Object.entries(domainCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([d]) => d);
    const networkSummary: NetworkSummary = {
      totalRequests: requests.length,
      byType,
      topDomains,
    };
    const networkSummaryPath = path.join(runDir, "network_summary.json");
    await writeFile(networkSummaryPath, JSON.stringify(networkSummary, null, 2), "utf8");

    const { stat } = await import("fs/promises");
    const screenshotHash = await sha256File(screenshotPath);
    const htmlHash = await sha256File(htmlPath);
    const redirectsHash = await sha256File(redirectChainPath);
    const networkHash = await sha256File(networkSummaryPath);

    const screenshotSize = (await stat(screenshotPath)).size;
    const htmlSize = (await stat(htmlPath)).size;
    const redirectsSize = (await stat(redirectChainPath)).size;
    const networkSize = (await stat(networkSummaryPath)).size;

    const artifactHashes = [
      { type: "SCREENSHOT", sha256: screenshotHash, byteSize: screenshotSize, pathBasename: "screenshot.png" },
      { type: "HTML_SNAPSHOT", sha256: htmlHash, byteSize: htmlSize, pathBasename: "page.html" },
      { type: "REDIRECT_CHAIN", sha256: redirectsHash, byteSize: redirectsSize, pathBasename: "redirects.json" },
      { type: "NETWORK_SUMMARY", sha256: networkHash, byteSize: networkSize, pathBasename: "network_summary.json" },
    ];

    const capturedAt = new Date().toISOString();
    const bundlePayload = {
      landingUrl,
      finalUrl,
      artifacts: artifactHashes.map(({ type, sha256, byteSize, pathBasename }) => ({ type, sha256, byteSize, pathBasename })),
      capturedAt,
      viewport: VIEWPORT,
      userAgent: USER_AGENT,
    };
    const bundleHash = sha256Bundle(bundlePayload);

    return {
      success: true,
      finalUrl,
      screenshotPath,
      htmlPath,
      redirectChainPath,
      networkSummaryPath,
      artifactHashes,
      bundleHash,
      capturedAt,
      viewport: VIEWPORT,
      userAgent: USER_AGENT,
      ...(timedOut ? { timedOut: true as const, error: "Navigation timeout" } : {}),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  } finally {
    await browser.close();
  }
}
