import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src"), "server-only": path.resolve(import.meta.dirname, "tests/server-only-stub.ts") } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://digitsnepal:digitsnepal_dev@localhost:5433/digitsnepal_test",
      BETTER_AUTH_SECRET: "test-secret-0123456789-0123456789-abcdef",
      AI_SERVICE_URL: process.env.TEST_AI_SERVICE_URL ?? "http://localhost:8100",
      AI_SERVICE_TOKEN: process.env.TEST_AI_SERVICE_TOKEN ?? "dev-ai-token",
      STORAGE_LOCAL_DIR: "./.storage-test",
      AUTH_RATE_LIMIT: "off",
    },
  },
});
