import { defineConfig, devices } from "@playwright/test";
import { E2E } from "./tests/e2e/env";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: E2E.baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: [
    {
      command: "uv run uvicorn app.main:app --port 8101",
      cwd: "../../services/ai",
      url: `${E2E.aiURL}/health`,
      env: { AI_SERVICE_TOKEN: E2E.env.AI_SERVICE_TOKEN, AI_PROVIDER: "extractive", AI_EMBED_PROVIDER: "extractive" },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      // Production build (separate distDir) so it never fights a local `next dev` over shared files.
      command: "pnpm exec next build && pnpm exec next start --port 3100",
      url: `${E2E.baseURL}/api/health`,
      env: { ...E2E.env, DISABLE_HTTPS_HEADERS: "1" },
      reuseExistingServer: false,
      timeout: 300_000,
    },
    {
      // Background job worker; Playwright waits for its port-less start via the log line.
      command: "pnpm exec tsx src/worker.ts",
      env: E2E.env,
      wait: { stdout: /worker\.started/ },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
