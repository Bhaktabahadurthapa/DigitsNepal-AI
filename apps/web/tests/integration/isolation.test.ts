import { beforeAll, describe, expect, it } from "vitest";
import type { Viewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import { HttpError } from "@/server/errors";
import { canAccessDocument, canViewPublishedCourse, loadAccessibleDocument, loadEditableCourse } from "@/server/services/access";
import { attachDocument, createCourse } from "@/server/services/courses";
import { enroll, getPlayer, listCatalog, startQuiz, submitQuiz } from "@/server/services/learning";
import { listDocuments } from "@/server/services/library";
import { searchChunks } from "@/server/services/retrieval";
import { askTutor } from "@/server/services/tutor";
import { eq } from "drizzle-orm";
import { addMember, makeDoc, makeOrg, makePublishedCourse, makeUser, resetDb, vec } from "./helpers";

const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return "ok";
  } catch (e) {
    return e instanceof HttpError ? `${e.status}:${e.code}` : String(e);
  }
};

let eduA: Viewer, eduB: Viewer, learner: Viewer, outsider: Viewer, reviewer: Viewer, memberX: Viewer, minor: Viewer;
let orgX: { id: string }, orgY: { id: string };

beforeAll(async () => {
  await resetDb();
  eduA = await makeUser("Educator A", ["learner", "educator"]);
  eduB = await makeUser("Educator B", ["learner", "educator"]);
  learner = await makeUser("Learner");
  outsider = await makeUser("Outsider");
  reviewer = await makeUser("Reviewer");
  memberX = await makeUser("Member X");
  minor = await makeUser("Minor", ["learner"], { isMinor: true });
  orgX = await makeOrg("school-x", eduA);
  orgY = await makeOrg("ngo-y", eduB);
  await addMember(orgX.id, reviewer, "reviewer");
  await addMember(orgX.id, memberX, "member");
  await addMember(orgX.id, learner, "member");
});

describe("tenant isolation: courses", () => {
  it("1. another educator cannot open or edit my personal course", async () => {
    const c = await createCourse(eduA, { learningType: "course", title: "Private draft", audience: "", language: "en", level: "beginner", objectives: [], visibility: "public" });
    expect(await code(loadEditableCourse(eduA, c.id))).toBe("ok");
    expect(await code(loadEditableCourse(eduB, c.id))).toBe("404:course_not_found");
    expect(await code(loadEditableCourse(learner, c.id))).toBe("404:course_not_found");
  });

  it("2. an educator cannot create a course in an organization they do not belong to", async () => {
    expect(await code(createCourse(eduB, { learningType: "course", title: "Intrusion", audience: "", language: "en", level: "beginner", objectives: [], organizationId: orgX.id, visibility: "organization" }))).toBe("404:organization_not_found");
  });

  it("3. organization courses are only listed and enrollable for members", async () => {
    const { course } = await makePublishedCourse(eduA, { organizationId: orgX.id, visibility: "organization" });
    expect((await listCatalog(learner)).some((c) => c.id === course.id)).toBe(true);
    expect((await listCatalog(outsider)).some((c) => c.id === course.id)).toBe(false);
    expect((await listCatalog(null)).some((c) => c.id === course.id)).toBe(false);
    expect(await code(enroll(outsider, course.id))).toBe("404:course_not_found");
    expect(await code(enroll(learner, course.id))).toBe("ok");
  });

  it("4. suspending an organization revokes member access", async () => {
    const org = await makeOrg("temp-org", eduA);
    await addMember(org.id, outsider, "member");
    const { course } = await makePublishedCourse(eduA, { organizationId: org.id, visibility: "organization" });
    expect(await canViewPublishedCourse(outsider, course)).toBe(true);
    await db.update(schema.organizations).set({ status: "suspended" }).where(eq(schema.organizations.id, org.id));
    expect(await canViewPublishedCourse(outsider, course)).toBe(false);
  });

  it("5. private courses are not visible to the public", async () => {
    const { course } = await makePublishedCourse(eduA, { visibility: "private" });
    expect(await canViewPublishedCourse(learner, course)).toBe(false);
    expect(await canViewPublishedCourse(null, course)).toBe(false);
  });
});

describe("tenant isolation: documents and retrieval", () => {
  it("6. personal documents are invisible to other educators", async () => {
    const d = await makeDoc(eduA, null, [{ content: "secret A", hot: [1] }]);
    expect(await code(loadAccessibleDocument(eduB, d.id))).toBe("404:document_not_found");
    expect((await listDocuments(eduB)).some((x) => x.id === d.id)).toBe(false);
  });

  it("7. organization documents: reviewers can read, plain members and outsiders cannot", async () => {
    const d = await makeDoc(eduA, orgX.id, [{ content: "org X internal", hot: [2] }]);
    expect(await canAccessDocument(reviewer, d)).toBe(true);
    expect(await canAccessDocument(memberX, d)).toBe(false);
    expect(await canAccessDocument(eduB, d)).toBe(false);
    expect(await code(listDocuments(eduB, orgX.id))).toBe("404:organization_not_found");
  });

  it("8. a document cannot be attached to a course in another tenant", async () => {
    const orgDoc = await makeDoc(eduA, orgX.id, [{ content: "org doc", hot: [3] }]);
    const personal = await createCourse(eduA, { learningType: "course", title: "Personal", audience: "", language: "en", level: "beginner", objectives: [], visibility: "public" });
    expect(await code(attachDocument(eduA, personal.id, orgDoc.id))).toBe("400:document_tenant_mismatch");
    const bDoc = await makeDoc(eduB, null, [{ content: "B's doc", hot: [4] }]);
    expect(await code(attachDocument(eduA, personal.id, bDoc.id))).toBe("404:document_not_found");
  });

  it("9. vector search never returns chunks outside the allow-list", async () => {
    const mine = await makeDoc(eduA, null, [{ content: "mine", hot: [10, 11] }]);
    const theirs = await makeDoc(eduB, null, [{ content: "theirs, identical vector", hot: [10, 11] }]);
    const hits = await searchChunks([mine.id], vec([10, 11]), 10);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.documentId === mine.id)).toBe(true);
    expect(hits.some((h) => h.documentId === theirs.id)).toBe(false);
    expect(await searchChunks([], vec([10]), 10)).toEqual([]);
  });
});

describe("learner records", () => {
  it("10. a learner cannot submit someone else's quiz attempt", async () => {
    const { course, lesson, questions } = await makePublishedCourse(eduA);
    await enroll(learner, course.id);
    const attempt = await startQuiz(learner, course.id, lesson.id);
    await enroll(outsider, course.id);
    expect(await code(submitQuiz(outsider, attempt.id, { [questions[0].id]: 1 }))).toBe("404:attempt_not_found");
    const r = await submitQuiz(learner, attempt.id, { [questions[0].id]: 1, [questions[1].id]: 0 });
    expect(r.score).toBe(100);
    expect(r.passed).toBe(true);
  });

  it("11. the player is only available to enrolled learners", async () => {
    const { course } = await makePublishedCourse(eduA);
    expect(await getPlayer(outsider, course.id)).toBeNull();
  });

  it("12. the tutor requires enrollment and, for minors, recorded consent", async () => {
    const { course } = await makePublishedCourse(eduA);
    expect(await code(askTutor(outsider, { courseId: course.id, question: "What do solar panels do?", language: "en" }))).toBe("403:enroll_required");
    await enroll(minor, course.id);
    expect(await code(askTutor(minor, { courseId: course.id, question: "What do solar panels do?", language: "en" }))).toBe("403:consent_required");
  });

  it("13. the tutor is locked while a quiz attempt is open", async () => {
    const { course, lesson } = await makePublishedCourse(eduA);
    await enroll(learner, course.id);
    await startQuiz(learner, course.id, lesson.id);
    expect(await code(askTutor(learner, { courseId: course.id, question: "Q?", language: "en" }))).toBe("423:quiz_in_progress");
  });
});
