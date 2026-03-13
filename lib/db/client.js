import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

let dbInstance = null;
let poolInstance = null;

export function getDb() {
  if (!dbInstance) {
    poolInstance = new Pool({
      connectionString: env.DATABASE_URL_RESOLVED,
    });
    dbInstance = drizzle({ client: poolInstance, schema });
  }

  return dbInstance;
}

export { schema };
