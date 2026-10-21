import path from "node:path";
import { expect, test } from "@playwright/test";
import { E2E } from "./env";
import { dbHelper, signIn } from "./helpers";

test("14. failed AI work shows a recoverable error", async ({ page }) => {
  await signIn(page, E2E.users.educator2.email, "/studio");
  const create = await page.request.post("/api/studio/courses", {
    headers: { origin: E2E.baseURL },
    data: { learningType: "lesson", title: "Recovery test", audience: "", language: "en", level: "beginner", objectives: [], visibility: "public" },
  });
  const { id } = await create.json();
  await page.goto(`/studio/${id}`);

  // A scanned (image-only) PDF fails extraction with an actionable message.
  await page.getByLabel("Choose a file").setInputFiles(path.join(__dirname, "../fixtures/scanned-no-text.pdf"));
  await page.getByText("I confirm I have the right").click();
  await page.getByRole("button", { name: "Upload and attach" }).click();
  await expect(page.getByText(/No readable text found/)).toBeVisible({ timeout: 60_000 });

  // A text document works, then a simulated provider outage fails the outline job.
  await page.getByLabel("Choose a file").setInputFiles(path.join(__dirname, "../fixtures/solar-energy-basics.txt"));
  await page.getByText("I confirm I have the right").click();
  await page.getByRole("button", { name: "Upload and attach" }).click();
  await expect(page.getByText("Ready").first()).toBeVisible({ timeout: 60_000 });
  // Remove the failed scan so sources are all ready.
  await page.request.delete(`/api/studio/courses/${id}/sources`, {
    headers: { origin: E2E.baseURL },
    data: { documentId: (await (await page.request.get(`/api/studio/courses/${id}/status`)).json()).sources.find((s: { status: string }) => s.status === "failed").id },
  });
  dbHelper("fail-outline", id);
  await page.reload();
  await expect(page.getByText("The last AI job failed")).toBeVisible();
  await expect(page.getByText(/simulated outage/)).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("heading", { name: "Step 5 · Review and approve the outline" })).toBeVisible({ timeout: 60_000 });
});
