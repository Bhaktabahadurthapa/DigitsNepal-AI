import { notFound } from "next/navigation";
import { StudioWorkspace } from "@/components/studio/workspace";
import { requireRole } from "@/server/authz";
import { HttpError } from "@/server/errors";
import { renderLessonHtml } from "@/server/markdown";
import { getStudioCourse } from "@/server/services/courses";
import { listDocuments } from "@/server/services/library";

export const metadata = { title: "Studio", robots: { index: false } };

export default async function StudioCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const viewer = await requireRole("educator", `/studio/${courseId}`);
  let data;
  try {
    data = await getStudioCourse(viewer, courseId);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const library = await listDocuments(viewer, data.course.organizationId);
  const previews = Object.fromEntries(
    data.modules.flatMap((m) =>
      m.lessons.flatMap((l) => [
        [l.id, renderLessonHtml(l.contentMd, l.citations.map((c) => c.n), `ref-${l.id}`)],
        ...(l.proposedRevision ? [[`proposal:${l.id}`, renderLessonHtml(l.proposedRevision.contentMd, l.proposedRevision.citations.map((c) => c.n), `pref-${l.id}`)]] : []),
      ]),
    ),
  );
  return (
    <StudioWorkspace
      course={{
        id: data.course.id,
        slug: data.course.slug,
        title: data.course.title,
        language: data.course.language,
        status: data.course.status,
        learningType: data.course.learningType,
        outline: data.course.outline,
        outlineStatus: data.course.outlineStatus,
        publishedVersionId: data.course.publishedVersionId,
        publishedAt: data.course.publishedAt?.toISOString() ?? null,
        updatedAt: data.course.updatedAt.toISOString(),
      }}
      modules={data.modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          objectives: l.objectives,
          contentMd: l.contentMd,
          citations: l.citations,
          estimatedMinutes: l.estimatedMinutes,
          status: l.status,
          origin: l.origin,
          proposedRevision: l.proposedRevision ? { instruction: l.proposedRevision.instruction } : null,
          questions: l.assessment?.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation })) ?? [],
        })),
      }))}
      previews={previews}
      sources={data.sources}
      library={library.map((d) => ({ id: d.id, filename: d.filename, status: d.status }))}
      job={data.jobs[0] ? { id: data.jobs[0].id, type: data.jobs[0].type, status: data.jobs[0].status, progress: data.jobs[0].progress, message: data.jobs[0].message, error: data.jobs[0].error } : null}
      versions={data.versions.map((v) => ({ version: v.version, publishedAt: v.publishedAt.toISOString(), changelog: v.changelog }))}
    />
  );
}
