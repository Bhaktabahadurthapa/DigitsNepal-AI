import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { cache } from "react";
import { ZodError } from "zod";
import { auth } from "@/server/auth";
import { db, schema } from "@/server/db";
import { HttpError } from "@/server/errors";
import { log } from "@/server/log";

export type Role = "learner" | "educator" | "admin";

export type Viewer = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  twoFactorEnabled: boolean;
  isMinor: boolean;
  guardianConsent: boolean;
  educatorStatus: "none" | "pending" | "approved" | "rejected";
  preferredLanguage: "en" | "ne";
};

export { HttpError };

export async function loadViewer(userId: string): Promise<Viewer | null> {
  const [u] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      twoFactorEnabled: schema.users.twoFactorEnabled,
      isMinor: schema.profiles.isMinor,
      guardianConsentAt: schema.profiles.guardianConsentAt,
      educatorStatus: schema.profiles.educatorStatus,
      preferredLanguage: schema.profiles.preferredLanguage,
    })
    .from(schema.users)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(eq(schema.users.id, userId));
  if (!u) return null;
  const roleRows = await db.select({ role: schema.roles.role }).from(schema.roles).where(eq(schema.roles.userId, userId));
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    roles: roleRows.map((r) => r.role),
    twoFactorEnabled: !!u.twoFactorEnabled,
    isMinor: !!u.isMinor,
    guardianConsent: !!u.guardianConsentAt,
    educatorStatus: u.educatorStatus ?? "none",
    preferredLanguage: u.preferredLanguage ?? "en",
  };
}

/** Request-scoped viewer lookup (deduplicated per render with React cache). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return loadViewer(session.user.id);
});

export function hasRole(v: Viewer | null, role: Role): boolean {
  if (!v) return false;
  return v.roles.includes(role) || (role !== "admin" && v.roles.includes("admin"));
}

export async function requireViewer(next = "/dashboard/learner"): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return v;
}

export async function requireRole(role: Role, next: string): Promise<Viewer> {
  const v = await requireViewer(next);
  if (!hasRole(v, role)) redirect(role === "educator" ? "/dashboard/learner?educator=required" : "/dashboard/learner");
  return v;
}

/** Administration requires the admin role AND enabled TOTP two-factor authentication. */
export async function requireAdmin(): Promise<Viewer> {
  const v = await requireRole("admin", "/admin");
  if (!v.twoFactorEnabled) redirect("/settings/security?mfa=required");
  return v;
}

// ─── Route-handler helpers ──────────────────────────────────────────────────
export async function apiViewer(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) throw new HttpError(401, "unauthenticated");
  return v;
}

export async function apiRole(role: Role): Promise<Viewer> {
  const v = await apiViewer();
  if (!hasRole(v, role)) throw new HttpError(403, "forbidden");
  if (role === "admin" && !v.twoFactorEnabled) throw new HttpError(403, "mfa_required");
  return v;
}

/** CSRF defence for cookie-authenticated mutations: require a same-origin request. */
export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) throw new HttpError(403, "bad_origin");
  try {
    if (new URL(origin).host !== host) throw new HttpError(403, "bad_origin");
  } catch {
    throw new HttpError(403, "bad_origin");
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler: same-origin check, typed errors → JSON, no stack traces leaked. */
export function route<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
      }
      if (e instanceof SyntaxError) {
        return NextResponse.json({ error: "invalid_json" }, { status: 400 });
      }
      if (e instanceof ZodError) {
        return NextResponse.json({ error: "invalid_input", issues: e.issues.slice(0, 10) }, { status: 400 });
      }
      log.error("api.unhandled", { path: new URL(req.url).pathname, error: String(e) });
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
  };
}
