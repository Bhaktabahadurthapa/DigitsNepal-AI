import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./helpers";

test("1. visitor opens the homepage and every module card links to a real route", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Learn AI. Build Intelligent Agents. Transform Nepal." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start learning/ })).toHaveAttribute("href", "/academy");
  const hrefs = await page.locator('section[aria-labelledby="modules-title"] a').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual(["/academy", "/studio", "/tutor", "/agents", "/organizations"]);
  for (const h of ["/academy", "/studio", "/agents", "/organizations", "/about", "/privacy", "/terms", "/accessibility", "/community", "/contact"]) {
    expect((await request.get(h)).status(), h).toBe(200);
  }
  await expect(page.getByText("Demonstration: no AI request is made")).toBeVisible();
  await expect(page.getByText("Python for AI")).toBeVisible();
  await expect(page.getByText("Coming soon").first()).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("language switch shows the Nepali interface", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Switch to|नेपालीमा/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("एआई सिकौँ। बौद्धिक एजेन्ट बनाऔँ। नेपाल रूपान्तरण गरौँ।");
  await expect(page.locator("html")).toHaveAttribute("lang", "ne");
});

test("academy, course page and sign-in pages are accessible", async ({ page }) => {
  for (const path of ["/academy", "/academy/introduction-to-artificial-intelligence", "/sign-in", "/sign-up", "/agents"]) {
    await page.goto(path);
    await expectNoSeriousA11yViolations(page);
  }
});

test("security headers are present", async ({ request }) => {
  const r = await request.get("/");
  const h = r.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-powered-by"]).toBeUndefined();
});
