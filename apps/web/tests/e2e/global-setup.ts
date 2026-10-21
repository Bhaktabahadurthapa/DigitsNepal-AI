import { execSync } from "node:child_process";
import { E2E } from "./env";

export default async function globalSetup() {
  execSync("pnpm exec tsx tests/e2e/setup-db.ts", { stdio: "inherit", env: { ...process.env, ...E2E.env } });
}
