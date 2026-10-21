import { expect, test } from "@playwright/test";
import { E2E } from "./env";
import { expectNoSeriousA11yViolations } from "./helpers";

test("15. mobile navigation and forms work", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.locator("#mobile-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await menu.click();
  await page.locator("#mobile-menu").getByRole("link", { name: "Academy" }).click();
  await expect(page).toHaveURL(/\/academy$/);
  await expect(page.locator("#mobile-menu")).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);

  await page.goto("/sign-in?next=/dashboard/learner");
  await page.getByLabel("Email").fill(E2E.users.learner.email);
  await page.getByLabel("Password").fill(E2E.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard/learner");
  await expectNoSeriousA11yViolations(page);

  // Player outline is a drawer on mobile.
  await page.goto("/academy/responsible-ai-and-digital-safety");
  await page.getByRole("button", { name: "Enroll for free" }).click();
  await page.waitForURL(/\/learn\//);
  await page.getByRole("button", { name: "Course outline" }).click();
  await expect(page.getByRole("dialog", { name: "Course outline" })).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: "Fair and accountable AI" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Fair and accountable AI" })).toBeVisible();
});
