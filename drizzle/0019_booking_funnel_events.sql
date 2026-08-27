CREATE TABLE IF NOT EXISTS "booking_funnel_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "session_id" varchar(128) NOT NULL,
  "step" varchar(48) NOT NULL,
  "locale" varchar(16),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "booking_funnel_events_created_idx"
  ON "booking_funnel_events" ("created_at");

CREATE INDEX IF NOT EXISTS "booking_funnel_events_step_idx"
  ON "booking_funnel_events" ("step");

CREATE INDEX IF NOT EXISTS "booking_funnel_events_session_idx"
  ON "booking_funnel_events" ("session_id");

CREATE UNIQUE INDEX IF NOT EXISTS "booking_funnel_events_session_step_idx"
  ON "booking_funnel_events" ("session_id", "step");
