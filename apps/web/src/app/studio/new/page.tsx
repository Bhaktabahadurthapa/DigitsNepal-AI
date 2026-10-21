import { PageTitle } from "@/components/dashboard/shell";
import { CreateCourseWizard } from "@/components/studio/create-wizard";
import { requireRole } from "@/server/authz";
import { db, schema } from "@/server/db";
import { and, eq, inArray } from "drizzle-orm";

export const metadata = { title: "Create course" };

export default async function NewCoursePage() {
  const viewer = await requireRole("educator", "/studio/new");
  const orgs = await db
    .select({ id: schema.organizations.id, name: schema.organizations.name })
    .from(schema.organizationMembers)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.organizationMembers.organizationId))
    .where(and(eq(schema.organizationMembers.userId, viewer.id), eq(schema.organizations.status, "active"), inArray(schema.organizationMembers.role, ["owner", "admin", "member"])));
  return (
    <>
      <PageTitle title="Create a course" subtitle="Steps 1–2 of 8: choose what to build and describe it." />
      <CreateCourseWizard organizations={orgs} />
    </>
  );
}
