import { describe, it, expect } from "vitest";
import { isBlockedHostname, BLOCKED_HOSTNAMES } from "@/lib/capture/ssrfGuards";

describe("isBlockedHostname", () => {
  it("returns true for localhost", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("LOCALHOST")).toBe(true);
  });

  it("returns true for 127.0.0.1 and 169.254.169.254", () => {
    expect(isBlockedHostname("127.0.0.1")).toBe(true);
    expect(isBlockedHostname("169.254.169.254")).toBe(true);
  });

  it("returns false for public hostname", () => {
    expect(isBlockedHostname("example.com")).toBe(false);
    expect(isBlockedHostname("api.openai.com")).toBe(false);
  });
});

describe("BLOCKED_HOSTNAMES", () => {
  it("contains expected entries", () => {
    expect(BLOCKED_HOSTNAMES.has("localhost")).toBe(true);
    expect(BLOCKED_HOSTNAMES.has("127.0.0.1")).toBe(true);
    expect(BLOCKED_HOSTNAMES.has("169.254.169.254")).toBe(true);
  });
});
