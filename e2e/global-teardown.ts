import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const E2E_DIR = path.join(__dirname);
const MARKER_FILE = path.join(E2E_DIR, ".e2e-services-started");
const WORKER_PID_FILE = path.join(E2E_DIR, ".worker.pid");
const ENV_FILE = path.join(E2E_DIR, ".env.e2e");
const SIGTERM_WAIT_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const SHELL = process.platform === "win32" ? "cmd.exe" : "/bin/sh";

function exec(cmd: string): void {
  try {
    execSync(cmd, {
      stdio: "pipe",
      encoding: "utf8",
      shell: SHELL,
      cwd: path.resolve(E2E_DIR, ".."),
      env: process.env,
    });
  } catch {
    // ignore
  }
}

async function killWorker(pid: number): Promise<void> {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // process may already be dead
  }
  const deadline = Date.now() + SIGTERM_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch {
      return;
    }
    await sleep(200);
  }
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // ignore
  }
}

async function main(): Promise<void> {
  if (fs.existsSync(WORKER_PID_FILE)) {
    const pid = parseInt(fs.readFileSync(WORKER_PID_FILE, "utf8").trim(), 10);
    if (!Number.isNaN(pid)) {
      await killWorker(pid);
    }
    try {
      fs.unlinkSync(WORKER_PID_FILE);
    } catch {
      // ignore
    }
  }

  if (fs.existsSync(MARKER_FILE)) {
    exec("npm run db:down");
    try {
      fs.unlinkSync(MARKER_FILE);
    } catch {
      // ignore
    }
  }

  if (fs.existsSync(ENV_FILE)) {
    try {
      fs.unlinkSync(ENV_FILE);
    } catch {
      // ignore
    }
  }
}

export default main;
