WITH ranked AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY "user_id", "type", "message"
      ORDER BY "created_at", "id"
    ) AS duplicate_rank
  FROM "notifications"
)
DELETE FROM "notifications" n
USING ranked
WHERE n.ctid = ranked.ctid
  AND ranked.duplicate_rank > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_user_type_message_unique"
ON "notifications" USING btree ("user_id", "type", "message");
