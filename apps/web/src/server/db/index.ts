import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

// Without a listener, an idle client error (e.g. the database restarting) crashes the process.
// The pool discards the broken client and the next query reconnects.
if (!pool.listenerCount("error")) {
  pool.on("error", (err) => console.error(JSON.stringify({ level: "error", msg: "db.pool_error", error: err.message })));
}

export const db = drizzle(pool, { schema });
export type DB = typeof db;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export { schema, pool };
