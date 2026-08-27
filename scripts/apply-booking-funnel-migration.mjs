import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config();

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error("Missing database URL in environment");
  process.exit(1);
}

const sql = neon(connectionString);

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "booking_funnel_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "session_id" varchar(128) NOT NULL,
    "step" varchar(48) NOT NULL,
    "locale" varchar(16),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "booking_funnel_events_created_idx" ON "booking_funnel_events" USING btree ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "booking_funnel_events_step_idx" ON "booking_funnel_events" USING btree ("step")`,
  `CREATE INDEX IF NOT EXISTS "booking_funnel_events_session_idx" ON "booking_funnel_events" USING btree ("session_id")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "booking_funnel_events_session_step_idx" ON "booking_funnel_events" USING btree ("session_id","step")`,
];

try {
  console.log("Applying booking_funnel_events migration...");
  for (const stmt of STATEMENTS) {
    await sql.query(stmt);
  }
  const [row] = await sql.query(
    `SELECT count(*)::int AS total FROM "booking_funnel_events"`
  );
  console.log(
    `✓ booking_funnel_events ready (${row?.total ?? 0} rows)`
  );
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
}
