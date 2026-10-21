import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db, schema } from "@/server/db";
import { sendEmail } from "@/server/email";
import { log } from "@/server/log";

const secret = process.env.BETTER_AUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!secret || secret.startsWith("dev-only"))) {
  throw new Error("BETTER_AUTH_SECRET must be set to a strong random value in production");
}

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export const auth = betterAuth({
  appName: "DigitsNepal AI",
  secret,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      twoFactor: schema.twoFactors,
      rateLimit: schema.authRateLimits,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Reset your DigitsNepal password",
        `Hello ${user.name},\n\nUse this link to reset your password (valid for 1 hour):\n${url}\n\nIf you did not ask for this, you can ignore this email.`,
      );
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: process.env.AUTH_RATE_LIMIT !== "off",
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/two-factor/verify-totp": { window: 60, max: 6 },
    },
  },
  telemetry: { enabled: false },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: { generateId: () => crypto.randomUUID() },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Every account starts as a learner; admin is granted only to bootstrap emails.
          await db.insert(schema.profiles).values({ userId: user.id, displayName: user.name }).onConflictDoNothing();
          const grants: ("learner" | "admin")[] = ["learner"];
          if (adminEmails.has(user.email.toLowerCase())) grants.push("admin");
          await db
            .insert(schema.roles)
            .values(grants.map((role) => ({ userId: user.id, role })))
            .onConflictDoNothing();
          await db.insert(schema.auditEvents).values({
            actorId: user.id,
            action: "user.signed_up",
            targetType: "user",
            targetId: user.id,
            metadata: { roles: grants },
          });
          log.info("user.created", { userId: user.id, roles: grants });
        },
      },
    },
  },
  plugins: [twoFactor({ issuer: "DigitsNepal AI" }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
