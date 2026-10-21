/** Reset the E2E database, seed Academy content and create test accounts. Run via tsx (see global-setup). */
import { execSync } from "node:child_process";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { db, pool, schema } from "@/server/db";
import { E2E } from "./env";

async function main() {
  const tables = await db.execute<{ tablename: string }>(sql`select tablename from pg_tables where schemaname = 'public'`);
  await db.execute(sql.raw(`TRUNCATE ${tables.rows.map((r) => `"${r.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`));
  execSync("pnpm exec tsx scripts/seed.ts", { stdio: "inherit", env: { ...process.env } });
  const hash = await hashPassword(E2E.password);
  for (const [key, u] of Object.entries(E2E.users)) {
    const id = crypto.randomUUID();
    await db.insert(schema.users).values({ id, name: u.name, email: u.email, emailVerified: true });
    await db.insert(schema.accounts).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: hash });
    await db.insert(schema.profiles).values({ userId: id, displayName: u.name, educatorStatus: key.startsWith("educator") ? "approved" : "none" });
    const roles: ("learner" | "educator" | "admin")[] = ["learner"];
    if (key.startsWith("educator")) roles.push("educator");
    if (key === "admin") roles.push("admin");
    await db.insert(schema.roles).values(roles.map((role) => ({ userId: id, role })));
  }
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
