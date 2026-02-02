import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx", "tests/integration/**/*.test.ts"],
    exclude: ["node_modules", ".next", "e2e"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 60000,
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd()) },
  },
});
