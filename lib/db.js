import "server-only";
import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";

let sqlClient = null;

export function getSql() {
  if (!sqlClient) {
    sqlClient = neon(env.DATABASE_URL_RESOLVED);
  }

  return sqlClient;
}
