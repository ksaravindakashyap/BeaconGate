import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as net from "net";
import * as path from "path";

const E2E_DIR = path.join(__dirname);
const MARKER_FILE = path.join(E2E_DIR, ".e2e-services-started");
const WORKER_PID_FILE = path.join(E2E_DIR, ".worker.pid");
const ENV_FILE = path.join(E2E_DIR, ".env.e2e");
const READINESS_TIMEOUT_MS = 60_000;
const READINESS_POLL_MS = 500;

function isCI(): boolean {
  return process.env.CI === "true";
}

const SHELL = process.platform === "win32" ? "cmd.exe" : "/bin/sh";

function exec(cmd: string, env?: NodeJS.ProcessEnv): void {
  execSync(cmd, {
    stdio: "inherit",
    shell: SHELL,
    cwd: path.resolve(E2E_DIR, ".."),
    env: { ...process.env, ...env },
  });
}

function waitForTcp(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + READINESS_TIMEOUT_MS;
    const tryConnect = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Timeout waiting for ${host}:${port}`));
        return;
      }
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.on("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        setTimeout(tryConnect, READINESS_POLL_MS);
      });
      socket.on("timeout", () => {
        socket.destroy();
        setTimeout(tryConnect, READINESS_POLL_MS);
      });
      socket.connect(port, host);
    };
    tryConnect();
  });
}

function ensureEnv(): void {
  const DATABASE_URL =
    process.env.DATABASE_URL ??
    "postgresql://beacongate:beacongate_dev@localhost:5432/beacongate";
  const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
  const EVIDENCE_STORAGE_DIR =
    process.env.EVIDENCE_STORAGE_DIR ?? "./storage/evidence";
  const envVars = {
    DATABASE_URL,
    REDIS_URL,
    EVIDENCE_STORAGE_DIR,
    LLM_PROVIDER_FORCE: "mock",
    EMBEDDING_PROVIDER: "local",
  };
  Object.assign(process.env, envVars);
  const envContent = Object.entries(envVars)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  fs.writeFileSync(ENV_FILE, envContent, "utf8");
}

async function main(): Promise<void> {
  if (isCI()) {
    ensureEnv();
    return;
  }

  try {
    exec("docker --version");
  } catch {
    throw new Error(
      "Docker is not available. Install Docker and ensure 'docker' is on PATH to run local E2E."
    );
  }
  try {
    execSync("docker info", {
      stdio: "pipe",
      encoding: "utf8",
      shell: SHELL,
      cwd: path.resolve(E2E_DIR, ".."),
    });
  } catch {
    throw new Error(
      "Docker daemon is not running. Start Docker Desktop (or the Docker daemon) and ensure it is reachable, then run local E2E again."
    );
  }

  exec("npm run db:up");

  const dbUrl = process.env.DATABASE_URL ?? "postgresql://beacongate:beacongate_dev@localhost:5432/beacongate";
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  let pgHost = "localhost";
  let pgPort = 5432;
  try {
    const u = new URL(dbUrl.replace(/^postgresql:/, "postgres:"));
    pgHost = u.hostname;
    pgPort = parseInt(u.port || "5432", 10);
  } catch {
    // use defaults
  }
  let redisHost = "localhost";
  let redisPort = 6379;
  try {
    const u = new URL(redisUrl);
    redisHost = u.hostname;
    redisPort = parseInt(u.port || "6379", 10);
  } catch {
    // use defaults
  }

  await Promise.all([
    waitForTcp(pgHost, pgPort),
    waitForTcp(redisHost, redisPort),
  ]);

  ensureEnv();

  exec("npx prisma migrate deploy");
  exec("npx prisma generate");
  exec("npx prisma db seed");
  exec("npm run rag:ingest");
  exec("npm run eval:seed");
  exec("npm run eval:run");

  const worker = spawn("npm", ["run", "worker"], {
    stdio: "pipe",
    shell: true,
    cwd: path.resolve(E2E_DIR, ".."),
    env: process.env,
  });
  worker.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`Worker exited with code ${code}`);
    }
    if (signal) {
      console.error(`Worker killed with signal ${signal}`);
    }
  });
  worker.unref();
  const pid = worker.pid;
  if (pid == null) {
    throw new Error("Failed to start worker: no PID");
  }
  fs.writeFileSync(WORKER_PID_FILE, String(pid), "utf8");

  fs.writeFileSync(MARKER_FILE, "1", "utf8");
}

export default main;
