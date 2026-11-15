import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.js"],
    pool: "forks",
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});