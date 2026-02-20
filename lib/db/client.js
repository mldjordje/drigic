import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    const sql = neon(env.DATABASE_URL_RESOLVED);
    dbInstance = drizzle({ client: sql, schema });
  }

  return dbInstance;
}

export { schema };

