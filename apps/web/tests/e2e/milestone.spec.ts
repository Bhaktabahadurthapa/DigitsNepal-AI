import path from "node:path";
import { expect, test } from "@playwright/test";
import { E2E } from "./env";
import { dbHelper, expectNoSeriousA11yViolations, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

const learnerEmail = `new-learner-${Date.now()}@e2e.test`;
const COURSE_TITLE = "Solar Energy for Schools E2E";
let courseSlug = "";

test("2. a learner signs up", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("Sita Learner");
  await page.getByLabel("Email").fill(learnerEmail);
  await page.getByLabel("Password").fill(E2E.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard/learner");
  await expect(page.getByRole("heading", { name: /Welcome back, Sita/ })).toBeVisible();
});

test("3. a learner enrolls in an Academy course", async ({ page }) => {
  await signIn(page, learnerEmail);
  await page.goto("/academy/introduction-to-artificial-intelligence");
  await page.getByRole("button", { name: "Enroll for free" }).click();
  await page.waitForURL(/\/learn\//);
  await expect(page.getByRole("heading", { level: 1, name: "AI in plain language" })).toBeVisible();
});

test("4–8. educator uploads a PDF, reviews and approves the outline, edits and publishes", async ({ page }) => {
  await signIn(page, E2E.users.educator.email, "/studio/new");
  await page.goto("/studio/new");
  await page.getByText("Full course").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Title").fill(COURSE_TITLE);
  await page.getByLabel("Audience").fill("Grade 8 students");
  await page.getByLabel("Learning objectives (one per line)").fill("Explain how solar panels work\nDescribe solar safety rules");
  await page.getByRole("button", { name: "Create and add sources" }).click();
  await page.waitForURL(/\/studio\/[0-9a-f-]{36}$/);

  // 4. upload a permitted document
  await page.getByLabel("Choose a file").setInputFiles(path.join(__dirname, "../fixtures/solar-energy-basics.pdf"));
  await page.getByText("I confirm I have the right").click();
  await page.getByRole("button", { name: "Upload and attach" }).click();
  await expect(page.getByText(/Ready · 1 pages/)).toBeVisible({ timeout: 60_000 });

  // 5. AI proposes an outline
  await page.getByRole("button", { name: "Propose outline" }).click();
  await expect(page.getByRole("heading", { name: "Step 5 · Review and approve the outline" })).toBeVisible({ timeout: 60_000 });
  await expectNoSeriousA11yViolations(page);

  // 6. educator edits and approves
  await page.getByLabel("Module 1 title").fill("Module 1: How solar power works");
  await page.getByRole("button", { name: "Approve and generate lessons" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Approve and generate" }).click();

  // 7. AI generates draft lessons
  await expect(page.getByRole("complementary", { name: "AI course assistant" })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText("AI draft").first()).toBeVisible();

  // 8. educator edits a lesson and publishes
  await page.getByLabel("Lesson title").fill("What is solar energy?");
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(page.getByText("Lesson saved to draft")).toBeVisible();
  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(page.locator(".prose-lesson a.cite").first()).toBeVisible();
  await page.getByRole("button", { name: "Publish version 1" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Version 1 published")).toBeVisible();
  courseSlug = (await page.getByRole("link", { name: "View as learner" }).getAttribute("href"))!.split("/").pop()!;
  expect(courseSlug).toContain("solar-energy-for-schools-e2e");
});

test("9–12. learner completes a lesson and quiz, progress is saved, tutor answers with a real source", async ({ page }) => {
  await signIn(page, learnerEmail);
  await page.goto(`/academy/${courseSlug}`);
  await page.getByRole("button", { name: "Enroll for free" }).click();
  await page.waitForURL(/\/learn\//);
  await expect(page.getByRole("heading", { level: 1, name: "What is solar energy?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "References" })).toBeVisible();
  await expect(page.getByText(/solar-energy-basics\.pdf, p\. 1/).first()).toBeVisible();

  // 9. complete the lesson (button unlocks once the end is in view)
  const complete = page.getByRole("button", { name: "Mark lesson complete" });
  await complete.scrollIntoViewIfNeeded();
  await expect(complete).toBeEnabled();
  await complete.click();
  await expect(page.getByRole("status").filter({ hasText: "Completed" })).toBeVisible();

  // 10. quiz with the correct answers (read from the published version)
  const answers: number[] = JSON.parse(dbHelper("answers", courseSlug));
  expect(answers.length).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Start quiz" }).click();
  const groups = page.locator("fieldset");
  for (let i = 0; i < answers.length; i++) await groups.nth(i).getByRole("radio").nth(answers[i]).check();
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText("Your score: 100%")).toBeVisible();

  // 12. tutor answers with a citation to the uploaded PDF
  const tutor = page.getByRole("complementary", { name: "AI Tutor" });
  await tutor.getByLabel("Ask about this lesson…").fill("What does the charge controller do?");
  await tutor.getByRole("button", { name: "Send" }).click();
  await expect(tutor.getByText(/charge controller protects the battery/i).first()).toBeVisible();
  await expect(tutor.getByText(/\[1\] solar-energy-basics\.pdf/)).toBeVisible();
  await tutor.getByLabel("Ask about this lesson…").fill("Who won the football world cup in 2022?");
  await tutor.getByRole("button", { name: "Send" }).click();
  await expect(tutor.getByText("Not found in course materials")).toBeVisible();
  await expectNoSeriousA11yViolations(page);

  // 11. progress survives a reload and shows on the dashboard
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Course outline" }).first().getByLabel("Completed").first()).toBeVisible();
  await page.goto("/dashboard/learner/progress");
  await expect(page.getByText(COURSE_TITLE)).toBeVisible();
  await page.goto("/dashboard/learner/quizzes");
  await expect(page.getByText("100%")).toBeVisible();
});
