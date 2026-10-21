import { expect, test } from "@playwright/test";
import { E2E } from "./env";
import { signIn } from "./helpers";

test("13. users cannot reach another educator's workspace or data", async ({ page, browser }) => {
  // Educator 1 creates a private draft.
  await signIn(page, E2E.users.educator.email, "/studio/new");
  const create = await page.request.post("/api/studio/courses", {
    headers: { origin: E2E.baseURL },
    data: { learningType: "lesson", title: "Educator one private draft", audience: "", language: "en", level: "beginner", objectives: [], visibility: "private" },
  });
  expect(create.status()).toBe(201);
  const { id } = await create.json();

  // Educator 2 cannot see it via page or API.
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await signIn(p2, E2E.users.educator2.email, "/studio");
  const res = await p2.goto(`/studio/${id}`);
  expect(res?.status()).toBe(404);
  expect((await p2.request.get(`/api/studio/courses/${id}`)).status()).toBe(404);
  expect((await p2.request.post(`/api/studio/courses/${id}/publish`, { headers: { origin: E2E.baseURL }, data: { confirm: true } })).status()).toBe(404);
  await ctx2.close();

  // A learner cannot use educator or admin APIs.
  const ctx3 = await browser.newContext();
  const p3 = await ctx3.newPage();
  await signIn(p3, E2E.users.learner.email);
  expect((await p3.request.get(`/api/studio/courses/${id}`)).status()).toBe(403);
  expect((await p3.request.put("/api/admin/settings", { headers: { origin: E2E.baseURL }, data: {} })).status()).toBe(403);
  await p3.goto("/admin");
  await expect(p3).toHaveURL(/\/dashboard\/learner/);
  await ctx3.close();
});

test("unauthenticated visitors are sent to sign-in and cannot call APIs", async ({ page, request }) => {
  await page.goto("/dashboard/learner");
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  expect((await request.post("/api/tutor", { headers: { origin: E2E.baseURL }, data: {} })).status()).toBe(401);
});

test("cookie-authenticated mutations without a same-origin header are rejected (CSRF)", async ({ page }) => {
  await signIn(page, E2E.users.learner.email);
  const r = await page.request.patch("/api/me/profile", { headers: { origin: "https://evil.example" }, data: { bio: "x" } });
  expect(r.status()).toBe(403);
});

test("administration requires two-factor authentication even for admins", async ({ page }) => {
  await signIn(page, E2E.users.admin.email);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/settings\/security\?mfa=required/);
  await expect(page.getByText("Two-factor authentication required")).toBeVisible();
  expect((await page.request.put("/api/admin/settings", { headers: { origin: E2E.baseURL }, data: {} })).status()).toBe(403);
});
