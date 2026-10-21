/**
 * Central authorization and tenant-isolation rules. Every data-access function must go through
 * these predicates; nothing else decides who can see or change a course, document or organization.
 */
import { and, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import type { Viewer } from "@/server/authz";
import { HttpError } from "@/server/errors";
import { db, schema } from "@/server/db";

type Course = typeof schema.courses.$inferSelect;
type Doc = typeof schema.sourceDocuments.$inferSelect;
export type OrgRole = (typeof schema.orgMemberRoleEnum.enumValues)[number];

export const isAdmin = (v: Viewer | null) => !!v?.roles.includes("admin");
export const isEducator = (v: Viewer | null) => !!v && (v.roles.includes("educator") || v.roles.includes("admin"));

export async function orgRole(userId: string, organizationId: string): Promise<OrgRole | null> {
  const [m] = await db
    .select({ role: schema.organizationMembers.role })
    .from(schema.organizationMembers)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.organizationMembers.organizationId))
    .where(
      and(
        eq(schema.organizationMembers.userId, userId),
        eq(schema.organizationMembers.organizationId, organizationId),
        eq(schema.organizations.status, "active"),
      ),
    );
  return m?.role ?? null;
}

export async function viewerOrgIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: schema.organizationMembers.organizationId })
    .from(schema.organizationMembers)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.organizationMembers.organizationId))
    .where(and(eq(schema.organizationMembers.userId, userId), eq(schema.organizations.status, "active")));
  return rows.map((r) => r.id);
}

const MANAGER_ROLES: OrgRole[] = ["owner", "admin"];

export async function canEditCourse(v: Viewer | null, course: Course): Promise<boolean> {
  if (!v) return false;
  if (isAdmin(v)) return true;
  if (course.organizationId) {
    const r = await orgRole(v.id, course.organizationId);
    if (r && MANAGER_ROLES.includes(r)) return true;
    return course.ownerId === v.id && r !== null && isEducator(v);
  }
  return course.ownerId === v.id && isEducator(v);
}

export async function canViewPublishedCourse(v: Viewer | null, course: Course): Promise<boolean> {
  if (course.status !== "published" || !course.publishedVersionId) return false;
  if (course.visibility === "public" && !course.organizationId) return true;
  if (!v) return false;
  if (isAdmin(v) || course.ownerId === v.id) return true;
  if (course.organizationId && (course.visibility === "organization" || course.visibility === "public")) {
    return (await orgRole(v.id, course.organizationId)) !== null;
  }
  return false;
}

/** SQL filter for catalog listings: published and visible to this viewer. */
export async function catalogFilter(v: Viewer | null): Promise<SQL> {
  const publicCourses = and(eq(schema.courses.visibility, "public"), isNull(schema.courses.organizationId))!;
  const base = eq(schema.courses.status, "published");
  if (!v) return and(base, publicCourses)!;
  const orgs = await viewerOrgIds(v.id);
  const orgCourses = orgs.length ? inArray(schema.courses.organizationId, orgs) : undefined;
  return and(base, or(publicCourses, orgCourses, eq(schema.courses.ownerId, v.id)))!;
}

export async function loadCourse(courseId: string): Promise<Course> {
  const [c] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId));
  if (!c) throw new HttpError(404, "course_not_found");
  return c;
}

export async function loadEditableCourse(v: Viewer, courseId: string): Promise<Course> {
  const c = await loadCourse(courseId);
  // Return 404 rather than 403 so that course ids in other tenants cannot be probed.
  if (!(await canEditCourse(v, c))) throw new HttpError(404, "course_not_found");
  return c;
}

/** Who may read a source document's content (not just its existence). */
export async function canAccessDocument(v: Viewer | null, doc: Doc): Promise<boolean> {
  if (!v || doc.deletedAt) return false;
  if (doc.ownerId === v.id) return true;
  if (isAdmin(v)) return true;
  if (doc.organizationId) {
    const r = await orgRole(v.id, doc.organizationId);
    return r === "owner" || r === "admin" || r === "reviewer";
  }
  return false;
}

export async function loadAccessibleDocument(v: Viewer, documentId: string): Promise<Doc> {
  const [d] = await db.select().from(schema.sourceDocuments).where(eq(schema.sourceDocuments.id, documentId));
  if (!d || !(await canAccessDocument(v, d))) throw new HttpError(404, "document_not_found");
  return d;
}

/** A document may only feed a course in the same tenant: same organization, or both personal and same owner. */
export function documentFitsCourse(doc: Doc, course: Course): boolean {
  if (course.organizationId) return doc.organizationId === course.organizationId;
  return doc.organizationId === null && doc.ownerId === course.ownerId;
}

export async function requireOrgRole(v: Viewer, organizationId: string, allowed: OrgRole[]): Promise<OrgRole | "platform_admin"> {
  if (isAdmin(v)) return "platform_admin";
  const r = await orgRole(v.id, organizationId);
  if (!r) throw new HttpError(404, "organization_not_found");
  if (!allowed.includes(r)) throw new HttpError(403, "forbidden");
  return r;
}
